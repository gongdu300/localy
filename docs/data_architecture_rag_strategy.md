# Travel OS 데이터 아키텍처 & RAG 전략
## 하이브리드 멀티모달 데이터 시스템

> 단순 RDS + Vector DB를 넘어선 **지능형 데이터 레이어** 설계

---

## 📚 목차

1. [현재 계획 vs 개선안](#1-현재-계획-vs-개선안)
2. [하이브리드 저장 전략](#2-하이브리드-저장-전략)
3. [멀티모달 RAG 시스템](#3-멀티모달-rag-시스템)
4. [실시간 데이터 파이프라인](#4-실시간-데이터-파이프라인)
5. [캐싱 & 성능 최적화](#5-캐싱--성능-최적화)
6. [개인정보 & 보안](#6-개인정보--보안)

---

## 1. 현재 계획 vs 개선안

### 1.1 현재 계획 (Good)

```
PostgreSQL (RDS)          Vector DB (Pinecone)
├─ 구조화 데이터           ├─ 대화 로그 임베딩
├─ 여행 기록              ├─ 사용자 선호도 벡터
└─ 맛집/숙소 정보         └─ 리뷰 임베딩
```

**문제점:**
1. ❌ 정형/비정형 데이터 분리 → 검색 비효율
2. ❌ 관계 데이터 표현 한계 (친구 관계, POI 연결 등)
3. ❌ 실시간 데이터 처리 부족
4. ❌ 대화 로그만 벡터화 → 다른 데이터도 검색 가능해야 함

### 1.2 개선안 (Better)

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   Unified Query Layer                        │
│          "Single Entry Point for All Data Access"           │
│                                                             │
│  - Query Router (어디서 검색할지 자동 결정)                    │
│  - Hybrid Search (BM25 + Vector + Graph)                   │
│  - Result Fusion (여러 소스 결과 통합)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Vector DB│  │  Graph DB │  │    RDS   │  │  Cache   │   │
│  │ (Pinecone)│  │  (Neo4j)  │  │(Postgres)│  │ (Redis)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Time-Series│  │ Object   │  │ Search   │                 │
│  │(InfluxDB) │  │Store(S3) │  │(Elastic) │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 하이브리드 저장 전략

### 2.1 데이터 분류 & 저장소 선택

#### 원칙: **"Right Data, Right Place"**

| 데이터 유형 | 저장소 | 이유 |
|------------|--------|------|
| **대화 로그** | Vector DB + RDS | 임베딩 검색 + 시간순 조회 둘 다 필요 |
| **사용자 선호도** | Vector DB + Graph DB | 유사도 검색 + 관계 분석 |
| **여행 이력** | RDS + Vector DB | 정형 쿼리 + 의미 검색 |
| **맛집/POI 정보** | ElasticSearch + Vector DB | 전문 검색 + 의미 검색 |
| **GPS 궤적** | Time-Series DB | 시계열 데이터 특화 |
| **사진/영상** | Object Store (S3) + Vector DB | 파일 저장 + 이미지 임베딩 |
| **관계 데이터** | Graph DB | 친구, POI 연결, 추천 경로 |
| **실시간 상태** | Redis | 빠른 읽기/쓰기 |

### 2.2 구체적 저장 전략

#### 2.2.1 대화 로그 (Dual Storage)

```python
class ConversationLogger:
    """대화를 두 곳에 동시 저장"""
    
    async def log_conversation(self, user_id: str, message: dict):
        # 1. PostgreSQL (시간순 조회용)
        await self.postgres.execute("""
            INSERT INTO conversations (user_id, role, content, timestamp)
            VALUES ($1, $2, $3, $4)
        """, user_id, message['role'], message['content'], datetime.now())
        
        # 2. Vector DB (의미 검색용)
        embedding = await self.embeddings.embed_query(message['content'])
        
        await self.pinecone.upsert(
            vectors=[{
                'id': f"{user_id}_{timestamp}",
                'values': embedding,
                'metadata': {
                    'user_id': user_id,
                    'role': message['role'],
                    'content': message['content'],
                    'timestamp': timestamp,
                    'trip_id': message.get('trip_id'),
                    'intent': message.get('intent')
                }
            }]
        )
    
    async def search_relevant_conversations(self, user_id: str, query: str, k: int = 5):
        """의미 기반 대화 검색"""
        query_embedding = await self.embeddings.embed_query(query)
        
        results = await self.pinecone.query(
            vector=query_embedding,
            filter={'user_id': user_id},
            top_k=k,
            include_metadata=True
        )
        
        return results['matches']
```

#### 2.2.2 Graph DB로 관계 표현

```python
# Neo4j로 복잡한 관계 저장

from neo4j import GraphDatabase

class TravelGraphDB:
    """여행 관계 그래프"""
    
    def __init__(self):
        self.driver = GraphDatabase.driver("bolt://localhost:7687")
    
    def create_user_preference_graph(self, user_id: str):
        """사용자 선호도 그래프 생성"""
        
        with self.driver.session() as session:
            # 사용자 노드
            session.run("""
                MERGE (u:User {id: $user_id})
            """, user_id=user_id)
            
            # 좋아하는 음식
            session.run("""
                MATCH (u:User {id: $user_id})
                MERGE (c:Cuisine {name: $cuisine})
                MERGE (u)-[:LIKES {strength: $strength}]->(c)
            """, user_id=user_id, cuisine="Italian", strength=0.9)
            
            # 방문한 장소
            session.run("""
                MATCH (u:User {id: $user_id})
                MERGE (p:Place {id: $place_id})
                MERGE (u)-[:VISITED {
                    date: $date,
                    rating: $rating,
                    revisit: $revisit
                }]->(p)
            """, user_id=user_id, place_id="place_123", 
                 date="2024-01-01", rating=4.5, revisit=True)
    
    def find_similar_users(self, user_id: str):
        """유사한 사용자 찾기 (협업 필터링)"""
        
        with self.driver.session() as session:
            result = session.run("""
                MATCH (u1:User {id: $user_id})-[:LIKES]->(c:Cuisine)<-[:LIKES]-(u2:User)
                WHERE u1 <> u2
                WITH u2, COUNT(c) as common_cuisines
                ORDER BY common_cuisines DESC
                LIMIT 10
                RETURN u2.id, common_cuisines
            """, user_id=user_id)
            
            return [record for record in result]
    
    def recommend_based_on_friends(self, user_id: str):
        """친구가 좋아한 곳 추천"""
        
        with self.driver.session() as session:
            result = session.run("""
                MATCH (u:User {id: $user_id})-[:FRIEND]->(friend:User)
                      -[:VISITED {rating: r}]->(p:Place)
                WHERE r >= 4.0
                  AND NOT (u)-[:VISITED]->(p)
                WITH p, AVG(r) as avg_rating, COUNT(friend) as friend_count
                ORDER BY avg_rating DESC, friend_count DESC
                LIMIT 10
                RETURN p.id, p.name, avg_rating, friend_count
            """, user_id=user_id)
            
            return [record for record in result]
```

#### 2.2.3 ElasticSearch로 전문 검색

```python
from elasticsearch import AsyncElasticsearch

class RestaurantSearchEngine:
    """맛집 전문 검색 엔진"""
    
    def __init__(self):
        self.es = AsyncElasticsearch(['http://localhost:9200'])
    
    async def index_restaurant(self, restaurant: dict):
        """맛집 인덱싱"""
        
        await self.es.index(
            index='restaurants',
            id=restaurant['id'],
            document={
                'name': restaurant['name'],
                'cuisine': restaurant['cuisine'],
                'location': restaurant['location'],  # Geo-point
                'description': restaurant['description'],
                'menu_items': restaurant['menu_items'],
                'reviews': restaurant['reviews'],
                'price_level': restaurant['price_level'],
                'rating': restaurant['rating']
            }
        )
    
    async def search(self, query: str, location: dict = None, filters: dict = None):
        """복합 검색"""
        
        # 1. Full-text search (BM25)
        must_clauses = [
            {
                'multi_match': {
                    'query': query,
                    'fields': ['name^3', 'description^2', 'menu_items', 'reviews'],
                    'type': 'best_fields'
                }
            }
        ]
        
        # 2. 위치 필터 (있으면)
        if location:
            must_clauses.append({
                'geo_distance': {
                    'distance': '2km',
                    'location': location
                }
            })
        
        # 3. 기타 필터
        filter_clauses = []
        if filters:
            if 'cuisine' in filters:
                filter_clauses.append({'term': {'cuisine': filters['cuisine']}})
            if 'max_price' in filters:
                filter_clauses.append({'range': {'price_level': {'lte': filters['max_price']}}})
        
        body = {
            'query': {
                'bool': {
                    'must': must_clauses,
                    'filter': filter_clauses
                }
            },
            'sort': [
                {'_score': 'desc'},
                {'rating': 'desc'}
            ]
        }
        
        results = await self.es.search(index='restaurants', body=body)
        return results['hits']['hits']
```

---

## 3. 멀티모달 RAG 시스템

### 3.1 Hybrid Search (Vector + Keyword)

```python
class HybridRAG:
    """Vector Search + BM25를 결합한 하이브리드 검색"""
    
    def __init__(self):
        self.vector_store = Pinecone(...)
        self.bm25_retriever = BM25Retriever(...)
        self.elastic = AsyncElasticsearch(...)
    
    async def retrieve(self, query: str, user_context: dict, k: int = 10):
        """하이브리드 검색"""
        
        # 1. Vector Search (의미 기반)
        query_embedding = await self.embeddings.embed_query(query)
        
        vector_results = await self.vector_store.query(
            vector=query_embedding,
            filter={
                'user_id': user_context['user_id'],
                # 최근 30일 대화만
                'timestamp': {'$gte': datetime.now() - timedelta(days=30)}
            },
            top_k=k
        )
        
        # 2. BM25 Search (키워드 기반)
        bm25_results = await self.elastic.search(
            index='conversations',
            body={
                'query': {
                    'bool': {
                        'must': [
                            {'match': {'content': query}},
                            {'term': {'user_id': user_context['user_id']}}
                        ]
                    }
                }
            },
            size=k
        )
        
        # 3. Reciprocal Rank Fusion (RRF)
        fused_results = self.reciprocal_rank_fusion(
            [vector_results, bm25_results],
            k=60  # RRF 파라미터
        )
        
        return fused_results[:k]
    
    def reciprocal_rank_fusion(self, result_lists, k=60):
        """여러 검색 결과를 통합"""
        
        scores = {}
        
        for results in result_lists:
            for rank, doc in enumerate(results):
                doc_id = doc['id']
                # RRF 공식: 1 / (k + rank)
                scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
        
        # 점수 순 정렬
        sorted_docs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        return sorted_docs
```

### 3.2 Contextual RAG (컨텍스트 인식)

```python
class ContextualRAG:
    """사용자 컨텍스트를 고려한 RAG"""
    
    async def retrieve_with_context(self, query: str, user_id: str):
        """컨텍스트 기반 검색"""
        
        # 1. 사용자 현재 상태 파악
        user_state = await self.get_user_state(user_id)
        
        # 2. 쿼리 확장 (Query Expansion)
        expanded_query = await self.expand_query(query, user_state)
        
        # 3. 계층적 검색
        results = {
            # 개인 대화 (가장 중요)
            'personal': await self.search_personal_history(
                user_id, expanded_query, weight=0.5
            ),
            
            # 유사 사용자 경험
            'collaborative': await self.search_similar_users(
                user_id, expanded_query, weight=0.3
            ),
            
            # 일반 지식베이스
            'general': await self.search_knowledge_base(
                expanded_query, weight=0.2
            )
        }
        
        # 4. 가중 통합
        combined = self.weighted_fusion(results)
        
        return combined
    
    async def expand_query(self, query: str, user_state: dict):
        """사용자 상태로 쿼리 확장"""
        
        # 현재 여행 중이면 목적지 추가
        if user_state.get('active_trip'):
            destination = user_state['active_trip']['destination']
            query = f"{query} {destination}"
        
        # 선호도 추가
        if user_state.get('food_preferences'):
            prefs = ', '.join(user_state['food_preferences'][:3])
            query = f"{query} (좋아하는 음식: {prefs})"
        
        return query
```

### 3.3 Self-Reflective RAG (자기 검증)

```python
class SelfReflectiveRAG:
    """검색 결과를 검증하고 개선하는 RAG"""
    
    async def retrieve_and_verify(self, query: str, user_id: str):
        """검색 → 검증 → 재검색 루프"""
        
        max_iterations = 3
        
        for iteration in range(max_iterations):
            # 1. 검색
            docs = await self.hybrid_search(query, user_id)
            
            # 2. 관련성 검증
            relevance_scores = await self.verify_relevance(query, docs)
            
            # 3. 충분히 관련성 있으면 종료
            if all(score > 0.7 for score in relevance_scores):
                return docs
            
            # 4. 쿼리 개선
            query = await self.improve_query(query, docs, relevance_scores)
        
        return docs
    
    async def verify_relevance(self, query: str, docs: list):
        """LLM으로 관련성 검증"""
        
        prompt = f"""
        Query: {query}
        
        Documents:
        {self.format_docs(docs)}
        
        For each document, rate relevance 0.0-1.0:
        """
        
        response = await self.llm.ainvoke(prompt)
        scores = self.parse_scores(response)
        
        return scores
    
    async def improve_query(self, original_query: str, docs: list, scores: list):
        """쿼리 개선"""
        
        # 낮은 점수 문서 분석
        low_score_docs = [doc for doc, score in zip(docs, scores) if score < 0.5]
        
        prompt = f"""
        Original query: {original_query}
        
        Retrieved documents were not relevant enough.
        Low-relevance documents:
        {self.format_docs(low_score_docs)}
        
        Suggest an improved query that would retrieve more relevant information.
        """
        
        improved = await self.llm.ainvoke(prompt)
        
        return improved
```

---

## 4. 실시간 데이터 파이프라인

### 4.1 Streaming Pipeline

```python
from kafka import KafkaProducer, KafkaConsumer
import asyncio

class RealTimeDataPipeline:
    """실시간 데이터 수집 → 처리 → 저장"""
    
    def __init__(self):
        self.kafka_producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
    
    async def process_user_event(self, event: dict):
        """사용자 이벤트 실시간 처리"""
        
        # 1. Kafka로 전송 (비동기 처리)
        self.kafka_producer.send('user-events', event)
        
        # 2. 중요 이벤트는 즉시 처리
        if event['type'] in ['gps_update', 'urgent_request']:
            await self.process_immediately(event)
    
    async def consume_and_store(self):
        """Kafka 소비 → 저장"""
        
        consumer = KafkaConsumer(
            'user-events',
            bootstrap_servers=['localhost:9092'],
            auto_offset_reset='earliest'
        )
        
        for message in consumer:
            event = json.loads(message.value)
            
            # 병렬 저장
            await asyncio.gather(
                # RDS
                self.store_to_rds(event),
                # Vector DB (임베딩)
                self.store_to_vector_db(event),
                # Cache 업데이트
                self.update_cache(event)
            )
```

### 4.2 Change Data Capture (CDC)

```python
from debezium import DebeziumClient

class DatabaseSyncService:
    """RDS 변경사항을 자동으로 Vector DB에 동기화"""
    
    def __init__(self):
        self.debezium = DebeziumClient(...)
        self.vector_store = Pinecone(...)
    
    async def sync_on_change(self):
        """RDS 변경 감지 → Vector DB 업데이트"""
        
        async for change in self.debezium.stream():
            if change['table'] == 'restaurants':
                if change['operation'] == 'INSERT':
                    await self.add_to_vector_db(change['data'])
                
                elif change['operation'] == 'UPDATE':
                    await self.update_vector_db(change['data'])
                
                elif change['operation'] == 'DELETE':
                    await self.remove_from_vector_db(change['id'])
```

---

## 5. 캐싱 & 성능 최적화

### 5.1 Multi-Layer Cache

```python
class MultiLayerCache:
    """3단계 캐싱 전략"""
    
    def __init__(self):
        # L1: In-memory (가장 빠름)
        self.l1_cache = {}
        
        # L2: Redis (빠름)
        self.l2_cache = redis.Redis(...)
        
        # L3: PostgreSQL (느림)
        self.l3_db = PostgreSQL(...)
    
    async def get(self, key: str):
        """계층적 조회"""
        
        # L1 확인
        if key in self.l1_cache:
            return self.l1_cache[key]
        
        # L2 확인
        value = await self.l2_cache.get(key)
        if value:
            self.l1_cache[key] = value  # L1에 승격
            return value
        
        # L3 확인
        value = await self.l3_db.get(key)
        if value:
            await self.l2_cache.set(key, value, ex=3600)  # L2에 저장
            self.l1_cache[key] = value  # L1에도 저장
            return value
        
        return None
    
    async def set(self, key: str, value: any, ttl: int = 3600):
        """모든 레이어에 저장"""
        
        # L1
        self.l1_cache[key] = value
        
        # L2
        await self.l2_cache.set(key, value, ex=ttl)
        
        # L3 (선택적)
        if self.should_persist(key):
            await self.l3_db.set(key, value)
```

### 5.2 선제적 캐싱

```python
class PredictiveCaching:
    """사용자 행동 예측 기반 선제적 캐싱"""
    
    async def predict_and_cache(self, user_id: str):
        """다음에 필요할 데이터 미리 로드"""
        
        # 1. 사용자 패턴 분석
        patterns = await self.analyze_user_patterns(user_id)
        
        # 2. 다음 액션 예측
        predicted_actions = self.ml_model.predict(patterns)
        
        # 3. 미리 캐싱
        for action in predicted_actions:
            if action == 'search_restaurant':
                # 주변 맛집 미리 로드
                await self.preload_nearby_restaurants(user_id)
            
            elif action == 'check_route':
                # 경로 정보 미리 계산
                await self.precompute_routes(user_id)
```

---

## 6. 개인정보 & 보안

### 6.1 데이터 암호화

```python
from cryptography.fernet import Fernet

class SecureDataManager:
    """민감 정보 암호화"""
    
    def __init__(self):
        self.cipher = Fernet(Fernet.generate_key())
    
    async def store_sensitive_data(self, user_id: str, data: dict):
        """민감 정보 암호화 저장"""
        
        # 암호화
        encrypted = {
            'credit_card': self.cipher.encrypt(data['credit_card'].encode()),
            'phone': self.cipher.encrypt(data['phone'].encode()),
        }
        
        # Vector DB에는 암호화된 상태로
        await self.vector_store.upsert({
            'user_id': user_id,
            'encrypted_data': encrypted
        })
    
    def decrypt(self, encrypted_data: bytes) -> str:
        """복호화"""
        return self.cipher.decrypt(encrypted_data).decode()
```

### 6.2 GDPR 준수 (잊혀질 권리)

```python
class GDPRCompliance:
    """사용자 데이터 완전 삭제"""
    
    async def delete_user_data(self, user_id: str):
        """모든 저장소에서 삭제"""
        
        await asyncio.gather(
            # Vector DB
            self.vector_store.delete(filter={'user_id': user_id}),
            
            # RDS
            self.postgres.execute("DELETE FROM users WHERE user_id = $1", user_id),
            self.postgres.execute("DELETE FROM trips WHERE user_id = $1", user_id),
            
            # Graph DB
            self.neo4j.run("MATCH (u:User {id: $user_id}) DETACH DELETE u", user_id=user_id),
            
            # Cache
            self.redis.delete(f"user:{user_id}:*"),
            
            # ElasticSearch
            self.elastic.delete_by_query(
                index='*',
                body={'query': {'term': {'user_id': user_id}}}
            )
        )
```

---

## 🎯 최종 권장 아키텍처

```python
class TravelOSDataLayer:
    """통합 데이터 레이어"""
    
    def __init__(self):
        # 1. 핵심 저장소
        self.postgres = PostgreSQL(...)      # 정형 데이터
        self.pinecone = Pinecone(...)         # 벡터 검색
        self.neo4j = Neo4j(...)               # 관계 데이터
        self.elastic = Elasticsearch(...)     # 전문 검색
        
        # 2. 성능 레이어
        self.redis = Redis(...)               # 캐시
        self.influxdb = InfluxDB(...)         # 시계열
        
        # 3. RAG 시스템
        self.hybrid_rag = HybridRAG(...)
        self.contextual_rag = ContextualRAG(...)
        
        # 4. 실시간 파이프라인
        self.kafka = KafkaPipeline(...)
        
    async def query(self, query: str, user_id: str, context: dict):
        """Unified Query Interface"""
        
        # 1. 캐시 확인
        cached = await self.redis.get(f"query:{user_id}:{hash(query)}")
        if cached:
            return cached
        
        # 2. 하이브리드 RAG
        retrieved_docs = await self.hybrid_rag.retrieve(
            query, 
            user_context=context
        )
        
        # 3. Graph 보강 (관계 정보)
        graph_context = await self.neo4j.get_related_context(user_id)
        
        # 4. 결과 통합
        result = self.synthesize(retrieved_docs, graph_context)
        
        # 5. 캐싱
        await self.redis.set(f"query:{user_id}:{hash(query)}", result, ex=3600)
        
        return result
```

---

## ✅ 체크리스트

**즉시 구현:**
- [x] PostgreSQL (정형 데이터)
- [x] Pinecone (벡터 검색)
- [x] Redis (캐싱)

**Phase 2:**
- [ ] Neo4j (관계 데이터)
- [ ] ElasticSearch (전문 검색)
- [ ] Kafka (실시간 파이프라인)

**Phase 3:**
- [ ] InfluxDB (GPS 궤적)
- [ ] S3 (사진/영상)
- [ ] CDC (자동 동기화)

---

**이 아키텍처로 Travel OS는 진짜 운영체제급 데이터 처리 능력을 갖추게 됩니다!** 🚀

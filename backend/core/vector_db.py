"""
Vector DB Client (ChromaDB)
- 여행 지식 및 개인화 여행 로그 저장/검색
- DB 경로: ./chroma_db
"""
import os
import logging
from typing import List, Dict
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# OpenAI 임베딩 설정
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class VectorDBClient:
    def __init__(self):
        # 로컬 파일에 저장 (persist_directory)
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
        # 임베딩 함수 (OpenAI)
        if OPENAI_API_KEY:
            self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
                api_key=OPENAI_API_KEY,
                model_name="text-embedding-3-small"
            )
        else:
            logger.warning("OPENAI_API_KEY not found. Using default embedding (SentenceTransformer).")
            self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()

    def ensure_collection(self, collection_name: str):
        """컬렉션 존재 확인 및 생성 (Chroma는 get_or_create 지원)"""
        try:
            self.client.get_or_create_collection(
                name=collection_name,
                embedding_function=self.embedding_fn
            )
            logger.info(f"컬렉션 확인/생성: {collection_name}")
        except Exception as e:
            logger.error(f"컬렉션 생성 실패: {e}")

    def add_documents(self, collection_name: str, documents: List[Dict]):
        """문서 추가 (text 필드 필수)"""
        collection = self.client.get_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )
        
        ids = [str(i) for i in range(len(documents))] # 간단한 ID 생성 (실제론 UUID 권장)
        documents_text = [doc["text"] for doc in documents]
        metadatas = [doc for doc in documents] # 메타데이터에 원본 전체 저장
        
        collection.upsert(
            ids=ids,
            documents=documents_text,
            metadatas=metadatas
        )
        logger.info(f"{len(documents)}개 문서 저장 완료 ({collection_name})")
        
    def search(self, collection_name: str, query: str, limit: int = 3) -> List[Dict]:
        """유사 문서 검색"""
        collection = self.client.get_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )
        
        results = collection.query(
            query_texts=[query],
            n_results=limit
        )
        
        # Chroma 결과 포맷 파싱
        # results['metadatas']는 리스트의 리스트 형태 [[{meta1}, {meta2}]]
        if results['metadatas']:
            return results['metadatas'][0]
        return []

# 싱글톤 인스턴스
vector_db = VectorDBClient()

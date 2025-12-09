"""
Vector DB 초기화 스크립트 (ChromaDB)
"""
import logging
import sys
import os

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from core.vector_db import vector_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_vector_db():
    print("🚀 Vector DB (ChromaDB) 초기화 시작...")
    
    # 컬렉션 정의
    collections = ["personal_journey", "travel_knowledge"]
    
    for name in collections:
        vector_db.ensure_collection(name)
        print(f"✅ 컬렉션 준비: {name}")
        
    # 초기 데이터 예시 (여행 지식)
    # ChromaDB는 upsert 시 기존 ID를 덮어쓰므로 반복 실행해도 안전
    knowledge_data = [
        {"text": "부산 해운대는 여름철에 사람이 매우 많으며, 주차 공간이 부족하다.", "category": "tip", "region": "부산"},
        {"text": "강릉 커피거리는 안목해변에 위치하며, 다양한 로스터리 카페가 있다.", "category": "place", "region": "강릉"},
        {"text": "제주도 성산일출봉은 일출 명소로 유명하며 입장료가 있다.", "category": "place", "region": "제주"}
    ]
    
    vector_db.add_documents("travel_knowledge", knowledge_data)
    print("✅ 초기 데이터 적재 완료")

if __name__ == "__main__":
    init_vector_db()

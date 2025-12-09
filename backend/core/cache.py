"""Simple Cache for LangGraph API"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib
import json

class SimpleCache:
    """간단한 메모리 캐시"""
    
    def __init__(self, ttl_seconds: int = 300):
        """
        Args:
            ttl_seconds: 캐시 유효 시간 (기본 5분)
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = timedelta(seconds=ttl_seconds)
    
    def _make_key(self, message: str, intent: str = "") -> str:
        """메시지를 캐시 키로 변환"""
        combined = f"{message.lower().strip()}:{intent}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get(self, message: str, intent: str = "") -> Optional[Dict[str, Any]]:
        """캐시에서 결과 가져오기"""
        key = self._make_key(message, intent)
        
        if key in self.cache:
            cached_data = self.cache[key]
            
            # 만료 시간 확인
            if datetime.now() - cached_data['timestamp'] < self.ttl:
                print(f"⚡ [Cache HIT] {message[:30]}...")
                return cached_data['result']
            else:
                # 만료된 캐시 삭제
                del self.cache[key]
                print(f"🗑️ [Cache EXPIRED] {message[:30]}...")
        
        print(f"❌ [Cache MISS] {message[:30]}...")
        return None
    
    def set(self, message: str, result: Dict[str, Any], intent: str = ""):
        """캐시에 결과 저장"""
        key = self._make_key(message, intent)
        self.cache[key] = {
            'result': result,
            'timestamp': datetime.now()
        }
        print(f"💾 [Cache SET] {message[:30]}... (TTL: {self.ttl.seconds}s)")
    
    def clear(self):
        """캐시 전체 삭제"""
        self.cache.clear()
        print("🧹 [Cache CLEARED]")
    
    def size(self) -> int:
        """캐시 크기"""
        return len(self.cache)


# 전역 캐시 인스턴스
langgraph_cache = SimpleCache(ttl_seconds=300)  # 5분

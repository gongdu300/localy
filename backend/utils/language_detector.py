"""
언어 감지 유틸리티
주 언어를 감지하여 한국어/영어 판단
"""
import re
from typing import Literal

def detect_primary_language(text: str) -> Literal["ko", "en"]:
    """
    텍스트의 주 언어 감지
    
    Args:
        text: 입력 텍스트
        
    Returns:
        "ko" (한국어) or "en" (영어)
        
    Examples:
        >>> detect_primary_language("부산 맛집 추천해줘")
        'ko'
        >>> detect_primary_language("Recommend restaurants in Busan")
        'en'
        >>> detect_primary_language("부산 맛집 with great view")
        'ko'
        >>> detect_primary_language("Recommend 해운대 restaurants")
        'en'
    """
    
    # 한글 문자 수 계산 (가-힣)
    korean_chars = len(re.findall(r'[가-힣]', text))
    
    # 영어 문자 수 계산 (A-Za-z)
    english_chars = len(re.findall(r'[A-Za-z]', text))
    
    # 둘 다 없으면 기본값
    if korean_chars == 0 and english_chars == 0:
        return "en"
    
    # 한국어만 있으면 한국어
    if korean_chars > 0 and english_chars == 0:
        return "ko"
    
    # 영어만 있으면 영어
    if english_chars > 0 and korean_chars == 0:
        return "en"
    
    # 둘 다 있으면: 50% 이상이 한국어면 한국어 (더 관대하게)
    total = korean_chars + english_chars
    korean_ratio = korean_chars / total
    
    return "ko" if korean_ratio >= 0.5 else "en"



def should_use_tts(text: str) -> bool:
    """
    TTS 사용 여부 결정
    
    영어가 주 언어일 때만 TTS 사용
    
    Args:
        text: 입력 텍스트
        
    Returns:
        True (TTS 사용) or False (텍스트만)
    """
    return detect_primary_language(text) == "en"


if __name__ == "__main__":
    # 테스트
    test_cases = [
        ("부산 맛집 추천해줘", "ko"),
        ("Recommend restaurants in Busan", "en"),
        ("부산 맛집 with great view", "ko"),
        ("Recommend 해운대 restaurants", "en"),
        ("안녕하세요! How are you?", "ko"),
        ("Hello! 반갑습니다", "en"),
        ("강남 카페", "ko"),
        ("Gangnam cafe", "en"),
    ]
    
    print("🧪 언어 감지 테스트\n")
    print(f"{'입력':<40} {'예상':<5} {'결과':<5} {'상태'}")
    print("="*60)
    
    for text, expected in test_cases:
        result = detect_primary_language(text)
        status = "✅" if result == expected else "❌"
        print(f"{text:<40} {expected:<5} {result:<5} {status}")
    
    print("\n" + "="*60)
    print("✅ 테스트 완료!")

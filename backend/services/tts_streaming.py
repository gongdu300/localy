"""
실시간 TTS 스트리밍 서비스
"""
import asyncio
import re
from typing import Optional
from services.tts_client import tts_client

# TTS 캐시 (세션별로 관리해야 하지만 일단 global)
_tts_cache: dict[str, str] = {}


def split_into_sentences(text: str) -> list[str]:
    """
    텍스트를 문장으로 분리
    
    Args:
        text: 입력 텍스트
        
    Returns:
        문장 리스트
    """
    # 문장 종결 기호로 분리
    sentences = re.split(r'([.!?。！？]+)', text)
    
    result = []
    for i in range(0, len(sentences)-1, 2):
        sentence = sentences[i].strip()
        punctuation = sentences[i+1] if i+1 < len(sentences) else ''
        if sentence:
            result.append(sentence + punctuation)
    
    # 마지막 문장 (종결 기호 없을 수 있음)
    if len(sentences) % 2 == 1 and sentences[-1].strip():
        result.append(sentences[-1].strip())
    
    return result


async def generate_tts_for_new_sentence(
    accumulated_text: str,
    previous_text: str = ""
) -> Optional[str]:
    """
    새로운 문장이 완성되면 TTS 생성
    
    Args:
        accumulated_text: 누적된 전체 텍스트
        previous_text: 이전 텍스트 (새 문장 감지용)
        
    Returns:
        Base64 인코딩된 오디오 or None (가장 최근 문장만)
    """
    global _tts_cache
    
    # 새로운 문장 감지
    current_sentences = split_into_sentences(accumulated_text)
    previous_sentences = split_into_sentences(previous_text)
    
    # 새 문장이 없으면 None
    if len(current_sentences) <= len(previous_sentences):
        return None
    
    # 모든 새로 완성된 문장 처리
    last_audio = None
    
    for i in range(len(previous_sentences), len(current_sentences)):
        new_sentence = current_sentences[i]
        
        # 문장이 완성됐는지 확인 (종결 기호로 끝나는지)
        if not new_sentence.rstrip().endswith(('.', '!', '?', '。', '！', '？')):
            continue  # 미완성 문장은 스킵
        
        # 캐시 확인
        if new_sentence in _tts_cache:
            last_audio = _tts_cache[new_sentence]
            continue
        
        # TTS 생성 (비동기)
        try:
            audio_base64 = await asyncio.to_thread(
                tts_client.synthesize_base64,
                new_sentence.strip()
            )
            
            if audio_base64:
                _tts_cache[new_sentence] = audio_base64
                last_audio = audio_base64
                print(f"🎤 TTS generated: {new_sentence[:50]}...")
            
        except Exception as e:
            print(f"⚠️ TTS generation failed: {e}")
    
    return last_audio


def clear_tts_cache():
    """TTS 캐시 초기화"""
    global _tts_cache
    _tts_cache.clear()


if __name__ == "__main__":
    # 테스트
    import asyncio
    
    async def test():
        text1 = "Hello! How are you"
        text2 = "Hello! How are you?"
        text3 = "Hello! How are you? I'm fine."
        
        print("Test 1: 미완성 문장")
        result = await generate_tts_for_new_sentence(text1)
        print(f"Result: {result is not None}\n")
        
        print("Test 2: 완성된 문장")
        result = await generate_tts_for_new_sentence(text2)
        print(f"Result: {result is not None}\n")
        
        print("Test 3: 두 번째 문장 추가")
        result = await generate_tts_for_new_sentence(text3, text2)
        print(f"Result: {result is not None}\n")
    
    asyncio.run(test())

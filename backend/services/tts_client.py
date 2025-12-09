"""
VibeVoice TTS 클라이언트
"""
import requests
import os
from typing import Optional
import base64

VIBEVOICE_TTS_URL = os.getenv("VIBEVOICE_TTS_URL", "https://lvnhh-125-6-60-5.a.free.pinggy.link")


class VibeVoiceTTSClient:
    """VibeVoice TTS 클라이언트"""
    
    def __init__(self, base_url: str = VIBEVOICE_TTS_URL):
        self.base_url = base_url.rstrip("/")
    
    def synthesize(self, text: str, cfg_scale: float = 1.5, timeout: int = 45) -> Optional[bytes]:
        """
        텍스트를 음성으로 변환 (바이너리)
        
        Args:
            text: 변환할 텍스트
            cfg_scale: CFG scale 값 (1.0-2.0, 기본값 1.5)
            timeout: 타임아웃 (초, 기본값 45)
            
        Returns:
            WAV 파일 바이트 or None
        """
        try:
            response = requests.post(
                f"{self.base_url}/synthesize",
                json={"text": text, "cfg_scale": cfg_scale},
                timeout=timeout
            )
            
            if response.status_code == 200:
                return response.content
            else:
                print(f"⚠️ TTS failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"⚠️ TTS error: {e}")
            return None
    
    def synthesize_base64(self, text: str, cfg_scale: float = 1.5) -> Optional[str]:
        """
        텍스트를 음성으로 변환 (Base64)
        
        Args:
            text: 변환할 텍스트
            cfg_scale: CFG scale
            
        Returns:
            Base64 인코딩된 WAV 오디오 or None
        """
        audio_bytes = self.synthesize(text, cfg_scale)
        
        if audio_bytes:
            return base64.b64encode(audio_bytes).decode('utf-8')
        return None
    
    def health_check(self) -> bool:
        """헬스 체크"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False


# Singleton instance
tts_client = VibeVoiceTTSClient()


if __name__ == "__main__":
    # 테스트
    print("🎤 VibeVoice TTS Client Test\n")
    
    # Health check
    if tts_client.health_check():
        print("✅ Health check passed\n")
    else:
        print("❌ Health check failed\n")
        exit(1)
    
    # TTS 테스트
    test_text = "Hello! Welcome to Travel OS."
    print(f"Testing: {test_text}")
    
    audio = tts_client.synthesize(test_text)
    
    if audio:
        with open("tts_client_test.wav", "wb") as f:
            f.write(audio)
        print(f"✅ TTS successful: {len(audio)} bytes")
        print(f"   Saved to: tts_client_test.wav")
    else:
        print("❌ TTS failed")

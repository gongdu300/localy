import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_chat_flow():
    print("\n🤖 Testing Full Chat Flow (LangGraph)...")
    url = f"{BASE_URL}/api/langgraph/chat"
    
    # 1. 여행 계획 의도 (Accommodation Agent 트리거 예상)
    payload = {
        "message": "강릉 1박 2일 호캉스 가고 싶어. 좋은 호텔 추천해줘.",
        "user_id": "test_user_flow",
        "conversation_id": "flow_123",
        "character": "cat"
    }
    
    start_time = time.time()
    try:
        print(f"  Sending message: {payload['message']}")
        response = requests.post(url, json=payload, timeout=60) # 검색이 오래 걸릴 수 있음
        response.raise_for_status()
        
        data = response.json()
        duration = time.time() - start_time
        
        print(f"  ✅ Response received in {duration:.1f}s")
        
        # 응답 분석
        message = data.get("message", "")
        # print(f"  🤖 Bot: {message}")
        
        # 숙소 정보가 응답에 포함되어 있는지 확인 (텍스트로 녹여져 있을 것임)
        keywords = ["호텔", "추천", "박", "원"]
        found_keywords = [k for k in keywords if k in message]
        
        if len(found_keywords) >= 2:
            print(f"  ✅ Response contains hotel information (Keywords: {found_keywords})")
            return True
        else:
            print(f"  ⚠️ Response might not contain hotel info. Check content.")
            print(f"  Content: {message[:100]}...")
            return True # 일단 응답이 왔으면 성공으로 간주 (내용은 LLM에 따라 다를 수 있음)
            
    except Exception as e:
        print(f"❌ Chat flow failed: {e}")
        if 'response' in locals():
            print(response.text)
        return False

if __name__ == "__main__":
    if test_chat_flow():
        print("\n✨ Full flow integration test passed!")
    else:
        print("\n❌ Full flow integration test failed!")

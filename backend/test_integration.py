import requests
import json

BASE_URL = "http://localhost:8000"

def test_accommodation_search():
    print("\n🏨 Testing Accommodation Search...")
    url = f"{BASE_URL}/agents/accommodation/search"
    payload = {
        "region": "서울 강남",
        "preference": "호텔",
        "num_results": 2
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Success: found {len(data.get('data', []))} places")
        # print(json.dumps(data, indent=2, ensure_ascii=False))
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        if response:
            print(response.text)
        return False

def test_persona_crud():
    print("\n👤 Testing Persona CRUD...")
    user_id = "test1"
    
    # 1. Get (might fail if not exists)
    url_get = f"{BASE_URL}/agents/persona/{user_id}"
    print(f"  Getting persona for {user_id}...")
    try:
        response = requests.get(url_get)
        if response.status_code == 200 and response.json().get('success'):
            print("  ✅ Persona exists")
        else:
            print("  ℹ️ Persona not found (expected for new db)")
            
            # 2. Create
            print(f"  Creating persona for {user_id}...")
            url_create = f"{BASE_URL}/agents/persona/create"
            payload = {
                "user_id": user_id,
                "age_group": "30대",
                "travel_style": ["힐링"],
                "budget_level": "중",
                "food_preferences": ["한식"],
                "accommodation_style": "호텔",
                "interests": ["자연"]
            }
            # user_id query param is required by the endpoint definition
            response = requests.post(url_create, params={"user_id": user_id}, json=payload)
            response.raise_for_status()
            print("  ✅ Created successfully")
            
    except Exception as e:
        print(f"❌ Persona test failed: {e}")
        return False
        
    return True

if __name__ == "__main__":
    print(f"Testing API at {BASE_URL}")
    acc_results = test_accommodation_search()
    persona_results = test_persona_crud()
    
    if acc_results and persona_results:
        print("\n✨ All integration tests passed!")
    else:
        print("\n⚠️ Some tests failed")

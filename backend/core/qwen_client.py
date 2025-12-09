"""
Remote Qwen Client
- KAMP 컴퓨터(또는 원격 서버)의 vLLM API 호출
- uses openai python client library for better compatibility
"""
import os
import logging
import json
from dotenv import load_dotenv
from openai import OpenAI

# 캐릭터 시스템 프롬프트 import
import sys
from pathlib import Path
# agents 폴더를 import 경로에 추가
sys.path.insert(0, str(Path(__file__).parent.parent / "agents"))
from character_system_prompts import KKACHIL_SYSTEM_PROMPT, SUNDONG_SYSTEM_PROMPT, EONGDDONG_SYSTEM_PROMPT

load_dotenv(override=True)
logger = logging.getLogger(__name__)

# [Refactor] 전역 변수 제거하고 __init__에서 로드

class QwenStyleService:
    def __init__(self):
        # .env 재로드 (확실하게 최신값 반영)
        load_dotenv(override=True)
        
        # URL 로드 (기본값 설정)
        self.base_url = os.getenv("KAMP_QWEN_URL", "https://yojgf-125-6-60-4.a.free.pinggy.link/v1")
        
        # URL 보정: /chat/completions가 붙어있으면 떼어냄
        if "/chat/completions" in self.base_url:
            self.base_url = self.base_url.replace("/chat/completions", "")
        
        # /v1 로 끝나는지 확인 (OpenAI Client 요구사항)
        if not self.base_url.endswith("/v1"):
            self.base_url = self.base_url.rstrip("/") + "/v1"
            
        logger.info(f"Qwen Client Initialized (Base: {self.base_url})")
        
        self.client = OpenAI(
            base_url=self.base_url,
            api_key="not-needed",
            default_headers={"Bypass-Tunnel-Reminder": "true"},
            timeout=30.0
        )

    def apply_character_style(self, character: str, core_output: dict, detected_language: str = "ko") -> dict:
        """
        원격 Qwen API를 호출하여 캐릭터 말투로 변환
        - OpenAI SDK 사용
        - detected_language: "ko" or "en"
        """
        prompt = self._build_character_prompt(character, core_output, detected_language)
        
        try:
            # 1. 모델 ID 동적 조회
            models = self.client.models.list()
            if not models.data:
                logger.warning("No models found on server, using default 'Qwen/Qwen2.5-14B-Instruct'")
                model_id = "Qwen/Qwen2.5-14B-Instruct"
            else:
                model_id = models.data[0].id

            # 2. Chat Completion 요청
            response = self.client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000 # [수정] 서버 용량(4096) 확보로 대폭 증가!
            )
            
            generated_text = response.choices[0].message.content
            
            return {
                "character": character,
                "text": generated_text,
                "ui_hints": core_output.get("ui_hints", {})
            }
            
        except Exception as e:
            logger.error(f"Qwen API Call Failed (OpenAI Client): {e}")
            # 실패 시 Fallback: 변환 없이 원본 반환
            return {
                "character": character,
                "text": f"(말투 변환 실패) {json.dumps(core_output, ensure_ascii=False)}",
                "ui_hints": core_output.get("ui_hints", {})
            }

    def _build_character_prompt(self, character: str, core_output: dict, detected_language: str = "ko") -> str:
        """캐릭터 프롬프트 생성 (언어별 분기)"""
        
        traits_ko = {
            "cat": "까칠냥이 - 똑부러지고 직설적, ~냥 말투, 도도하지만 실속 챙김",
            "dog": "순둥멍멍이 - 다정하고 친근함, ~멍 말투, 항상 응원하고 격려",
            "otter": "엉뚱수달 - 발랄하고 엉뚱함, ~달 말투, 재치있고 창의적"
        }
        
        traits_en = {
            "cat": "Kkachil Cat - Sharp and straightforward, ends sentences with 'nyaa', proud but practical",
            "dog": "Sundong Dog - Warm and friendly, ends sentences with 'woof', always supportive",
            "otter": "Eongddong Otter - Quirky and playful, ends sentences with 'dal', creative and witty"
        }
        
        # [최적화] 입력 데이터가 너무 복잡하면 모델이 횡설수설함.
        # 핵심 정보 위주로 깔끔하게 정리해서 전달 (토큰 절약 + 품질 향상)
        minified_data = self._minify_context(core_output)
        
        # [New] Detect Prompt Type
        is_simple_search = False
        is_gallery = False
        
        # Check if minified data indicates simple search or gallery
        if minified_data.get("gallery"):
            is_gallery = True
        elif not minified_data.get("plan") and minified_data.get("shopping"):
             is_simple_search = True # Only shopping
        elif minified_data.get("plan"):
             # Check if plan day 1 has 'places' but no 'day' logic (implied by previous fix users saw)
             # But easier is to check the structure.
             pass

        if detected_language == "en":
            # English prompt
            trait_desc = traits_en.get(character, "friendly guide")
            
            task_instruction = "Review the travel itinerary data below and explain it to the user in detail."
            if is_gallery:
                task_instruction = "The user asked for photos. Introduce the photo gallery enthusiastically! **IMPORTANT: You MUST VALIDLY display at least 3 photos using markdown sequence: `![Name](URL)`**."
            elif is_simple_search:
                task_instruction = "The user asked for specific recommendations. Introduce these places enthusiastically!"
            
            return f"""
You are a {trait_desc} character.
{task_instruction}

**Rules:**
1. Deliver information (places) accurately.
2. Maintain your character's unique speech pattern throughout and use emojis generously.
3. If it's a list, introduce 3-4 key spots. If it's an itinerary, explain the flow.
4. **For Gallery Mode, you MUST output the image links in Markdown format.**
5. **IMPORTANT: Respond in ENGLISH only!**

**Input Data (Summary):**
```json
{json.dumps(minified_data, ensure_ascii=False, indent=2)}
```
"""
        else:
            # Korean prompt
            trait_desc = traits_ko.get(character, "친절한 가이드")
            
            task_instruction = "아래 여행 일정 요약 데이터를 보고, 사용자에게 상세하고 재미있게 설명해주세요."
            if is_gallery:
                task_instruction = "사용자가 사진을 요청했습니다. 갤러리에 있는 사진들을 신나게 소개해주세요! **중요: 반드시 마크다운 이미지 문법 `![장소명](이미지URL)`을 사용하여 사진 3~5장을 직접 보여주세요!**"
            elif is_simple_search:
                task_instruction = "사용자가 특정 장소(맛집/쇼핑 등) 추천을 요청했습니다. 이 장소들을 매력적으로 소개해주세요! '일정'이라는 말은 쓰지 마세요."

            return f"""
당신은 {trait_desc} 캐릭터입니다.
{task_instruction}

**규칙:**
1. 정보(장소)는 정확히 전달하세요.
2. 각 장소의 매력(맛, 풍경, 분위기)을 상상력을 발휘해 아주 풍부하고 수다스럽게 묘사하세요.
3. 캐릭터 특유의 말투(~달, ~냥, ~멍)를 끝까지 유지하며, 이모지도 듬뿍 쓰세요.
4. **갤러리 모드일 경우, 반드시 제공된 이미지 URL을 사용하여 마크다운 이미지(`![설명](주소)`)를 본문에 포함하세요.**
5. 단순 추천일 경우 "1일차" 같은 말은 빼고, 자연스럽게 장소를 나열하며 추천해주세요.
6. **중요: 반드시 한국어로만 답변하세요!**

**입력 데이터(요약):**
```json
{json.dumps(minified_data, ensure_ascii=False, indent=2)}
```
"""

    def _minify_context(self, core_output: dict) -> dict:
        """핵심 데이터만 추출 (모델 혼란 방지용)"""
        plan = core_output.get("plan", {})
        simplified_plan = {}
        
        if plan:
            # 리스트인 경우 딕셔너리로 변환 (가끔 리스트로 올 때가 있음)
            if isinstance(plan, list):
                # 리스트라면 그대로 사용하거나 변환 로직 필요.
                pass
            
            # [Fix] Handle special search result structures
            # 1. Simple List Mode (items directly in day 1)
            # Structure: {"1": {"day_number": 1, "items": [...]}}
            # 2. Gallery Mode
            # Structure: {"gallery_mode": True, "data": {...}}
            
            # Check for Gallery Mode first
            if plan.get("gallery_mode"):
                # 갤러리 모드는 별도 'gallery' 키로 처리되므로 plan에서는 무시하거나 요약만
                simplified_plan["note"] = "User requested photos. See gallery section."
                
            else:
                for day_key, day_data in plan.items():
                    if not isinstance(day_data, dict): continue
                    
                    # [Fix] DailyItinerary 스키마는 'items' 필드를 사용함 (places 아님)
                    places = day_data.get("items", []) 
                    simple_places = []
                    for p in places:
                        # 장소의 핵심만 추출
                        # ItineraryItem 스키마: place_name, category, notes 등
                        sp = {
                            "name": p.get("place_name") or p.get("name"), # 필드명 호환성
                            "category": p.get("category"),
                            "time": p.get("time") # 시간 정보 추가
                        }
                        if p.get("notes"): 
                            sp["desc"] = p.get("notes")
                        simple_places.append(sp)
                        
                    simplified_plan[day_key] = {
                        "day": day_data.get("day_number"),
                        "places": simple_places
                    }

        # [New] Minified Shopping Results
        shopping_raw = core_output.get("shopping", [])
        shopping_summary = []
        if shopping_raw and isinstance(shopping_raw, list):
            for s in shopping_raw[:5]:  # Top 5 only
                shopping_summary.append({
                    "name": s.get("name"),
                    "rating": s.get("rating"),
                    "type": s.get("types", [])[:2] # types simplified
                })
        
        # [New] Minified Gallery Results
        gallery_raw = core_output.get("gallery", {})
        gallery_summary = []
        
        if gallery_raw and isinstance(gallery_raw, dict):
            # [Fix] Extract actual results if nested
            real_gallery_data = gallery_raw.get("gallery_results", gallery_raw)
            
            # If still wrapped or empty, handle gracefully
            if isinstance(real_gallery_data, dict):
                 for place_name, urls in list(real_gallery_data.items())[:5]:
                    # [Fix] 이미지 URL도 함께 전달 (마크다운 출력용)
                    first_url = urls[0] if urls and isinstance(urls, list) else ""
                    gallery_summary.append({
                        "name": place_name,
                        "image": first_url
                    })

        minified = {
            "destination": core_output.get("destination", "여행지"),
            "plan": simplified_plan,
            "shopping": shopping_summary, # [New]
            "gallery": gallery_summary,   # [New]
            "weather": core_output.get("weather", "정보 없음")
        }
        
        # [Debug] Log minified data to help debug detailed prompt issues
        logger.info(f"🧩 Minified Context for Qwen:\n{json.dumps(minified, ensure_ascii=False, indent=2)}")
        
        return minified
    def apply_general_chat(self, character: str, user_input: str, detected_language: str = "ko") -> str:
        """
        일반 대화 모드
        - 영어: GPT-4 직접 사용
        - 한국어: Qwen 캐릭터 모델 사용
        """
        
        logger.info(f"🔍 [DEBUG] detected_language='{detected_language}', type={type(detected_language)}")
        
        if detected_language == "en":
            # 영어는 GPT-4로 직접 응답
            import openai
            import os
            
            character_traits = {
                "cat": "Kkachil Cat - sharp, straightforward, ends with 'nyaa'",
                "dog": "Sundong Dog - warm, friendly, ends with 'woof'",
                "otter": "Eongddong Otter - quirky, playful, ends with 'dal'"
            }
            
            trait = character_traits.get(character, character_traits["otter"])
            
            try:
                openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                
                response = openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": f"You are {trait}. Be helpful and friendly. Use emojis. Keep responses concise and natural."},
                        {"role": "user", "content": user_input}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                
                return response.choices[0].message.content
                
            except Exception as e:
                logger.error(f"GPT-4 Chat Failed: {e}")
                return "Sorry, I'm having trouble right now, dal... 😿"
            
        else:
            # 한국어는 기존 Qwen 사용
            system_prompts_ko = {
                "cat": KKACHIL_SYSTEM_PROMPT + "\n\n**중요: 반드시 한국어로만 답변하세요!**",
                "dog": SUNDONG_SYSTEM_PROMPT + "\n\n**중요: 반드시 한국어로만 답변하세요!**",
                "otter": EONGDDONG_SYSTEM_PROMPT + "\n\n**중요: 반드시 한국어로만 답변하세요!**"
            }
            
            system_prompt = system_prompts_ko.get(character, EONGDDONG_SYSTEM_PROMPT)
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ]
        
            try:
                # 1. 모델 ID 동적 조회
                models = self.client.models.list()
                if not models.data:
                    model_id = "Qwen/Qwen2.5-14B-Instruct"
                else:
                    model_id = models.data[0].id

                # 2. Chat Completion 요청
                response = self.client.chat.completions.create(
                    model=model_id,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000
                )
                
                return response.choices[0].message.content
                
            except Exception as e:
                logger.error(f"Qwen Chat Failed: {e}")
                return "죄송해요, 서버 연결이 원활하지 않아요. 😿"



"""
WebSocket 실시간 챗 엔드포인트
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Optional
import json
import traceback

from core.workflow import create_travel_graph
from schemas.state import TeamAgentState
from utils.language_detector import detect_primary_language
from services.tts_streaming import generate_tts_for_new_sentence, clear_tts_cache

router = APIRouter(
    prefix="/api/ws",
    tags=["websocket"]
)

# LangGraph instance (Lazy Init)
_WORKFLOW_CACHE = None

def get_workflow():
    global _WORKFLOW_CACHE
    if _WORKFLOW_CACHE is None:
        print("🚀 [WebSocket] First-time Compilation...")
        _WORKFLOW_CACHE = create_travel_graph()
        print("✅ [WebSocket] Workflow Compiled and Cached.")
    return _WORKFLOW_CACHE


class WSMessageType:
    """WebSocket 메시지 타입"""
    TEXT_CHUNK = "text_chunk"
    AUDIO_CHUNK = "audio_chunk"
    COMPLETE = "complete"
    ERROR = "error"
    LANGUAGE_DETECTED = "language_detected"
    JSON_DATA = "json_data" # [New] 구조화된 데이터(이미지, 일정 등) 전송용


@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket):
    """
    실시간 챗봇 WebSocket 엔드포인트
    
    프로토콜:
    - Client -> Server: {"message": "사용자 메시지", "character": "cat"}
    - Server -> Client: {"type": "text_chunk", "content": "텍스트 청크"}
    - Server -> Client: {"type": "audio_chunk", "content": "Base64 오디오"}
    - Server -> Client: {"type": "json_data", "content": {...}}  <-- [New]
    - Server -> Client: {"type": "complete"}
    """
    await websocket.accept()
    
    try:
        # 클라이언트 메시지 수신
        data = await websocket.receive_json()
        user_message = data.get("message", "")
        character = data.get("character", "cat")
        
        if not user_message:
            await websocket.send_json({
                "type": WSMessageType.ERROR,
                "content": "Message is required"
            })
            await websocket.close()
            return
        
        print(f"\n🌐 WebSocket Chat Started")
        print(f"Message: {user_message}")
        print(f"Character: {character}")
        
        # 언어 감지
        detected_lang = detect_primary_language(user_message)
        use_tts = (detected_lang == "en")
        
        await websocket.send_json({
            "type": WSMessageType.LANGUAGE_DETECTED,
            "content": detected_lang,
            "use_tts": use_tts
        })
        
        print(f"Language: {detected_lang}, TTS: {use_tts}")
        
        # TTS 캐시 초기화
        clear_tts_cache()
        
        # LangGraph 초기 상태
        initial_state: TeamAgentState = {
            "user_input": user_message,
            "messages": [{"role": "user", "content": user_message}],
            "next_agent": None,
            "budget": None,
            "routes": [],
            "weather_forecast": [],
            "crowd_info": None,
            "places": [],
            "daily_plans": {},
            "context": None,
            "final_response": "",
            "preferred_character": character,
            "destination": "강릉",
            "start_date": "2025-05-01",
            "end_date": "2025-05-02",
            "parsed_intent": None,
            "restaurants": None,
            "accommodations": None,
            "desserts": None,
            "landmarks": None,
            "weather_info": None,
            "gps_data": None,
            "detected_language": detected_lang  # 언어 감지 결과 추가
        }
        
        # 누적 텍스트 추적
        accumulated_text = ""
        previous_text = ""
        sent_sentences = set()  # 이미 TTS 생성한 문장 추적
        
        print(f"🚀 Starting LangGraph astream...")
        
        # LangGraph 스트리밍 실행
        event_count = 0
        app_workflow = get_workflow()
        async for event in app_workflow.astream(initial_state):
            event_count += 1
            node_name = list(event.keys())[0] if event else "unknown"
            print(f"📦 Event #{event_count}: {node_name}")
            
            # 각 노드의 출력에서 메시지 추출
            node_output = event.get(node_name, {})
            
            # [New] 구조화된 데이터(이미지, 쇼핑, 일정 등) 감지 및 전송
            # frontend가 렌더링할 수 있는 키워드들 확인
            data_keys = ["gallery", "shopping", "daily_plans", "weather_info", "budget_info"]
            found_data = {}
            if isinstance(node_output, dict):
                for key in data_keys:
                    if key in node_output and node_output[key]:
                        # 간단한 검증: 비어있지 않은 경우에만 전송
                        val = node_output[key]
                        if isinstance(val, (dict, list)) and len(val) > 0:
                             found_data[key] = val
            
            # 갤러리/쇼핑 결과가 있으면 즉시 전송
            if found_data:
                print(f"📤 Sending Data Payload: {list(found_data.keys())}")
                await websocket.send_json({
                    "type": WSMessageType.JSON_DATA,
                    "content": found_data
                })

            
            # messages 키가 있는지 확인
            if isinstance(node_output, dict) and "messages" in node_output:
                messages = node_output["messages"]
                print(f"💬 Messages count: {len(messages)}")
                
                if messages:
                    # 마지막 메시지 (보통 assistant)
                    last_msg = messages[-1]
                    if isinstance(last_msg, dict):
                        last_message = last_msg.get("content", "")
                    else:
                        last_message = str(last_msg)
                    
                    print(f"📨 Last message: {last_message[:100]}...")
                    
                    if last_message and len(last_message) > len(accumulated_text):
                        # 새로운 청크
                        new_chunk = last_message[len(accumulated_text):]
                        accumulated_text = last_message
                        
                        # 텍스트 청크 전송
                        await websocket.send_json({
                            "type": WSMessageType.TEXT_CHUNK,
                            "content": new_chunk
                        })
                        
                        print(f"📝 Sent text: {new_chunk[:50]}...")
                        
                        # 영어인 경우 TTS 생성 (완성된 문장마다 즉시)
                        if use_tts:
                            from services.tts_streaming import split_into_sentences
                            import asyncio
                            from services.tts_client import tts_client
                            
                            # 현재까지의 완성된 문장들
                            completed_sentences = split_into_sentences(accumulated_text)
                            
                            # 새로 완성된 문장만 TTS 생성
                            for sentence in completed_sentences:
                                # 종결 기호로 끝나는지 확인
                                if not sentence.rstrip().endswith(('.', '!', '?', '。', '！', '？')):
                                    continue
                                
                                # 이미 처리한 문장은 스킵
                                if sentence in sent_sentences:
                                    continue
                                
                                sent_sentences.add(sentence)
                                
                                # TTS 생성 및 즉시 전송
                                try:
                                    audio_base64 = await asyncio.to_thread(
                                        tts_client.synthesize_base64,
                                        sentence.strip()
                                    )
                                    
                                    if audio_base64:
                                        await websocket.send_json({
                                            "type": WSMessageType.AUDIO_CHUNK,
                                            "content": audio_base64
                                        })
                                        print(f"🎤 Audio sent for: {sentence[:50]}...")
                                except Exception as e:
                                    print(f"⚠️ TTS error: {e}")
                        
                        previous_text = accumulated_text
        
        print(f"🏁 LangGraph finished. Total events: {event_count}")
        
        # 완료 신호 (누적 텍스트 포함)
        await websocket.send_json({
            "type": WSMessageType.COMPLETE,
            "content": accumulated_text
        })
        
        print(f"✅ WebSocket Chat Complete\n")
        
    except WebSocketDisconnect:
        print("❌ Client disconnected")
        
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        traceback.print_exc()
        
        try:
            await websocket.send_json({
                "type": WSMessageType.ERROR,
                "content": str(e)
            })
        except:
            pass
    
    finally:
        try:
            await websocket.close()
        except:
            pass

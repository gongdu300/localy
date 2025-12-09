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
    실시간 챗봇 WebSocket 엔드포인트 (Persistent Connection)
    """
    await websocket.accept()
    
    # 세션 내 대화 히스토리 유지
    chat_history = []
    
    try:
        print(f"\n🌐 WebSocket Connected")
        
        while True:
            # 클라이언트 메시지 수신 (연결 유지)
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            character = data.get("character", "cat")
            
            if not user_message:
                continue
            
            print(f"\n📩 Message Received: {user_message}")
            print(f"Character: {character}")
            
            # 히스토리에 추가
            chat_history.append({"role": "user", "content": user_message})
            
            # 언어 감지
            detected_lang = detect_primary_language(user_message)
            use_tts = (detected_lang == "en")
            
            await websocket.send_json({
                "type": WSMessageType.LANGUAGE_DETECTED,
                "content": detected_lang,
                "use_tts": use_tts
            })
            
            # TTS 캐시 초기화 (새로운 턴 시작 시)
            clear_tts_cache()
            
            # LangGraph 초기 상태 (히스토리 포함)
            initial_state: TeamAgentState = {
                "user_input": user_message,
                "messages": chat_history, # 누적된 히스토리 전달
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
                "detected_language": detected_lang
            }
            
            # 누적 텍스트 추적 (이번 턴의 답변)
            accumulated_text = ""
            sent_sentences = set()
            
            print(f"🚀 Starting LangGraph astream...")
            
            event_count = 0
            app_workflow = get_workflow()
            
            # LangGraph 실행
            async for event in app_workflow.astream(initial_state):
                event_count += 1
                node_name = list(event.keys())[0] if event else "unknown"
                
                # 각 노드의 출력에서 메시지 추출
                node_output = event.get(node_name, {})
                
                # [New] 구조화된 데이터 전송 logic (그대로 유지)
                data_keys = ["gallery", "shopping", "daily_plans", "weather_info", "budget_info"]
                found_data = {}
                if isinstance(node_output, dict):
                    for key in data_keys:
                        if key in node_output and node_output[key]:
                            val = node_output[key]
                            if isinstance(val, (dict, list)) and len(val) > 0:
                                found_data[key] = val
                
                if found_data:
                    await websocket.send_json({
                        "type": WSMessageType.JSON_DATA,
                        "content": found_data
                    })

                # 메시지 스트리밍 Logic
                if isinstance(node_output, dict) and "messages" in node_output:
                    messages = node_output["messages"]
                    
                    if messages:
                        last_msg = messages[-1]
                        last_message = last_msg.get("content", "") if isinstance(last_msg, dict) else str(last_msg)
                        
                        # 히스토리가 누적되므로, 이번 턴의 새로운 내용만 발라내야 함
                        # 간단하게: 현재 accumulated_text보다 길면 그 차이만큼 전송
                        # 주의: LangGraph가 전체 히스토리를 반환한다면 로직 수정 필요. 
                        # 보통 messages는 append 되므로 마지막 메시지만 확인하면 됨.
                        
                        # [Fix for persistent]: LangGraph might return full history or just delta depending on config.
                        # Assuming 'messages' in output contains valid latest content.
                        
                        # If accumulated_text is empty, we assume this is the start of the assistant response.
                        # We need to be careful if 'messages' contains previous turns.
                        # With 'messages' key in output, usually it's the output of the node.
                        
                        if last_message and len(last_message) > len(accumulated_text):
                            new_chunk = last_message[len(accumulated_text):]
                            accumulated_text = last_message
                            
                            await websocket.send_json({
                                "type": WSMessageType.TEXT_CHUNK,
                                "content": new_chunk
                            })
                            
                            # TTS Logic (Same as before)
                            if use_tts:
                                from services.tts_streaming import split_into_sentences
                                import asyncio
                                from services.tts_client import tts_client
                                
                                completed_sentences = split_into_sentences(accumulated_text)
                                for sentence in completed_sentences:
                                    if not sentence.rstrip().endswith(('.', '!', '?', '。', '！', '？')): continue
                                    if sentence in sent_sentences: continue
                                    sent_sentences.add(sentence)
                                    try:
                                        audio_base64 = await asyncio.to_thread(tts_client.synthesize_base64, sentence.strip())
                                        if audio_base64:
                                            await websocket.send_json({"type": WSMessageType.AUDIO_CHUNK, "content": audio_base64})
                                    except: pass
            
            # 턴 종료 후 히스토리에 봇 응답 추가
            chat_history.append({"role": "assistant", "content": accumulated_text})
            
            print(f"🏁 Turn finished. Response: {accumulated_text[:50]}...")
            
            # 완료 신호 (이번 턴 끝)
            await websocket.send_json({
                "type": WSMessageType.COMPLETE,
                "content": accumulated_text
            })

    except WebSocketDisconnect:
        print("❌ Client disconnected")
        
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        traceback.print_exc()
        try:
            await websocket.send_json({"type": WSMessageType.ERROR, "content": str(e)})
        except: pass

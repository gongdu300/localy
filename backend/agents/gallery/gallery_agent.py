"""Photo Gallery Agent - 웹 검색을 통한 장소 사진 수집"""

import sys
from pathlib import Path
from typing import Dict, Any
from agents.gallery.gallery_tools import photo_gallery_tool

def photo_gallery_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    사진 갤러리 에이전트 (LangGraph 노드용)
    - state["region"] 값을 이용해 photo_gallery_tool을 호출하고
    - gallery_results / final_response만 state로 넘긴다.
    """
    region = state.get("region") or state.get("destination")
    
    if not region:
         return {
            "gallery_results": {},
            "final_response": "지역 정보가 없어 사진을 찾을 수 없습니다.",
        }

    tool_result = photo_gallery_tool.invoke({"region": region})

    return {
        "gallery_results": tool_result.get("gallery_results", {}),
        "final_response": tool_result.get("final_response", ""),
    }

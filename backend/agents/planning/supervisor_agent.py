
from typing import Literal, Annotated
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from schemas.state import TeamAgentState


# 라우팅 가능한 에이전트 목록
# Phase 3: 예산(budget) + 혼잡도(crowd) + 일정(itinerary)
MEMBERS = ["budget_agent", "crowd_agent", "itinerary_agent"]

# Supervisor의 결정 구조체
class RouteResponse(BaseModel):
    next: Literal["budget_agent", "crowd_agent", "itinerary_agent", "FINISH"] = Field(
        ..., 
        description="다음으로 호출할 에이전트 또는 종료(FINISH)"
    )

class SupervisorAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        
        system_prompt = (
            "당신은 여행 팀의 감독(Supervisor)입니다.\n"
            "사용자의 요청을 분석하여 다음 전문가에게 작업을 배분하세요:\n\n"
            "1. budget_agent: 예산 계산, 비용 문의, '얼마 들어?', '예산 충분해?'\n"
            "2. crowd_agent: 혼잡도 확인, '사람 많아?', '언제 가는게 좋아?'\n"
            "3. itinerary_agent: 일정 생성, '2박3일 코스 짜줘', '일정 추천해줘'\n\n"
            "더 이상 필요한 작업이 없거나 사용자가 일반적인 대화를 원하면 'FINISH'를 반환하세요.\n"
            "이미 데이터를 수집했다면 중복 호출하지 말고 'FINISH'하세요."
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("placeholder", "{messages}"),
            ("system", "다음 순서는 누구입니까? (budget_agent, crowd_agent, itinerary_agent, FINISH)")
        ])
        
        self.chain = self.prompt | self.llm.with_structured_output(RouteResponse)

    def route(self, state: TeamAgentState) -> dict:
        """다음 에이전트 결정"""
        result = self.chain.invoke({"messages": state["messages"]})
        return {"next_agent": result.next}

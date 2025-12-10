from pydantic import BaseModel
from datetime import date
from typing import Optional

# 회원가입 시 받을 데이터 (DB 명세서의 NOT NULL 항목들 위주)
class UserCreate(BaseModel):
    user_id: str
    user_pw: str
    user_name: str
    user_nickname: str
    user_email: str
    user_post: str
    user_addr1: str
    user_addr2: Optional[str] = None
    user_birth: date
    user_gender: str

# 로그인 시 받을 데이터
class UserLogin(BaseModel):
    user_id: str
    user_pw: str

# 응답으로 돌려줄 데이터 (비밀번호는 절대 포함 금지!)
class UserResponse(BaseModel):
    user_seq_no: int
    user_id: str
    user_nickname: str
    user_email: str
    
    class Config:
        from_attributes = True

# Parse Answer API 스키마
class ParseAnswerRequest(BaseModel):
    question_type: str
    user_input: str

class ParseAnswerResponse(BaseModel):
    success: bool
    parsed_text: str

# Analyze Persona API 스키마
class AnalyzePersonaRequest(BaseModel):
    user_id: str
    planning: str
    social: str
    detail_focus: str
    decision_style: str
    energy_source: str
    preparation: str

class AnalyzePersonaResponse(BaseModel):
    character: str  # "cat" | "dog" | "otter"
    mbti_traits: dict
    reason: str
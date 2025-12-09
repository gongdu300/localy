from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

import os
from dotenv import load_dotenv

load_dotenv()

# 1. DB 연결 주소 (URL) 세팅
# .env 파일에서 DATABASE_URL을 가져옵니다. (없으면 기본값으로 로컬 SQLite 사용)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./travel.db")

print(f"🔗 Connecting to Database: {SQLALCHEMY_DATABASE_URL}")

# 2. 엔진 생성 (DB와 연결되는 핵심 객체)
# SQLite일 경우에만 check_same_thread 옵션 필요
connect_args = {}
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)

# 5. 세션 생성 (실제 데이터 작업을 수행하는 도구)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 6. 모델들이 상속받을 기본 클래스 (이걸로 테이블을 만듭니다)
Base = declarative_base()

# 7. DB 세션을 가져오는 함수 (라우터에서 사용)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
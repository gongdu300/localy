-- MySQL 마이그레이션 스크립트
-- user 테이블에 preferred_character 컬럼 추가

USE travel_platform;

ALTER TABLE user 
ADD COLUMN preferred_character VARCHAR(20) NULL 
COMMENT '매칭된 캐릭터 (cat/dog/otter)';

-- 확인
DESCRIBE user;

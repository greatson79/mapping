-- ================================================
-- Migration: 0001_create_places_and_reviews
-- Description: 장소 및 리뷰 테이블 생성
-- Author: Development Team
-- Date: 2025-10-21
-- ================================================

BEGIN;

-- ================================================
-- 1. places 테이블 생성
-- ================================================
CREATE TABLE IF NOT EXISTS places (
    place_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    category TEXT,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ================================================
-- 2. reviews 테이블 생성
-- ================================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    rating SMALLINT NOT NULL,
    content TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- 제약조건
    CONSTRAINT fk_reviews_place_id
        FOREIGN KEY (place_id)
        REFERENCES places(place_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_rating_range
        CHECK (rating >= 1 AND rating <= 5)
);

-- ================================================
-- 3. 인덱스 생성
-- ================================================

-- 3.1 지도 viewport 범위 조회용
CREATE INDEX IF NOT EXISTS idx_places_coords
    ON places (latitude, longitude);

-- 3.2 장소별 최신 리뷰 조회용
CREATE INDEX IF NOT EXISTS idx_reviews_place_created
    ON reviews (place_id, created_at DESC);

-- ================================================
-- 4. RLS 비활성화
-- ================================================
ALTER TABLE places DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- ================================================
-- 5. 테이블 코멘트
-- ================================================
COMMENT ON TABLE places IS '장소 정보 (네이버 지도 기반)';
COMMENT ON TABLE reviews IS '리뷰 정보 (비회원 전용)';

COMMENT ON COLUMN places.place_id IS '네이버 장소 고유 ID';
COMMENT ON COLUMN reviews.password_hash IS 'bcrypt 해시 비밀번호';

COMMIT;

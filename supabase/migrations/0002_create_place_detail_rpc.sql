-- ================================================
-- Migration: 0002_create_place_detail_rpc
-- Description: 장소 정보 + 리뷰 통계 조회용 RPC 함수 생성
-- Author: Development Team
-- Date: 2025-10-21
-- ================================================

BEGIN;

-- ================================================
-- RPC 함수: get_place_with_stats
-- 목적: 장소 정보와 리뷰 통계를 한 번에 조회
-- ================================================
CREATE OR REPLACE FUNCTION get_place_with_stats(p_place_id TEXT)
RETURNS TABLE (
  place_id TEXT,
  name TEXT,
  address TEXT,
  category TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  review_count BIGINT,
  average_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.place_id,
    p.name,
    p.address,
    p.category,
    p.latitude,
    p.longitude,
    COUNT(r.id) AS review_count,
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0) AS average_rating
  FROM places p
  LEFT JOIN reviews r ON p.place_id = r.place_id
  WHERE p.place_id = p_place_id
  GROUP BY p.place_id, p.name, p.address, p.category, p.latitude, p.longitude;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 함수 코멘트
-- ================================================
COMMENT ON FUNCTION get_place_with_stats(TEXT) IS '장소 정보와 리뷰 통계를 한 번에 조회하는 RPC 함수';

COMMIT;

-- ================================================
-- 마이그레이션 완료
-- ================================================

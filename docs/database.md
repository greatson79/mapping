# 데이터베이스 설계 문서

> **문서 버전**: 2.0.0
> **작성일**: 2025년 10월 21일
> **데이터베이스**: PostgreSQL (Supabase)
> **프로젝트명**: 네이버 지도 기반 맛집 리뷰 플랫폼
> **설계 원칙**: 간결성, 확장성, 요구사항 중심

---

## 목차

1. [데이터 플로우](#1-데이터-플로우)
2. [데이터베이스 스키마](#2-데이터베이스-스키마)
3. [인덱싱 전략](#3-인덱싱-전략)
4. [SQL 마이그레이션 스크립트](#4-sql-마이그레이션-스크립트)
5. [쿼리 패턴 예시](#5-쿼리-패턴-예시)

---

## 1. 데이터 플로우

### 1.1 간략 데이터 플로우

```
사용자 액션                API 호출                   데이터베이스 작업
─────────────────────────────────────────────────────────────────────

1. 홈 접속
   └─> 지도 viewport 변경
       └─> GET /api/markers?bounds=...
           └─> SELECT place_id, latitude, longitude
               FROM places WHERE ...

2. 장소 검색
   └─> 검색어 입력
       └─> [네이버 API 직접 호출 - DB 저장 안 함]

3. 리뷰 작성
   └─> 폼 제출
       └─> POST /api/reviews
           └─> BEGIN
               ├─> INSERT INTO places (네이버 데이터)
               │   ON CONFLICT DO NOTHING
               └─> INSERT INTO reviews (리뷰 데이터)
               COMMIT

4. 장소 상세 조회
   └─> 마커 클릭
       └─> GET /api/places/:placeId
           ├─> SELECT * FROM places WHERE place_id = ...
           └─> SELECT rating, AVG(rating), COUNT(*)
               FROM reviews WHERE place_id = ...
               GROUP BY ...

5. 리뷰 목록 조회
   └─> 스크롤
       └─> GET /api/reviews?placeId=...&limit=10&offset=0
           └─> SELECT * FROM reviews
               WHERE place_id = ...
               ORDER BY created_at DESC
               LIMIT 10 OFFSET 0
```

### 1.2 핵심 데이터 흐름

#### 리뷰 작성 플로우
```
사용자 입력 (작성자명, 평점, 본문, 비밀번호)
    ↓
클라이언트 검증 (Zod)
    ↓
POST /api/reviews
    ↓
서버 검증 + 비밀번호 bcrypt 해싱
    ↓
BEGIN TRANSACTION
    ├─> UPSERT places (네이버 장소 정보)
    └─> INSERT reviews (리뷰 정보)
COMMIT
    ↓
응답 { success: true, reviewId }
```

#### 지도 마커 조회 플로우
```
지도 viewport 변경 (lat/lng 범위 계산)
    ↓
GET /api/markers?minLat=...&maxLat=...&minLng=...&maxLng=...
    ↓
SELECT place_id, latitude, longitude
FROM places
WHERE latitude BETWEEN :minLat AND :maxLat
  AND longitude BETWEEN :minLng AND :maxLng
LIMIT 100
    ↓
응답 [{ placeId, lat, lng }, ...]
```

---

## 2. 데이터베이스 스키마

### 2.1 ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                          places                             │
├─────────────────────────────────────────────────────────────┤
│ place_id            TEXT PRIMARY KEY (네이버 장소 ID)       │
│ name                TEXT NOT NULL (장소명)                  │
│ address             TEXT NOT NULL (주소)                    │
│ category            TEXT (카테고리)                         │
│ latitude            NUMERIC(10, 7) NOT NULL (위도)          │
│ longitude           NUMERIC(10, 7) NOT NULL (경도)          │
│ created_at          TIMESTAMPTZ DEFAULT NOW()               │
└─────────────────────────────────────────────────────────────┘
                                ↑
                                │ 1:N
                                │
┌─────────────────────────────────────────────────────────────┐
│                         reviews                             │
├─────────────────────────────────────────────────────────────┤
│ id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()│
│ place_id            TEXT NOT NULL (FK → places.place_id)    │
│ author_name         TEXT NOT NULL (작성자명)                │
│ rating              SMALLINT NOT NULL CHECK (1 <= rating <= 5)│
│ content             TEXT NOT NULL (리뷰 본문)               │
│ password_hash       TEXT NOT NULL (bcrypt 해시 비밀번호)     │
│ created_at          TIMESTAMPTZ DEFAULT NOW()               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 테이블 상세 정의

#### 2.2.1 places (장소 정보)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|---------|------|
| `place_id` | TEXT | PRIMARY KEY | 네이버 장소 ID (고유 식별자) |
| `name` | TEXT | NOT NULL | 장소명 |
| `address` | TEXT | NOT NULL | 주소 (도로명 우선, 없으면 지번) |
| `category` | TEXT | NULL | 카테고리 (예: "카페,디저트") |
| `latitude` | NUMERIC(10, 7) | NOT NULL | 위도 |
| `longitude` | NUMERIC(10, 7) | NOT NULL | 경도 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 생성 시각 |

**변경 사항 및 근거**:
- ❌ **제거**: `road_address` (주소 하나로 통일)
- ❌ **제거**: `review_count` (쿼리로 계산)
- ❌ **제거**: `average_rating` (쿼리로 계산)
- ❌ **제거**: `has_reviews` (WHERE 조건으로 필터링)
- ❌ **제거**: `updated_at` (리뷰 수정 기능 없음)

**비즈니스 로직**:
- 리뷰 작성 시 장소 정보가 없으면 INSERT (ON CONFLICT DO NOTHING)
- 평균 평점/리뷰 개수는 애플리케이션 레이어에서 쿼리로 계산

#### 2.2.2 reviews (리뷰 정보)

| 컬럼명 | 데이터 타입 | 제약조건 | 설명 |
|--------|------------|---------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 리뷰 고유 ID |
| `place_id` | TEXT | NOT NULL, FK → places.place_id | 장소 ID (외래키) |
| `author_name` | TEXT | NOT NULL | 작성자명 (1~20자, 앱 검증) |
| `rating` | SMALLINT | NOT NULL, CHECK (1~5) | 평점 |
| `content` | TEXT | NOT NULL | 리뷰 본문 (10~500자, 앱 검증) |
| `password_hash` | TEXT | NOT NULL | bcrypt 해시 비밀번호 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 작성 시각 |

**변경 사항 및 근거**:
- ✅ **변경**: `rating`을 INTEGER → SMALLINT (1바이트 절약)
- ❌ **제거**: `updated_at` (리뷰 수정 기능 없음)

**비즈니스 로직**:
- 리뷰 작성만 지원 (수정/삭제 기능 없음)
- 비밀번호는 bcrypt로 해싱 (salt rounds: 10)
- 외래키로 장소와 연결 (ON DELETE CASCADE)

### 2.3 관계 정의

```
places (1) ──── (N) reviews

- 외래키: reviews.place_id → places.place_id
- 삭제 정책: ON DELETE CASCADE (장소 삭제 시 리뷰도 삭제)
```

---

## 3. 인덱싱 전략

### 3.1 인덱스 목록

| 인덱스명 | 테이블 | 컬럼 | 타입 | 목적 |
|---------|--------|------|------|------|
| `idx_places_coords` | places | (latitude, longitude) | B-tree | viewport 범위 조회 최적화 |
| `idx_reviews_place_created` | reviews | (place_id, created_at DESC) | Composite | 장소별 최신 리뷰 조회 최적화 |

### 3.2 인덱싱 근거

#### 3.2.1 `idx_places_coords` (위도·경도 복합 인덱스)

**쿼리 패턴**:
```sql
SELECT place_id, latitude, longitude
FROM places
WHERE latitude BETWEEN :minLat AND :maxLat
  AND longitude BETWEEN :minLng AND :maxLng
LIMIT 100;
```

**선택 이유**:
- 지도 viewport 범위 조회가 가장 빈번한 쿼리
- 두 컬럼 모두 범위 검색이므로 복합 인덱스 효과적

#### 3.2.2 `idx_reviews_place_created` (복합 인덱스)

**쿼리 패턴**:
```sql
SELECT * FROM reviews
WHERE place_id = :placeId
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

**선택 이유**:
- 장소 상세 페이지에서 리뷰 목록 조회 시 필수
- place_id 필터링 + created_at 정렬을 한 번에 처리
- Cover Index로 작동하여 테이블 접근 최소화

**제거한 인덱스**:
- ❌ `idx_places_has_reviews`: 중복 컬럼 제거로 불필요
- ❌ `idx_reviews_place_id`: 복합 인덱스로 대체
- ❌ `idx_reviews_created_at`: 복합 인덱스로 대체

---

## 4. SQL 마이그레이션 스크립트

### 4.1 마이그레이션 파일: `0001_create_places_and_reviews.sql`

```sql
-- ================================================
-- Migration: 0001_create_places_and_reviews
-- Description: 장소 및 리뷰 테이블 생성 (간결 버전)
-- Author: CTO
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
COMMENT ON TABLE places IS '장소 정보 (네이버 지도 기반, 최소 필드)';
COMMENT ON TABLE reviews IS '리뷰 정보 (비회원 전용, 작성만 가능)';

COMMENT ON COLUMN places.place_id IS '네이버 장소 고유 ID';
COMMENT ON COLUMN reviews.password_hash IS 'bcrypt 해시 비밀번호 (향후 수정/삭제 시 사용)';

COMMIT;

-- ================================================
-- 마이그레이션 완료
-- ================================================
```

### 4.2 롤백 스크립트: `0001_rollback.sql`

```sql
-- ================================================
-- Rollback: 0001_create_places_and_reviews
-- ================================================

BEGIN;

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS places CASCADE;

COMMIT;
```

---

## 5. 쿼리 패턴 예시

### 5.1 장소 UPSERT (리뷰 작성 시)

```sql
-- 네이버 API 데이터로 장소 정보 저장 (중복 시 무시)
INSERT INTO places (
    place_id,
    name,
    address,
    category,
    latitude,
    longitude
)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (place_id) DO NOTHING;
```

### 5.2 리뷰 저장

```sql
-- 리뷰 INSERT
INSERT INTO reviews (
    place_id,
    author_name,
    rating,
    content,
    password_hash
)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, created_at;
```

### 5.3 지도 마커 조회

```sql
-- viewport 내 장소 조회 (리뷰 있는 장소만)
SELECT DISTINCT
    p.place_id,
    p.latitude,
    p.longitude
FROM places p
WHERE p.latitude >= $1   -- minLat
    AND p.latitude <= $2   -- maxLat
    AND p.longitude >= $3  -- minLng
    AND p.longitude <= $4  -- maxLng
    AND EXISTS (
        SELECT 1 FROM reviews r
        WHERE r.place_id = p.place_id
    )
LIMIT 100;
```

### 5.4 장소 상세 조회 (평균 평점 포함)

```sql
-- 장소 정보 + 평균 평점 + 리뷰 개수
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
WHERE p.place_id = $1
GROUP BY p.place_id;
```

### 5.5 리뷰 목록 조회 (페이지네이션)

```sql
-- 특정 장소의 리뷰 목록 (최신순)
SELECT
    id,
    author_name,
    rating,
    content,
    created_at
FROM reviews
WHERE place_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

### 5.6 리뷰 총 개수 조회

```sql
-- 특정 장소의 총 리뷰 개수
SELECT COUNT(*) as total
FROM reviews
WHERE place_id = $1;
```

---

## 6. 설계 개선 내역

### 6.1 제거한 요소 및 근거

| 제거 항목 | 근거 |
|----------|------|
| `places.road_address` | address 하나로 통합 (도로명 우선) |
| `places.review_count` | SELECT COUNT(*) 쿼리로 대체 |
| `places.average_rating` | AVG() 쿼리로 대체 |
| `places.has_reviews` | EXISTS 서브쿼리로 대체 |
| `places.updated_at` | 리뷰 수정 기능 없음 |
| `reviews.updated_at` | 리뷰 수정 기능 없음 |
| 트리거 함수 (평균 평점 재계산) | 애플리케이션 레이어에서 쿼리로 계산 |
| `idx_places_has_reviews` | 중복 컬럼 제거로 불필요 |
| `idx_reviews_place_id` | 복합 인덱스로 대체 |
| `idx_reviews_created_at` | 복합 인덱스로 대체 |

### 6.2 설계 철학

**간결성 (Simplicity)**
- 트리거 제거로 디버깅 용이
- 중복 데이터 제거로 데이터 정합성 보장
- 인덱스 최소화로 INSERT 성능 향상

**확장성 (Scalability)**
- 정규화된 구조로 스키마 변경 용이
- 복합 인덱스로 쿼리 패턴 최적화
- 애플리케이션 레이어 계산으로 유연성 확보

**요구사항 중심 (YAGNI)**
- 명시된 기능만 구현 (리뷰 작성, 조회)
- 불필요한 컬럼/트리거 제거
- 향후 확장 시 마이그레이션으로 추가

### 6.3 성능 비교

| 항목 | 기존 설계 | 개선 설계 | 개선 효과 |
|------|----------|----------|----------|
| 인덱스 개수 | 5개 | 2개 | INSERT 성능 향상 |
| 트리거 개수 | 4개 | 0개 | 디버깅 용이, 성능 향상 |
| 테이블 컬럼 | places 11개, reviews 8개 | places 7개, reviews 7개 | 스토리지 절약 |
| 복잡도 | 높음 (트리거 의존) | 낮음 (쿼리 기반) | 유지보수 용이 |

---

## 7. 향후 확장 시나리오

### 7.1 리뷰 수정/삭제 기능 추가 시

```sql
-- reviews 테이블에 updated_at 추가
ALTER TABLE reviews
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- 업데이트 시 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();
```

### 7.2 리뷰 이미지 추가 시

```sql
-- 리뷰 이미지 테이블 추가
CREATE TABLE review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_images_review_id
    ON review_images (review_id);
```

---

## 8. 마이그레이션 적용 방법

### 8.1 Supabase CLI

```bash
# Supabase 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 적용
supabase db push
```

### 8.2 Supabase 웹 콘솔

1. Supabase 대시보드 접속
2. **SQL Editor** 메뉴 이동
3. 마이그레이션 SQL 복사하여 실행
4. **Run** 버튼 클릭

---

## 9. 버전 관리

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2.0.0 | 2025-10-21 | 데이터베이스 설계 대폭 간소화 (CTO 리뷰) | CTO |
| 1.0.0 | 2025-10-21 | 초기 데이터베이스 설계 | Development Team |

---

**문서 승인**:
- CTO: ________________ (날짜: 2025-10-21)

---

**End of Document**

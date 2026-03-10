# 장소 상세 페이지 구현 계획

> **문서 버전**: 1.0.0
> **작성일**: 2025년 10월 21일
> **페이지**: 장소 상세 페이지 (`/place/detail`)
> **담당**: Development Team

---

## 목차

1. [개요](#1-개요)
2. [사전 체크리스트](#2-사전-체크리스트)
3. [기능 구현 목록](#3-기능-구현-목록)
4. [백엔드 구현 계획](#4-백엔드-구현-계획)
5. [프론트엔드 구현 계획](#5-프론트엔드-구현-계획)
6. [컴포넌트 구조](#6-컴포넌트-구조)
7. [무한 스크롤 구현 전략](#7-무한-스크롤-구현-전략)
8. [단계별 구현 순서](#8-단계별-구현-순서)
9. [테스트 항목](#9-테스트-항목)
10. [파일 구조](#10-파일-구조)

---

## 1. 개요

### 1.1 페이지 목적

장소 상세 페이지는 사용자가 선택한 장소의 정보와 해당 장소에 작성된 리뷰 목록을 보여줍니다.

### 1.2 주요 기능

1. **장소 정보 표시**: 장소명, 주소, 카테고리
2. **리뷰 통계 표시**: 평균 평점, 총 리뷰 개수
3. **리뷰 목록 조회**: 최신순으로 정렬된 리뷰 목록
4. **무한 스크롤**: 스크롤 하단 도달 시 자동으로 추가 리뷰 로드
5. **리뷰 상세 모달**: 리뷰 클릭 시 전체 내용을 모달로 표시
6. **리뷰 작성 버튼**: 리뷰 작성 페이지로 이동

### 1.3 URL 구조

```
/place/detail?placeId={placeId}
```

**쿼리 파라미터**:
- `placeId` (필수): 네이버 장소 ID
- `refresh` (선택): `true`일 경우 캐시 무효화

### 1.4 데이터 플로우

```
1. 페이지 진입 (placeId 파라미터)
   ↓
2. GET /api/places/:placeId (장소 정보 + 리뷰 통계)
   ↓
3. GET /api/reviews?placeId={id}&limit=10&offset=0 (리뷰 목록 첫 페이지)
   ↓
4. 스크롤 하단 도달
   ↓
5. GET /api/reviews?placeId={id}&limit=10&offset=10 (다음 페이지)
   ↓
6. 반복...
```

---

## 2. 사전 체크리스트

### 2.1 공통 모듈 확인

구현 전 다음 공통 모듈이 준비되어 있어야 합니다:

- [x] `src/types/place.ts` - Place, PlaceDetail 타입
- [x] `src/types/review.ts` - Review, ReviewListResponse 타입
- [x] `src/components/common/rating-stars.tsx` - 별점 표시 컴포넌트
- [x] `src/components/common/loading-spinner.tsx` - 로딩 스피너
- [x] `src/components/common/empty-state.tsx` - 빈 상태 UI
- [x] `src/lib/format/date.ts` - formatDate, formatDateLong
- [x] `src/lib/format/text.ts` - truncateReviewContent
- [x] `supabase/migrations/0001_create_places_and_reviews.sql` - DB 마이그레이션

### 2.2 데이터베이스 상태 확인

- [ ] places 테이블 생성 완료
- [ ] reviews 테이블 생성 완료
- [ ] 인덱스 생성 완료 (`idx_places_coords`, `idx_reviews_place_created`)

### 2.3 환경 변수 설정

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정

---

## 3. 기능 구현 목록

### 3.1 백엔드 API (우선순위: P0)

| 기능 | API | 설명 | 상태 |
|------|-----|------|------|
| 장소 정보 조회 | `GET /api/places/:placeId` | 장소 정보 + 리뷰 통계 | 미구현 |
| 리뷰 목록 조회 | `GET /api/reviews` | 페이지네이션 지원 | 미구현 |

### 3.2 프론트엔드 컴포넌트 (우선순위: P0)

| 컴포넌트 | 경로 | 설명 | 상태 |
|---------|------|------|------|
| PlaceDetailPage | `src/app/place/detail/page.tsx` | 메인 페이지 | 미구현 |
| PlaceInfoCard | `src/features/place-detail/components/place-info-card.tsx` | 장소 정보 카드 | 미구현 |
| ReviewStats | `src/features/place-detail/components/review-stats.tsx` | 리뷰 통계 | 미구현 |
| ReviewList | `src/features/place-detail/components/review-list.tsx` | 리뷰 목록 (무한 스크롤) | 미구현 |
| ReviewItem | `src/features/place-detail/components/review-item.tsx` | 리뷰 아이템 | 미구현 |
| ReviewDetailModal | `src/features/place-detail/components/review-detail-modal.tsx` | 리뷰 상세 모달 | 미구현 |
| WriteReviewButton | `src/features/place-detail/components/write-review-button.tsx` | 리뷰 작성 버튼 | 미구현 |

### 3.3 Hooks (우선순위: P0)

| Hook | 경로 | 설명 | 상태 |
|------|------|------|------|
| usePlace | `src/features/place-detail/hooks/use-place.ts` | 장소 정보 조회 | 미구현 |
| useReviews | `src/features/place-detail/hooks/use-reviews.ts` | 리뷰 무한 스크롤 | 미구현 |
| useIntersectionObserver | `src/hooks/use-intersection-observer.ts` | 무한 스크롤 트리거 | 미구현 |

---

## 4. 백엔드 구현 계획

### 4.1 Feature 디렉토리 구조

```
src/features/place-detail/
├── backend/
│   ├── route.ts         # Hono 라우터
│   ├── service.ts       # Supabase 비즈니스 로직
│   └── schema.ts        # Zod 스키마
├── hooks/
│   ├── use-place.ts     # React Query 장소 조회
│   └── use-reviews.ts   # React Query 리뷰 무한 스크롤
├── components/
│   ├── place-info-card.tsx
│   ├── review-stats.tsx
│   ├── review-list.tsx
│   ├── review-item.tsx
│   ├── review-detail-modal.tsx
│   └── write-review-button.tsx
└── lib/
    └── dto.ts           # 스키마 재노출 (필요시)
```

### 4.2 API 명세

#### 4.2.1 GET /api/places/:placeId

**목적**: 장소 정보 및 리뷰 통계 조회

**요청**:
```
GET /api/places/12345
```

**응답 (성공)**:
```json
{
  "success": true,
  "data": {
    "placeId": "12345",
    "name": "OO식당",
    "address": "서울시 강남구 테헤란로 123",
    "category": "한식",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "reviewCount": 23,
    "averageRating": 4.2
  }
}
```

**응답 (실패)**:
```json
{
  "success": false,
  "error": "PLACE_NOT_FOUND",
  "message": "장소 정보를 찾을 수 없습니다."
}
```

**구현 방법**:
1. Supabase에서 places 테이블 조회
2. LEFT JOIN으로 reviews 테이블과 조인
3. AVG(rating), COUNT(*) 계산
4. 장소 정보가 DB에 없으면 404 반환 (네이버 API 호출 안 함)

**SQL 쿼리**:
```sql
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

#### 4.2.2 GET /api/reviews

**목적**: 리뷰 목록 조회 (페이지네이션)

**요청**:
```
GET /api/reviews?placeId=12345&limit=10&offset=0
```

**쿼리 파라미터**:
- `placeId` (필수): 장소 ID
- `limit` (선택, 기본값 10, 최대 50): 페이지당 리뷰 개수
- `offset` (선택, 기본값 0): 건너뛸 리뷰 개수

**응답 (성공)**:
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid-1",
        "authorName": "김민지",
        "rating": 5,
        "content": "정말 맛있어요. 재방문 의사 100%!",
        "createdAt": "2025-10-20T14:30:00Z"
      }
    ],
    "total": 23,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**구현 방법**:
1. placeId, limit, offset 파라미터 검증
2. Supabase에서 reviews 테이블 조회
3. ORDER BY created_at DESC로 최신순 정렬
4. LIMIT, OFFSET 적용
5. hasMore 계산: `total > (offset + limit)`

**SQL 쿼리**:
```sql
-- 리뷰 목록
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

-- 총 개수
SELECT COUNT(*) as total
FROM reviews
WHERE place_id = $1;
```

### 4.3 백엔드 파일 구현

#### 4.3.1 schema.ts

```typescript
import { z } from 'zod';

// 장소 상세 응답 스키마
export const PlaceDetailResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    placeId: z.string(),
    name: z.string(),
    address: z.string(),
    category: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    reviewCount: z.number(),
    averageRating: z.number(),
  }),
});

// 리뷰 목록 쿼리 파라미터 스키마
export const ReviewListQuerySchema = z.object({
  placeId: z.string().min(1),
  limit: z.string().optional().transform(val => {
    const num = val ? parseInt(val, 10) : 10;
    return Math.min(Math.max(num, 1), 50); // 1~50 범위
  }),
  offset: z.string().optional().transform(val => {
    const num = val ? parseInt(val, 10) : 0;
    return Math.max(num, 0); // 0 이상
  }),
});

export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;
```

#### 4.3.2 service.ts

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlaceDetail } from '@/types/place';
import type { Review, ReviewListResponse } from '@/types/review';

/**
 * 장소 정보 및 리뷰 통계 조회
 */
export const getPlaceDetail = async (
  placeId: string,
  supabase: SupabaseClient
): Promise<PlaceDetail | null> => {
  const { data, error } = await supabase
    .rpc('get_place_with_stats', { p_place_id: placeId })
    .single();

  if (error || !data) {
    return null;
  }

  return {
    placeId: data.place_id,
    name: data.name,
    address: data.address,
    category: data.category,
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    reviewCount: data.review_count,
    averageRating: parseFloat(data.average_rating),
  };
};

/**
 * 리뷰 목록 조회 (페이지네이션)
 */
export const getReviews = async (
  placeId: string,
  limit: number,
  offset: number,
  supabase: SupabaseClient
): Promise<ReviewListResponse> => {
  // 리뷰 목록 조회
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, author_name, rating, content, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (reviewsError) {
    throw reviewsError;
  }

  // 총 개수 조회
  const { count, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('place_id', placeId);

  if (countError) {
    throw countError;
  }

  const total = count || 0;
  const hasMore = total > offset + limit;

  return {
    reviews: (reviews || []).map(r => ({
      id: r.id,
      placeId,
      authorName: r.author_name,
      rating: r.rating,
      content: r.content,
      createdAt: r.created_at,
    })),
    total,
    limit,
    offset,
    hasMore,
  };
};
```

#### 4.3.3 route.ts

```typescript
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getPlaceDetail, getReviews } from './service';
import { ReviewListQuerySchema } from './schema';

export const registerPlaceDetailRoutes = (app: Hono<AppEnv>) => {
  // 장소 정보 조회 API
  app.get('/api/places/:placeId', async (c) => {
    const placeId = c.req.param('placeId');

    if (!placeId) {
      return c.json(
        {
          success: false,
          error: 'INVALID_PLACE_ID',
          message: 'placeId is required',
        },
        400
      );
    }

    try {
      const placeDetail = await getPlaceDetail(placeId, c.get('supabase'));

      if (!placeDetail) {
        return c.json(
          {
            success: false,
            error: 'PLACE_NOT_FOUND',
            message: '장소 정보를 찾을 수 없습니다.',
          },
          404
        );
      }

      return c.json({
        success: true,
        data: placeDetail,
      });
    } catch (error) {
      c.get('logger').error('Place detail fetch failed', error);
      return c.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message: '장소 정보를 불러올 수 없습니다.',
        },
        500
      );
    }
  });

  // 리뷰 목록 조회 API
  app.get('/api/reviews', async (c) => {
    const params = {
      placeId: c.req.query('placeId'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    };

    const validation = ReviewListQuerySchema.safeParse(params);

    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: 'INVALID_PARAMS',
          message: 'Invalid query parameters',
        },
        400
      );
    }

    const { placeId, limit, offset } = validation.data;

    try {
      const result = await getReviews(
        placeId,
        limit,
        offset,
        c.get('supabase')
      );

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      c.get('logger').error('Reviews fetch failed', error);
      return c.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message: '리뷰를 불러올 수 없습니다.',
        },
        500
      );
    }
  });
};
```

### 4.4 Hono 앱에 라우트 등록

`src/backend/hono/app.ts` 파일 수정:

```typescript
import { registerPlaceDetailRoutes } from "@/features/place-detail/backend/route";

export const createHonoApp = () => {
  // ... 기존 코드 ...

  registerExampleRoutes(app);
  registerPlaceSearchRoutes(app);
  registerMapMarkersRoutes(app);
  registerPlaceDetailRoutes(app);  // 추가

  // ... 기존 코드 ...
};
```

### 4.5 Supabase RPC 함수 (선택적 최적화)

단일 쿼리로 장소 정보와 통계를 가져오기 위한 RPC 함수:

```sql
-- supabase/migrations/0002_create_place_detail_rpc.sql
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
```

---

## 5. 프론트엔드 구현 계획

### 5.1 React Query Hooks

#### 5.1.1 usePlace Hook

**경로**: `src/features/place-detail/hooks/use-place.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { PlaceDetail } from '@/types/place';

interface UsePlaceOptions {
  placeId: string;
  enabled?: boolean;
}

export function usePlace({ placeId, enabled = true }: UsePlaceOptions) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: PlaceDetail;
      }>(`/api/places/${placeId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch place');
      }

      return response.data;
    },
    enabled: enabled && !!placeId,
    staleTime: 5 * 60 * 1000,  // 5분
    gcTime: 10 * 60 * 1000,     // 10분
    retry: 2,
  });
}
```

#### 5.1.2 useReviews Hook (무한 스크롤)

**경로**: `src/features/place-detail/hooks/use-reviews.ts`

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ReviewListResponse } from '@/types/review';

interface UseReviewsOptions {
  placeId: string;
  enabled?: boolean;
  limit?: number;
}

export function useReviews({
  placeId,
  enabled = true,
  limit = 10,
}: UseReviewsOptions) {
  return useInfiniteQuery({
    queryKey: ['reviews', placeId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.get<{
        success: boolean;
        data: ReviewListResponse;
      }>('/api/reviews', {
        params: {
          placeId,
          limit: limit.toString(),
          offset: pageParam.toString(),
        },
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch reviews');
      }

      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * limit;
    },
    enabled: enabled && !!placeId,
    staleTime: 60 * 1000,      // 1분
    gcTime: 5 * 60 * 1000,     // 5분
    retry: 2,
  });
}
```

### 5.2 Intersection Observer Hook

**경로**: `src/hooks/use-intersection-observer.ts`

```typescript
import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  onIntersect: () => void;
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  threshold = 0.1,
  rootMargin = '100px',
}: UseIntersectionObserverOptions) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, onIntersect, threshold, rootMargin]);

  return targetRef;
}
```

---

## 6. 컴포넌트 구조

### 6.1 컴포넌트 트리

```
PlaceDetailPage (page.tsx)
├── Header (뒤로가기 버튼)
├── PlaceInfoCard (장소 정보)
├── ReviewStats (평균 평점, 리뷰 개수)
├── WriteReviewButton (리뷰 작성)
└── ReviewList (리뷰 목록)
    ├── ReviewItem × N
    ├── LoadingSpinner (무한 스크롤)
    └── AllLoadedMessage

ReviewDetailModal (별도 오버레이)
```

### 6.2 주요 컴포넌트 명세

#### 6.2.1 PlaceDetailPage

**경로**: `src/app/place/detail/page.tsx`

**Props**:
```typescript
interface PlaceDetailPageProps {
  searchParams: Promise<{ placeId?: string; refresh?: string }>;
}
```

**책임**:
- URL 파라미터 파싱 및 검증
- `usePlace`, `useReviews` 호출
- 로딩/에러/성공 상태 처리
- 모달 상태 관리 (isModalOpen, selectedReviewId)

#### 6.2.2 PlaceInfoCard

**경로**: `src/features/place-detail/components/place-info-card.tsx`

**Props**:
```typescript
interface PlaceInfoCardProps {
  place: PlaceDetail;
}
```

**렌더링**:
- 장소명 (h2)
- 주소 (p)
- 카테고리 (Badge)

#### 6.2.3 ReviewStats

**경로**: `src/features/place-detail/components/review-stats.tsx`

**Props**:
```typescript
interface ReviewStatsProps {
  averageRating: number;
  reviewCount: number;
}
```

**렌더링**:
- RatingStars (평균 평점)
- 리뷰 개수 텍스트

#### 6.2.4 ReviewList

**경로**: `src/features/place-detail/components/review-list.tsx`

**Props**:
```typescript
interface ReviewListProps {
  placeId: string;
  onReviewClick: (reviewId: string) => void;
}
```

**책임**:
- `useReviews` 호출
- 무한 스크롤 구현 (useIntersectionObserver)
- 로딩/에러/빈 상태 UI
- ReviewItem 렌더링

#### 6.2.5 ReviewItem

**경로**: `src/features/place-detail/components/review-item.tsx`

**Props**:
```typescript
interface ReviewItemProps {
  review: Review;
  onClick: () => void;
}
```

**렌더링**:
- 작성자명 + 평점 (RatingStars)
- 리뷰 본문 (truncateReviewContent)
- 작성일 (formatDate)

#### 6.2.6 ReviewDetailModal

**경로**: `src/features/place-detail/components/review-detail-modal.tsx`

**Props**:
```typescript
interface ReviewDetailModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**렌더링**:
- shadcn-ui Dialog 사용
- 리뷰 전체 내용 표시
- 닫기 버튼

#### 6.2.7 WriteReviewButton

**경로**: `src/features/place-detail/components/write-review-button.tsx`

**Props**:
```typescript
interface WriteReviewButtonProps {
  placeId: string;
  place: PlaceDetail;
}
```

**동작**:
- 리뷰 작성 페이지로 네비게이션
- 장소 정보를 URL 파라미터로 전달

---

## 7. 무한 스크롤 구현 전략

### 7.1 구현 방법

**Intersection Observer API** 사용

### 7.2 동작 순서

1. ReviewList 하단에 `<div ref={loadMoreRef}>` 요소 배치
2. 이 요소가 뷰포트에 진입하면 Intersection Observer 콜백 실행
3. `hasNextPage && !isFetchingNextPage` 확인
4. `fetchNextPage()` 호출
5. React Query가 다음 페이지 API 호출
6. 응답 데이터를 기존 pages 배열에 append
7. 컴포넌트 리렌더링으로 새 리뷰 표시

### 7.3 코드 예시

```typescript
function ReviewList({ placeId, onReviewClick }: ReviewListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviews({ placeId });

  const loadMoreRef = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: !!hasNextPage,
  });

  const allReviews = data?.pages.flatMap(page => page.reviews) ?? [];

  return (
    <div>
      {allReviews.map(review => (
        <ReviewItem key={review.id} review={review} onClick={() => onReviewClick(review.id)} />
      ))}

      <div ref={loadMoreRef} className="h-20">
        {isFetchingNextPage && <LoadingSpinner />}
        {!hasNextPage && allReviews.length > 0 && (
          <p className="text-center text-muted-foreground">
            모든 리뷰를 확인했습니다
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## 8. 단계별 구현 순서

### 단계 1: 백엔드 구현 (1일차)

1. [ ] `src/features/place-detail/backend/schema.ts` 작성
2. [ ] `src/features/place-detail/backend/service.ts` 작성
3. [ ] `src/features/place-detail/backend/route.ts` 작성
4. [ ] `src/backend/hono/app.ts`에 라우트 등록
5. [ ] Supabase RPC 함수 생성 (선택적)
6. [ ] API 테스트 (Postman 또는 curl)

**검증 방법**:
```bash
# 장소 정보 조회
curl http://localhost:3000/api/places/12345

# 리뷰 목록 조회
curl http://localhost:3000/api/reviews?placeId=12345&limit=10&offset=0
```

### 단계 2: React Query Hooks 구현 (2일차)

1. [ ] `src/features/place-detail/hooks/use-place.ts` 작성
2. [ ] `src/features/place-detail/hooks/use-reviews.ts` 작성
3. [ ] `src/hooks/use-intersection-observer.ts` 작성
4. [ ] Hook 테스트 (간단한 테스트 컴포넌트로 검증)

### 단계 3: 공통 컴포넌트 구현 (3일차)

1. [ ] `src/features/place-detail/components/place-info-card.tsx` 작성
2. [ ] `src/features/place-detail/components/review-stats.tsx` 작성
3. [ ] `src/features/place-detail/components/review-item.tsx` 작성
4. [ ] 컴포넌트 Storybook 작성 (선택적)

### 단계 4: 리뷰 목록 및 무한 스크롤 (4일차)

1. [ ] `src/features/place-detail/components/review-list.tsx` 작성
2. [ ] 무한 스크롤 동작 테스트
3. [ ] 로딩/에러/빈 상태 UI 구현

### 단계 5: 모달 및 네비게이션 (5일차)

1. [ ] `src/features/place-detail/components/review-detail-modal.tsx` 작성
2. [ ] `src/features/place-detail/components/write-review-button.tsx` 작성
3. [ ] 모달 열기/닫기 동작 테스트

### 단계 6: 메인 페이지 통합 (6일차)

1. [ ] `src/app/place/detail/page.tsx` 작성
2. [ ] URL 파라미터 처리
3. [ ] 상태 관리 (모달 열림/닫힘, 선택된 리뷰)
4. [ ] 전체 플로우 테스트

### 단계 7: 테스트 및 버그 수정 (7일차)

1. [ ] 전체 시나리오 테스트
2. [ ] 엣지 케이스 테스트
3. [ ] 성능 최적화
4. [ ] UI/UX 개선

---

## 9. 테스트 항목

### 9.1 백엔드 API 테스트

| 테스트 케이스 | 입력 | 기대 결과 | 상태 |
|-------------|------|----------|------|
| 장소 정보 조회 성공 | placeId: "12345" | 200, 장소 정보 + 통계 반환 | 미실행 |
| 장소 정보 없음 | placeId: "invalid" | 404, PLACE_NOT_FOUND | 미실행 |
| placeId 누락 | placeId: "" | 400, INVALID_PLACE_ID | 미실행 |
| 리뷰 목록 조회 성공 | placeId, limit=10, offset=0 | 200, 리뷰 배열 + hasMore | 미실행 |
| 리뷰 없음 | placeId (리뷰 0개) | 200, reviews: [] | 미실행 |
| limit 초과 | limit=100 | 200, limit 자동 50으로 제한 | 미실행 |
| offset 음수 | offset=-10 | 200, offset 자동 0으로 조정 | 미실행 |

### 9.2 프론트엔드 통합 테스트

| 테스트 케이스 | 시나리오 | 기대 결과 | 상태 |
|-------------|---------|----------|------|
| 페이지 정상 로딩 | placeId 파라미터 제공 | 장소 정보 + 리뷰 목록 표시 | 미실행 |
| URL 파라미터 누락 | placeId 없음 | 에러 페이지 표시, 홈으로 이동 | 미실행 |
| 장소 정보 로드 실패 | API 500 에러 | 에러 메시지 + 재시도 버튼 | 미실행 |
| 리뷰 없음 | reviewCount: 0 | 빈 상태 UI 표시 | 미실행 |
| 무한 스크롤 | 스크롤 하단 도달 | 추가 리뷰 로드 | 미실행 |
| 무한 스크롤 완료 | hasMore: false | "모든 리뷰를 확인했습니다" | 미실행 |
| 리뷰 클릭 | 리뷰 아이템 클릭 | 모달 열림, 전체 내용 표시 | 미실행 |
| 모달 닫기 | 모달 외부 클릭 | 모달 닫힘 | 미실행 |
| 리뷰 작성 버튼 | 버튼 클릭 | 리뷰 작성 페이지로 이동 | 미실행 |

### 9.3 성능 테스트

| 항목 | 목표 | 측정 방법 | 상태 |
|------|------|----------|------|
| 페이지 로딩 시간 | 3초 이내 | Lighthouse | 미실행 |
| 장소 정보 API 응답 | 1초 이내 | Network 탭 | 미실행 |
| 리뷰 목록 API 응답 | 1초 이내 | Network 탭 | 미실행 |
| 무한 스크롤 추가 로드 | 500ms 이내 | Network 탭 | 미실행 |

---

## 10. 파일 구조

구현 완료 후 예상 파일 구조:

```
src/
├── app/
│   └── place/
│       └── detail/
│           └── page.tsx                    # 메인 페이지
├── features/
│   └── place-detail/
│       ├── backend/
│       │   ├── route.ts                    # Hono 라우터
│       │   ├── service.ts                  # Supabase 로직
│       │   └── schema.ts                   # Zod 스키마
│       ├── hooks/
│       │   ├── use-place.ts                # 장소 조회 Hook
│       │   └── use-reviews.ts              # 리뷰 무한 스크롤 Hook
│       └── components/
│           ├── place-info-card.tsx         # 장소 정보 카드
│           ├── review-stats.tsx            # 리뷰 통계
│           ├── review-list.tsx             # 리뷰 목록
│           ├── review-item.tsx             # 리뷰 아이템
│           ├── review-detail-modal.tsx     # 리뷰 상세 모달
│           └── write-review-button.tsx     # 리뷰 작성 버튼
├── hooks/
│   └── use-intersection-observer.ts        # 무한 스크롤 Hook
└── types/
    ├── place.ts                            # Place, PlaceDetail 타입
    └── review.ts                           # Review, ReviewListResponse 타입

supabase/
└── migrations/
    └── 0002_create_place_detail_rpc.sql    # RPC 함수 (선택적)
```

---

## 11. 주의사항 및 베스트 프랙티스

### 11.1 코드베이스 규칙 준수

- ✅ 모든 컴포넌트에 `'use client'` 지시어 사용
- ✅ page.tsx의 searchParams는 Promise로 처리
- ✅ HTTP 요청은 `@/lib/remote/api-client`를 통해 처리
- ✅ Hono 라우트는 `/api` prefix 포함
- ✅ `logger.log()` 대신 `logger.info()` 사용

### 11.2 DRY 원칙

- 공통 타입은 `src/types/` 재사용
- 공통 컴포넌트는 `src/components/common/` 재사용
- 공통 유틸은 `src/lib/format/` 재사용

### 11.3 에러 처리

- 모든 API 호출에 try-catch 적용
- 사용자 친화적 에러 메시지 제공
- 재시도 버튼 제공

### 11.4 성능 최적화

- React Query 캐싱 활용 (staleTime, gcTime)
- 무한 스크롤로 초기 로딩 부담 감소
- 이미지 lazy loading (향후 이미지 기능 추가 시)

### 11.5 접근성

- WCAG 2.1 AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환성 (aria-label 사용)

---

## 12. 완료 체크리스트

### 12.1 백엔드

- [ ] schema.ts 작성 완료
- [ ] service.ts 작성 완료
- [ ] route.ts 작성 완료
- [ ] Hono 앱에 라우트 등록 완료
- [ ] API 테스트 통과

### 12.2 프론트엔드

- [ ] usePlace Hook 작성 완료
- [ ] useReviews Hook 작성 완료
- [ ] useIntersectionObserver Hook 작성 완료
- [ ] 모든 컴포넌트 작성 완료
- [ ] 메인 페이지 통합 완료

### 12.3 테스트

- [ ] 백엔드 API 테스트 통과
- [ ] 프론트엔드 통합 테스트 통과
- [ ] 성능 테스트 통과
- [ ] 엣지 케이스 테스트 통과

### 12.4 문서화

- [ ] 구현 계획 문서 작성 (현재 문서)
- [ ] API 명세 문서 작성 (현재 문서 포함)
- [ ] 컴포넌트 사용법 문서 (JSDoc 주석)

---

## 13. 다음 단계

장소 상세 페이지 구현 완료 후:

1. **리뷰 작성 페이지** 구현 (UC-003)
2. **홈 페이지** 지도 및 마커 구현 (UC-001, UC-002)
3. **리뷰 수정/삭제** 기능 추가 (v1.2)
4. **리뷰 이미지** 기능 추가 (v1.3)

---

**End of Document**

**작성자**: Development Team
**검토자**: Tech Lead
**승인일**: 2025-10-21

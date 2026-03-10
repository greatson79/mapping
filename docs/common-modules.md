# 공통 모듈 작업 계획

> **문서 버전**: 1.0.0
> **작성일**: 2025년 10월 21일
> **프로젝트명**: 네이버 지도 기반 맛집 리뷰 플랫폼
> **목적**: 페이지 단위 개발 시작 전 공통 모듈 사전 구현

---

## 목차

1. [개요](#1-개요)
2. [공통 타입 정의](#2-공통-타입-정의)
3. [네이버 API 연동 모듈](#3-네이버-api-연동-모듈)
4. [공통 UI 컴포넌트](#4-공통-ui-컴포넌트)
5. [공통 유틸리티 함수](#5-공통-유틸리티-함수)
6. [공통 Hooks](#6-공통-hooks)
7. [백엔드 공통 모듈](#7-백엔드-공통-모듈)
8. [Supabase 마이그레이션](#8-supabase-마이그레이션)
9. [환경 변수 설정](#9-환경-변수-설정)
10. [작업 우선순위 및 의존성](#10-작업-우선순위-및-의존성)

---

## 1. 개요

### 1.1 문서 목적

본 문서는 네이버 지도 기반 맛집 리뷰 플랫폼의 페이지 단위 개발을 시작하기 전에 구현해야 할 공통 모듈을 정의합니다. 모든 공통 모듈은 병렬 개발 시 코드 충돌을 방지하기 위해 사전에 구현되어야 합니다.

### 1.2 설계 원칙

- **YAGNI (You Aren't Gonna Need It)**: 문서에 명시된 요구사항만 구현
- **오버엔지니어링 금지**: 불필요한 추상화 및 확장성 고려 배제
- **타입 안정성**: 모든 공통 모듈은 TypeScript로 엄격하게 타입 정의
- **단일 책임**: 각 모듈은 하나의 책임만 가짐

### 1.3 코드베이스 현황

현재 프로젝트는 다음과 같은 기본 구조를 가지고 있습니다:

- **프레임워크**: Next.js 15 (App Router), React 19
- **백엔드**: Hono (API 라우터), Supabase (PostgreSQL)
- **상태 관리**: Zustand, React Query
- **UI 라이브러리**: shadcn-ui, Tailwind CSS
- **폼 관리**: React Hook Form, Zod
- **유틸리티**: date-fns, es-toolkit, ts-pattern

---

## 2. 공통 타입 정의

### 2.1 장소(Place) 타입

**경로**: `src/types/place.ts`

```typescript
/**
 * 네이버 장소검색 API 응답 타입
 */
export interface NaverPlaceItem {
  title: string;           // HTML 태그 포함된 장소명
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;         // 지번 주소
  roadAddress: string;     // 도로명 주소
  mapx: string;            // 경도 (KATEC X 좌표)
  mapy: string;            // 위도 (KATEC Y 좌표)
}

/**
 * 장소 기본 정보 타입 (정규화된 형태)
 */
export interface Place {
  placeId: string;         // 네이버 장소 ID
  name: string;            // 장소명 (HTML 태그 제거됨)
  address: string;         // 주소 (도로명 우선, 없으면 지번)
  category: string;        // 카테고리
  latitude: number;        // 위도
  longitude: number;       // 경도
}

/**
 * 장소 상세 정보 타입 (리뷰 통계 포함)
 */
export interface PlaceDetail extends Place {
  reviewCount: number;     // 리뷰 개수
  averageRating: number;   // 평균 평점 (0.0 ~ 5.0)
}
```

### 2.2 리뷰(Review) 타입

**경로**: `src/types/review.ts`

```typescript
/**
 * 리뷰 기본 타입
 */
export interface Review {
  id: string;              // UUID
  placeId: string;         // 장소 ID (FK)
  authorName: string;      // 작성자명
  rating: number;          // 평점 (1~5)
  content: string;         // 리뷰 본문
  createdAt: string;       // 작성일 (ISO 8601 문자열)
}

/**
 * 리뷰 작성 요청 타입
 */
export interface CreateReviewRequest {
  placeId: string;
  placeName: string;
  address: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  authorName: string;
  rating: number;
  content: string;
  password: string;        // 평문 비밀번호
}

/**
 * 리뷰 목록 응답 타입
 */
export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

### 2.3 지도 마커 타입

**경로**: `src/types/map.ts`

```typescript
/**
 * 지도 마커 데이터 타입
 */
export interface MapMarker {
  placeId: string;
  latitude: number;
  longitude: number;
}

/**
 * 지도 Viewport 범위 타입
 */
export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * 네이버 지도 전역 타입 선언
 */
declare global {
  interface Window {
    naver: any;
  }
}

export {};
```

---

## 3. 네이버 API 연동 모듈

### 3.1 네이버 장소검색 API 클라이언트

**경로**: `src/lib/naver/search-client.ts`

```typescript
import { NaverPlaceItem, Place } from '@/types/place';

/**
 * HTML 태그 제거 함수
 */
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * KATEC 좌표 → WGS84 좌표 변환
 */
export const convertKatecToWgs84 = (mapx: string, mapy: string) => {
  const longitude = parseFloat(mapx) / 10000000;
  const latitude = parseFloat(mapy) / 10000000;
  return { latitude, longitude };
};

/**
 * 네이버 장소검색 응답 정규화
 */
export const normalizeNaverPlace = (item: NaverPlaceItem): Place => {
  const { latitude, longitude } = convertKatecToWgs84(item.mapx, item.mapy);

  return {
    placeId: `${item.mapx}_${item.mapy}`, // 좌표 기반 임시 ID
    name: stripHtmlTags(item.title),
    address: item.roadAddress || item.address,
    category: item.category,
    latitude,
    longitude,
  };
};
```

**설명**:
- 네이버 API 응답 데이터를 정규화하여 일관된 형태로 변환
- HTML 태그 제거 및 좌표 변환 로직 포함

### 3.2 네이버 지도 스크립트 로더

**경로**: `src/lib/naver/map-loader.ts`

```typescript
/**
 * 네이버 지도 SDK 로드 상태 확인
 */
export const isNaverMapLoaded = (): boolean => {
  return typeof window !== 'undefined' && window.naver !== undefined;
};

/**
 * 네이버 지도 SDK 로드 대기
 */
export const waitForNaverMap = async (
  timeout = 10000
): Promise<void> => {
  const startTime = Date.now();

  while (!isNaverMapLoaded()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Naver Map SDK loading timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
```

---

## 4. 공통 UI 컴포넌트

### 4.1 별점 표시 컴포넌트

**경로**: `src/components/common/rating-stars.tsx`

```typescript
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;        // 0.0 ~ 5.0
  size?: number;         // 별 크기 (px)
  showNumber?: boolean;  // 숫자 표시 여부
  className?: string;
}

export function RatingStars({
  rating,
  size = 16,
  showNumber = true,
  className,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* 꽉 찬 별 */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className="fill-yellow-400 text-yellow-400"
        />
      ))}

      {/* 반 별 */}
      {hasHalfStar && (
        <Star
          size={size}
          className="fill-yellow-400 text-yellow-400 opacity-50"
        />
      )}

      {/* 빈 별 */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          className="text-gray-300"
        />
      ))}

      {/* 숫자 표시 */}
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
```

### 4.2 별점 입력 컴포넌트

**경로**: `src/components/common/rating-input.tsx`

```typescript
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  className?: string;
}

export function RatingInput({
  value,
  onChange,
  size = 32,
  className,
}: RatingInputProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <Star
            size={size}
            className={cn(
              'transition-colors',
              rating <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

### 4.3 로딩 스피너 컴포넌트

**경로**: `src/components/common/loading-spinner.tsx`

```typescript
'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = 24,
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 size={size} className="animate-spin text-primary" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
```

### 4.4 빈 상태 UI 컴포넌트

**경로**: `src/components/common/empty-state.tsx`

```typescript
'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {Icon && <Icon size={48} className="text-muted-foreground mb-4" />}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

---

## 5. 공통 유틸리티 함수

### 5.1 날짜 포맷팅

**경로**: `src/lib/format/date.ts`

```typescript
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * ISO 8601 문자열을 YYYY.MM.DD 형식으로 변환
 */
export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return format(date, 'yyyy.MM.dd', { locale: ko });
};

/**
 * ISO 8601 문자열을 YYYY년 MM월 DD일 형식으로 변환
 */
export const formatDateLong = (isoString: string): string => {
  const date = new Date(isoString);
  return format(date, 'yyyy년 MM월 dd일', { locale: ko });
};
```

### 5.2 텍스트 트렁케이션

**경로**: `src/lib/format/text.ts`

```typescript
/**
 * 텍스트를 지정된 길이로 자르고 "..." 추가
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
};

/**
 * 리뷰 본문 미리보기 (100자 제한)
 */
export const truncateReviewContent = (content: string): string => {
  return truncateText(content, 100);
};
```

### 5.3 평균 평점 계산

**경로**: `src/lib/calculate/rating.ts`

```typescript
/**
 * 평균 평점 계산 (소수점 첫째 자리까지)
 */
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  const average = sum / ratings.length;

  return Math.round(average * 10) / 10;
};
```

---

## 6. 공통 Hooks

### 6.1 디바운스 Hook

**경로**: `src/hooks/use-debounce.ts`

```typescript
import { useEffect, useState } from 'react';

/**
 * 값의 변경을 지연시키는 Hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 7. 백엔드 공통 모듈

### 7.1 장소검색 API Route

**경로**: `src/features/place-search/backend/route.ts`

```typescript
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { searchPlaces } from './service';
import { SearchPlacesQuerySchema } from './schema';

export const registerPlaceSearchRoutes = (app: Hono<AppEnv>) => {
  // 장소 검색 API
  app.get('/api/search/local', async (c) => {
    const query = c.req.query('query');

    // 쿼리 파라미터 검증
    const validation = SearchPlacesQuerySchema.safeParse({ query });

    if (!validation.success) {
      return c.json(
        { error: 'Query parameter is required' },
        400
      );
    }

    try {
      const places = await searchPlaces(validation.data.query, c.get('config'));
      return c.json({ places });
    } catch (error) {
      c.get('logger').error('Place search failed', error);
      return c.json(
        { error: 'Failed to search places' },
        500
      );
    }
  });
};
```

### 7.2 장소검색 Service

**경로**: `src/features/place-search/backend/service.ts`

```typescript
import { normalizeNaverPlace } from '@/lib/naver/search-client';
import type { Place } from '@/types/place';
import type { AppConfig } from '@/backend/config';

export const searchPlaces = async (
  query: string,
  config: AppConfig
): Promise<Place[]> => {
  const apiUrl = new URL(
    'https://openapi.naver.com/v1/search/local.json'
  );
  apiUrl.searchParams.append('query', query);
  apiUrl.searchParams.append('display', '5');

  const response = await fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': config.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': config.NAVER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(`Naver API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map(normalizeNaverPlace);
};
```

### 7.3 장소검색 Schema

**경로**: `src/features/place-search/backend/schema.ts`

```typescript
import { z } from 'zod';

export const SearchPlacesQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
});

export type SearchPlacesQuery = z.infer<typeof SearchPlacesQuerySchema>;
```

### 7.4 마커 조회 API Route

**경로**: `src/features/map-markers/backend/route.ts`

```typescript
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getMarkersInBounds } from './service';
import { MapBoundsQuerySchema } from './schema';

export const registerMapMarkersRoutes = (app: Hono<AppEnv>) => {
  // 지도 마커 조회 API
  app.get('/api/markers', async (c) => {
    const params = {
      minLat: c.req.query('minLat'),
      maxLat: c.req.query('maxLat'),
      minLng: c.req.query('minLng'),
      maxLng: c.req.query('maxLng'),
    };

    const validation = MapBoundsQuerySchema.safeParse(params);

    if (!validation.success) {
      return c.json(
        { error: 'Invalid query parameters' },
        400
      );
    }

    try {
      const markers = await getMarkersInBounds(
        validation.data,
        c.get('supabase')
      );
      return c.json({ markers });
    } catch (error) {
      c.get('logger').error('Markers fetch failed', error);
      return c.json(
        { error: 'Failed to fetch markers' },
        500
      );
    }
  });
};
```

### 7.5 마커 조회 Service

**경로**: `src/features/map-markers/backend/service.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MapMarker, MapBounds } from '@/types/map';

export const getMarkersInBounds = async (
  bounds: MapBounds,
  supabase: SupabaseClient
): Promise<MapMarker[]> => {
  const { data, error } = await supabase
    .from('places')
    .select('place_id, latitude, longitude')
    .gte('latitude', bounds.minLat)
    .lte('latitude', bounds.maxLat)
    .gte('longitude', bounds.minLng)
    .lte('longitude', bounds.maxLng)
    .limit(100);

  if (error) {
    throw error;
  }

  return (data || []).map(row => ({
    placeId: row.place_id,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
};
```

### 7.6 마커 조회 Schema

**경로**: `src/features/map-markers/backend/schema.ts`

```typescript
import { z } from 'zod';

export const MapBoundsQuerySchema = z.object({
  minLat: z.string().transform(Number),
  maxLat: z.string().transform(Number),
  minLng: z.string().transform(Number),
  maxLng: z.string().transform(Number),
});

export type MapBoundsQuery = z.infer<typeof MapBoundsQuerySchema>;
```

---

## 8. Supabase 마이그레이션

### 8.1 테이블 생성 마이그레이션

**경로**: `supabase/migrations/0001_create_places_and_reviews.sql`

```sql
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
```

---

## 9. 환경 변수 설정

### 9.1 환경 변수 타입 정의

**경로**: `src/backend/config/index.ts` (수정)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // 기존 환경 변수
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // 네이버 API 환경 변수 추가
  NEXT_PUBLIC_NAVER_CLIENT_ID: z.string().min(1),
  NAVER_CLIENT_SECRET: z.string().min(1),
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | null = null;

export const getConfig = (): AppConfig => {
  if (cachedConfig) return cachedConfig;

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_NAVER_CLIENT_ID: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID,
    NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET,
  });

  if (!parsed.success) {
    console.error('Environment validation failed:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  cachedConfig = parsed.data;
  return cachedConfig;
};
```

### 9.2 .env.local 템플릿

**경로**: `.env.example` (새로 생성)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Naver Map API
NEXT_PUBLIC_NAVER_CLIENT_ID=your-client-id
NAVER_CLIENT_SECRET=your-client-secret
```

---

## 10. 작업 우선순위 및 의존성

### 10.1 작업 우선순위

| 우선순위 | 카테고리 | 작업 항목 | 이유 |
|---------|---------|---------|------|
| **P0** (최우선) | 환경 설정 | 환경 변수 타입 정의 및 설정 | 모든 API 호출의 기반 |
| **P0** | 데이터베이스 | Supabase 마이그레이션 실행 | 백엔드 API의 기반 |
| **P0** | 타입 정의 | Place, Review, Map 타입 정의 | 모든 모듈의 타입 안정성 보장 |
| **P1** (필수) | 네이버 API | 장소검색 클라이언트 및 정규화 함수 | 검색 기능의 핵심 |
| **P1** | 네이버 API | 지도 스크립트 로더 | 지도 렌더링의 기반 |
| **P1** | 백엔드 | 장소검색 API Route 및 Service | 검색 기능 제공 |
| **P1** | 백엔드 | 마커 조회 API Route 및 Service | 지도 마커 표시 |
| **P2** (권장) | UI 컴포넌트 | RatingStars, RatingInput | 리뷰 작성 및 표시 |
| **P2** | UI 컴포넌트 | LoadingSpinner, EmptyState | 사용자 경험 향상 |
| **P2** | 유틸리티 | 날짜 포맷팅, 텍스트 트렁케이션 | 리뷰 표시 |
| **P2** | Hooks | useDebounce | 지도 인터랙션 최적화 |
| **P3** (선택) | 유틸리티 | 평균 평점 계산 | 통계 계산 (서버에서 처리 가능) |

### 10.2 작업 의존성 다이어그램

```
[환경 변수 설정] (P0)
    ↓
[데이터베이스 마이그레이션] (P0)
    ↓
[공통 타입 정의] (P0)
    ↓
    ├─→ [네이버 API 모듈] (P1)
    │       ↓
    │   [장소검색 API] (P1)
    │
    ├─→ [마커 조회 API] (P1)
    │
    ├─→ [UI 컴포넌트] (P2)
    │
    ├─→ [유틸리티 함수] (P2)
    │
    └─→ [공통 Hooks] (P2)
```

### 10.3 작업 순서 권장사항

**단계 1: 기반 설정 (필수)**
1. 환경 변수 타입 정의 및 `.env.local` 설정
2. Supabase 마이그레이션 실행
3. 공통 타입 정의 (Place, Review, Map)

**단계 2: 네이버 API 연동 (필수)**
4. 네이버 장소검색 클라이언트 및 정규화 함수
5. 네이버 지도 스크립트 로더

**단계 3: 백엔드 API (필수)**
6. 장소검색 API Route, Service, Schema
7. 마커 조회 API Route, Service, Schema
8. Hono 앱에 라우트 등록

**단계 4: 공통 UI 및 유틸리티 (권장)**
9. RatingStars, RatingInput 컴포넌트
10. LoadingSpinner, EmptyState 컴포넌트
11. 날짜 포맷팅, 텍스트 트렁케이션 유틸리티
12. useDebounce Hook

### 10.4 Hono 앱 라우트 등록

**경로**: `src/backend/hono/app.ts` (수정)

```typescript
import { Hono } from "hono";
import { errorBoundary } from "@/backend/middleware/error";
import { withAppContext } from "@/backend/middleware/context";
import { withSupabase } from "@/backend/middleware/supabase";
import { registerExampleRoutes } from "@/features/example/backend/route";
import { registerPlaceSearchRoutes } from "@/features/place-search/backend/route";
import { registerMapMarkersRoutes } from "@/features/map-markers/backend/route";
import type { AppEnv } from "@/backend/hono/context";

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp && process.env.NODE_ENV === "production") {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use("*", errorBoundary());
  app.use("*", withAppContext());
  app.use("*", withSupabase());

  // 라우트 등록
  registerExampleRoutes(app);
  registerPlaceSearchRoutes(app);    // 추가
  registerMapMarkersRoutes(app);      // 추가

  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404
    );
  });

  if (process.env.NODE_ENV === "production") {
    singletonApp = app;
  }

  return app;
};
```

---

## 11. 검증 체크리스트

공통 모듈 구현 완료 후 다음 사항을 확인하세요:

### 11.1 환경 설정
- [ ] `.env.local` 파일에 모든 필수 환경 변수 설정됨
- [ ] 환경 변수 타입 검증이 정상 작동함
- [ ] 네이버 클라우드 플랫폼에서 Client ID/Secret 발급받음

### 11.2 데이터베이스
- [ ] Supabase 마이그레이션 실행 완료
- [ ] `places`, `reviews` 테이블 생성됨
- [ ] 인덱스가 정상적으로 생성됨
- [ ] RLS가 비활성화됨

### 11.3 타입 정의
- [ ] `src/types/place.ts` 생성됨
- [ ] `src/types/review.ts` 생성됨
- [ ] `src/types/map.ts` 생성됨
- [ ] TypeScript 컴파일 에러 없음

### 11.4 네이버 API 모듈
- [ ] `src/lib/naver/search-client.ts` 생성됨
- [ ] HTML 태그 제거 함수 작동함
- [ ] 좌표 변환 함수 작동함
- [ ] `src/lib/naver/map-loader.ts` 생성됨

### 11.5 백엔드 API
- [ ] 장소검색 API (`/api/search/local`) 정상 작동
- [ ] 마커 조회 API (`/api/markers`) 정상 작동
- [ ] Hono 앱에 라우트 등록됨
- [ ] API 에러 핸들링 정상 작동

### 11.6 공통 UI 컴포넌트
- [ ] RatingStars 컴포넌트 렌더링됨
- [ ] RatingInput 컴포넌트 상호작용 가능
- [ ] LoadingSpinner 애니메이션 작동
- [ ] EmptyState UI 정상 표시

### 11.7 유틸리티 및 Hooks
- [ ] 날짜 포맷팅 함수 정상 작동
- [ ] 텍스트 트렁케이션 함수 정상 작동
- [ ] useDebounce Hook 정상 작동

---

## 12. 추가 고려사항

### 12.1 코드 컨벤션
- 모든 파일은 `'use client'` 또는 `'use server'` 지시어를 명시적으로 사용
- 클라이언트 컴포넌트는 반드시 `'use client'` 사용
- 서버 전용 모듈은 `server-only` 패키지 import

### 12.2 에러 처리
- 모든 API 호출은 try-catch로 감싸기
- 사용자 친화적 에러 메시지 제공
- 백엔드 에러는 로거로 기록

### 12.3 성능 최적화
- 네이버 API 호출 결과 캐싱 고려 (향후)
- 지도 마커 조회 시 LIMIT 100 적용
- 디바운스로 불필요한 API 호출 방지

### 12.4 보안
- Client Secret은 절대 클라이언트에 노출 금지
- 비밀번호는 bcrypt 해싱 (salt rounds: 10)
- XSS 방지를 위한 HTML 태그 이스케이프

---

## 13. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2025-10-21 | Development Team | 초기 문서 작성 |

---

**End of Document**

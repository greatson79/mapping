# 홈 페이지(/) 구현 계획

> **문서 버전**: 1.0.0
> **작성일**: 2025년 10월 21일
> **페이지 경로**: `/`
> **목적**: 네이버 지도 기반 리뷰 맛집 탐색 메인 페이지 구현

---

## 목차

1. [페이지 개요](#1-페이지-개요)
2. [기능 목록](#2-기능-목록)
3. [컴포넌트 구조](#3-컴포넌트-구조)
4. [상태 관리 설계](#4-상태-관리-설계)
5. [API 연동 계획](#5-api-연동-계획)
6. [단계별 구현 순서](#6-단계별-구현-순서)
7. [기술적 고려사항](#7-기술적-고려사항)
8. [테스트 항목](#8-테스트-항목)

---

## 1. 페이지 개요

### 1.1 페이지 목적

사용자가 네이버 지도를 통해 리뷰가 있는 맛집을 시각적으로 확인하고, 장소 검색을 통해 원하는 장소를 빠르게 찾을 수 있는 메인 페이지입니다.

### 1.2 주요 책임

- 네이버 지도 SDK 초기화 및 렌더링
- 현재 지도 영역 내 리뷰가 있는 장소에 마커 표시
- 장소명 검색 기능 제공
- 검색 결과 Dialog 표시 및 리뷰 작성 페이지 진입
- 마커 클릭 시 장소 상세 페이지 이동

### 1.3 관련 유스케이스

- **UC-001**: 지도 표시 및 마커 관리
- **UC-002**: 장소 검색 및 리뷰 작성 진입

### 1.4 페이지 레이아웃

```
+------------------------------------------+
|  [검색창]                     [검색 버튼]  |
+------------------------------------------+
|                                          |
|                                          |
|           네이버 지도 영역                 |
|           (마커들 표시)                    |
|           - 줌 컨트롤 (우측 상단)          |
|                                          |
|                                          |
+------------------------------------------+
```

**Dialog (검색 결과 표시 시)**:
```
+------------------------------------------+
|  검색 결과               [X 닫기]          |
+------------------------------------------+
| [장소 1]                                  |
| 장소명: 카페 A                            |
| 주소: 서울시 강남구...                     |
| 카테고리: 음식점>카페                      |
|                      [리뷰 작성] 버튼      |
+------------------------------------------+
| [장소 2]                                  |
| ...                                       |
+------------------------------------------+
```

---

## 2. 기능 목록

### 2.1 필수 기능 (P0)

| 기능 ID | 기능명 | 설명 | 유스케이스 |
|---------|--------|------|-----------|
| **F-HOME-001** | 네이버 지도 초기화 | 페이지 로딩 시 서울시청 중심 지도 표시 | UC-001 |
| **F-HOME-002** | 지도 인터랙션 | 드래그, 핀치 줌으로 지도 이동/확대 | UC-001 |
| **F-HOME-003** | 마커 표시 | 현재 viewport 내 리뷰 있는 장소 마커 렌더링 | UC-001 |
| **F-HOME-004** | 마커 실시간 업데이트 | 지도 이동/줌 시 마커 재조회 및 갱신 | UC-001 |
| **F-HOME-005** | 마커 클릭 이벤트 | 마커 클릭 시 장소 상세 페이지 이동 | UC-001 |
| **F-HOME-006** | 장소 검색 | 검색창에 장소명 입력 후 검색 실행 | UC-002 |
| **F-HOME-007** | 검색 결과 Dialog | 최대 5개 장소 목록 모달로 표시 | UC-002 |
| **F-HOME-008** | 리뷰 작성 진입 | Dialog 내 '리뷰 작성' 버튼으로 리뷰 작성 페이지 이동 | UC-002 |

### 2.2 에러 처리 (P0)

| 에러 ID | 에러 상황 | 처리 방법 |
|---------|----------|----------|
| **E-HOME-001** | 네이버 지도 SDK 로드 실패 | 에러 UI 표시, 재시도 버튼 제공 |
| **E-HOME-002** | 마커 조회 API 실패 | Toast 메시지 표시, 기존 마커 유지 |
| **E-HOME-003** | 검색 API 실패 | Dialog에 에러 메시지 표시 |
| **E-HOME-004** | 검색 결과 없음 | "검색 결과가 없습니다" 메시지 표시 |
| **E-HOME-005** | 빈 검색어 입력 | "검색어를 입력해주세요" 경고 표시 |

### 2.3 UX 개선 (P1)

| 기능 ID | 기능명 | 설명 |
|---------|--------|------|
| **F-HOME-009** | 로딩 스피너 | 지도 초기 로딩 중 스피너 표시 |
| **F-HOME-010** | 검색 중 로딩 | 검색 버튼 비활성화 및 로딩 표시 |
| **F-HOME-011** | 디바운스 적용 | 지도 이동 시 500ms 디바운스 후 마커 조회 |

---

## 3. 컴포넌트 구조

### 3.1 컴포넌트 계층 구조

```
app/page.tsx (홈 페이지)
├── SearchBar (장소 검색창 + 버튼)
├── NaverMapContainer
│   ├── NaverMap (지도 렌더링)
│   └── MapMarkers (마커 관리)
└── SearchResultDialog
    └── PlaceCard[] (검색 결과 장소 카드)
```

### 3.2 컴포넌트 상세 명세

#### 3.2.1 Page Component

**경로**: `src/app/page.tsx`

**책임**:
- 전체 레이아웃 구성
- 하위 컴포넌트 조합
- 페이지 레벨 상태 관리 (검색 Dialog 열림/닫힘)

**Props**: 없음 (App Router Page)

**상태**:
- `isSearchDialogOpen`: boolean (검색 결과 Dialog 상태)

**구현 예시**:
```typescript
'use client';

export default async function HomePage() {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <SearchBar onSearchComplete={() => setIsSearchDialogOpen(true)} />
      <NaverMapContainer className="flex-1" />
      <SearchResultDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
      />
    </div>
  );
}
```

---

#### 3.2.2 SearchBar Component

**경로**: `src/features/place-search/components/search-bar.tsx`

**책임**:
- 검색 입력 필드 및 버튼 UI
- 검색어 유효성 검증
- 검색 API 호출
- 검색 결과 Zustand store에 저장

**Props**:
```typescript
interface SearchBarProps {
  onSearchComplete?: () => void;
  className?: string;
}
```

**사용 Hooks**:
- `useSearchPlaces` (React Query): 장소 검색 API 호출

**상태**:
- `searchQuery`: string (입력된 검색어)

**구현 포인트**:
- 엔터키 입력 시 검색 실행
- 빈 문자열 검증 (trim)
- 검색 중 버튼 비활성화

---

#### 3.2.3 NaverMapContainer Component

**경로**: `src/features/map/components/naver-map-container.tsx`

**책임**:
- NaverMap 컴포넌트 래퍼
- 지도 초기화 상태 관리
- 에러 상태 처리

**Props**:
```typescript
interface NaverMapContainerProps {
  className?: string;
}
```

**상태**:
- `isMapLoaded`: boolean
- `mapError`: Error | null

**구현 포인트**:
- 지도 로딩 중 LoadingSpinner 표시
- 지도 로드 실패 시 에러 UI 표시

---

#### 3.2.4 NaverMap Component

**경로**: `src/features/map/components/naver-map.tsx`

**책임**:
- 네이버 지도 SDK 초기화
- 지도 인스턴스 생성 및 관리
- 지도 이벤트 리스너 등록 (drag, zoom)
- 현재 viewport 범위 계산 및 Zustand store 업데이트

**Props**:
```typescript
interface NaverMapProps {
  className?: string;
}
```

**사용 Hooks**:
- `useNaverMapLoader`: 네이버 지도 SDK 로드 대기
- `useDebounce`: 지도 이동 디바운스
- `useMapStore`: Zustand 지도 상태 store

**내부 Ref**:
- `mapRef`: HTMLDivElement (지도 DOM)
- `mapInstanceRef`: naver.maps.Map (지도 인스턴스)

**구현 포인트**:
1. `next/script`로 네이버 지도 SDK 로드
2. SDK 로드 완료 후 지도 인스턴스 생성
3. 지도 이동/줌 이벤트 감지 → 500ms 디바운스
4. viewport 범위 계산 → `setMapBounds()` store 업데이트

---

#### 3.2.5 MapMarkers Component

**경로**: `src/features/map/components/map-markers.tsx`

**책임**:
- 마커 조회 API 호출
- 마커 렌더링 및 제거
- 마커 클릭 이벤트 핸들러

**Props**:
```typescript
interface MapMarkersProps {
  mapInstance: naver.maps.Map | null;
}
```

**사용 Hooks**:
- `useMapStore`: viewport 범위 구독
- `useMarkersQuery` (React Query): 마커 조회 API

**구현 포인트**:
1. `mapBounds` 변경 감지 → 마커 조회 API 호출
2. 기존 마커 제거 → 새 마커 생성
3. 각 마커에 클릭 이벤트: `router.push(/place/detail?placeId=...)`

---

#### 3.2.6 SearchResultDialog Component

**경로**: `src/features/place-search/components/search-result-dialog.tsx`

**책임**:
- 검색 결과 Dialog UI
- 장소 카드 목록 렌더링
- Dialog 열림/닫힘 제어

**Props**:
```typescript
interface SearchResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**사용 Hooks**:
- `useSearchStore`: 검색 결과 구독

**구현 포인트**:
- shadcn-ui Dialog 컴포넌트 사용
- 검색 결과 없을 시 EmptyState 표시
- 외부 클릭 또는 X 버튼으로 닫기

---

#### 3.2.7 PlaceCard Component

**경로**: `src/features/place-search/components/place-card.tsx`

**책임**:
- 개별 장소 정보 표시
- '리뷰 작성' 버튼 렌더링
- 리뷰 작성 페이지 네비게이션

**Props**:
```typescript
interface PlaceCardProps {
  place: Place;
  onReviewCreate?: () => void;
}
```

**구현 포인트**:
- 장소명, 주소, 카테고리 표시
- '리뷰 작성' 버튼 클릭 → `router.push(/review/create?placeId=...&placeName=...&address=...)`

---

## 4. 상태 관리 설계

### 4.1 Zustand Store

#### 4.1.1 Map Store

**경로**: `src/features/map/stores/map-store.ts`

**목적**: 지도 viewport 범위 및 지도 상태 관리

**상태**:
```typescript
interface MapState {
  mapBounds: MapBounds | null;
  setMapBounds: (bounds: MapBounds) => void;
  resetMapBounds: () => void;
}

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
```

**사용 위치**:
- NaverMap 컴포넌트: 지도 이동 시 `setMapBounds()` 호출
- MapMarkers 컴포넌트: `mapBounds` 구독하여 마커 조회 트리거

---

#### 4.1.2 Search Store

**경로**: `src/features/place-search/stores/search-store.ts`

**목적**: 장소 검색 결과 관리

**상태**:
```typescript
interface SearchState {
  searchResults: Place[];
  setSearchResults: (results: Place[]) => void;
  clearSearchResults: () => void;
}
```

**사용 위치**:
- SearchBar 컴포넌트: 검색 완료 후 `setSearchResults()` 호출
- SearchResultDialog 컴포넌트: `searchResults` 구독하여 표시

---

### 4.2 React Query Hooks

#### 4.2.1 useMarkersQuery

**경로**: `src/features/map/hooks/use-markers-query.ts`

**목적**: 지도 viewport 내 마커 조회

**인자**:
```typescript
function useMarkersQuery(bounds: MapBounds | null)
```

**쿼리 키**:
```typescript
['markers', bounds]
```

**API 엔드포인트**:
```
GET /api/markers?minLat={}&maxLat={}&minLng={}&maxLng={}
```

**반환 타입**:
```typescript
{
  data: MapMarker[] | undefined;
  isLoading: boolean;
  error: Error | null;
}
```

**옵션**:
```typescript
{
  enabled: bounds !== null,
  staleTime: 5 * 60 * 1000, // 5분
  refetchOnWindowFocus: false,
}
```

---

#### 4.2.2 useSearchPlaces

**경로**: `src/features/place-search/hooks/use-search-places.ts`

**목적**: 장소명 검색

**인자**:
```typescript
function useSearchPlaces(query: string)
```

**쿼리 키**:
```typescript
['search', query]
```

**API 엔드포인트**:
```
GET /api/search/local?query={}
```

**반환 타입**:
```typescript
{
  data: { places: Place[] } | undefined;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}
```

**옵션**:
```typescript
{
  enabled: false, // 수동 실행
  staleTime: 10 * 60 * 1000, // 10분
}
```

---

## 5. API 연동 계획

### 5.1 마커 조회 API

**엔드포인트**: `GET /api/markers`

**이미 구현됨**: ✅ (공통 모듈에서 구현 완료)

**파일 경로**:
- Route: `src/features/map-markers/backend/route.ts`
- Service: `src/features/map-markers/backend/service.ts`
- Schema: `src/features/map-markers/backend/schema.ts`

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| minLat | number | ✅ | 최소 위도 |
| maxLat | number | ✅ | 최대 위도 |
| minLng | number | ✅ | 최소 경도 |
| maxLng | number | ✅ | 최대 경도 |

**응답 (성공 200)**:
```json
{
  "markers": [
    {
      "placeId": "12345",
      "latitude": 37.5665,
      "longitude": 126.9780
    }
  ]
}
```

**에러 응답**:
- 400: 잘못된 파라미터
- 500: 서버 오류

---

### 5.2 장소 검색 API

**엔드포인트**: `GET /api/search/local`

**이미 구현됨**: ✅ (공통 모듈에서 구현 완료)

**파일 경로**:
- Route: `src/features/place-search/backend/route.ts`
- Service: `src/features/place-search/backend/service.ts`
- Schema: `src/features/place-search/backend/schema.ts`

**요청 파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| query | string | ✅ | 검색할 장소명 |

**응답 (성공 200)**:
```json
{
  "places": [
    {
      "placeId": "12345",
      "name": "카페 A",
      "address": "서울특별시 강남구...",
      "category": "음식점>카페,디저트",
      "latitude": 37.5665,
      "longitude": 126.9780
    }
  ]
}
```

**에러 응답**:
- 400: 빈 쿼리
- 404: 검색 결과 없음
- 500: 서버 오류

---

## 6. 단계별 구현 순서

### Phase 1: 기반 구조 (우선순위 P0)

**목표**: 지도 표시 및 기본 레이아웃 구성

#### Step 1.1: 페이지 레이아웃 구성
- [ ] `src/app/page.tsx` 생성
- [ ] MainLayout 적용 (360x720 제약)
- [ ] 기본 HTML 구조 작성

#### Step 1.2: Zustand Store 생성
- [ ] `src/features/map/stores/map-store.ts` 생성
  - mapBounds 상태 정의
  - setMapBounds, resetMapBounds 액션
- [ ] `src/features/place-search/stores/search-store.ts` 생성
  - searchResults 상태 정의
  - setSearchResults, clearSearchResults 액션

#### Step 1.3: 네이버 지도 초기화
- [ ] `src/features/map/hooks/use-naver-map-loader.ts` 생성
  - `waitForNaverMap()` 래핑
  - SDK 로드 상태 반환
- [ ] `src/features/map/components/naver-map-container.tsx` 생성
  - 로딩/에러 상태 UI
- [ ] `src/features/map/components/naver-map.tsx` 생성
  - `next/script`로 SDK 로드
  - 지도 인스턴스 생성 (서울시청 중심, 줌 17)
  - 줌 컨트롤 우측 상단 배치

**검증 기준**:
- 홈 페이지 접속 시 네이버 지도가 2초 이내 표시됨
- 지도 중심이 서울시청 좌표임
- 지도 드래그, 핀치 줌 정상 작동

---

### Phase 2: 마커 표시 (우선순위 P0)

**목표**: viewport 내 리뷰 있는 장소 마커 표시

#### Step 2.1: React Query Hook 생성
- [ ] `src/features/map/hooks/use-markers-query.ts` 생성
  - 마커 조회 API 호출
  - `enabled: bounds !== null`

#### Step 2.2: 지도 viewport 이벤트 처리
- [ ] `NaverMap` 컴포넌트에 이벤트 리스너 추가
  - `idle` 이벤트 (지도 이동/줌 완료 시)
  - viewport 범위 계산 → `setMapBounds()` 호출
  - 디바운스 500ms 적용 (`useDebounce` hook)

#### Step 2.3: 마커 렌더링
- [ ] `src/features/map/components/map-markers.tsx` 생성
  - `mapBounds` 구독
  - `useMarkersQuery()` 호출
  - `naver.maps.Marker` 생성 및 지도 추가
  - 기존 마커 제거 로직

#### Step 2.4: 마커 클릭 이벤트
- [ ] 각 마커에 클릭 이벤트 리스너 등록
- [ ] 클릭 시 `router.push(/place/detail?placeId={placeId})`

**검증 기준**:
- 지도 이동 시 500ms 후 마커 재조회
- 마커 클릭 시 장소 상세 페이지 이동
- 마커 최대 100개 제한 적용

---

### Phase 3: 장소 검색 (우선순위 P0)

**목표**: 검색창 및 검색 결과 Dialog

#### Step 3.1: SearchBar 컴포넌트
- [ ] `src/features/place-search/components/search-bar.tsx` 생성
  - 입력 필드 + 검색 버튼
  - 엔터키 입력 지원
  - 빈 문자열 검증

#### Step 3.2: React Query Mutation
- [ ] `src/features/place-search/hooks/use-search-places.ts` 생성
  - 장소 검색 API 호출
  - 성공 시 `setSearchResults()` 호출

#### Step 3.3: SearchResultDialog 컴포넌트
- [ ] `src/features/place-search/components/search-result-dialog.tsx` 생성
  - shadcn-ui Dialog 사용
  - `searchResults` 구독
  - PlaceCard 목록 렌더링
  - 빈 결과 시 EmptyState 표시

#### Step 3.4: PlaceCard 컴포넌트
- [ ] `src/features/place-search/components/place-card.tsx` 생성
  - 장소명, 주소, 카테고리 표시
  - '리뷰 작성' 버튼
  - 클릭 시 리뷰 작성 페이지 이동 (장소 정보 URL 파라미터 전달)

**검증 기준**:
- 검색어 입력 후 검색 실행 시 2초 이내 결과 Dialog 표시
- 최대 5개 장소 표시
- '리뷰 작성' 버튼 클릭 시 정확한 URL 파라미터 전달

---

### Phase 4: 에러 처리 및 UX 개선 (우선순위 P1)

**목표**: 사용자 친화적 에러 처리 및 로딩 상태 표시

#### Step 4.1: 에러 UI
- [ ] 네이버 지도 SDK 로드 실패 시 에러 화면
  - 메시지: "지도를 불러올 수 없습니다."
  - 재시도 버튼
- [ ] 마커 조회 실패 시 Toast 메시지
- [ ] 검색 실패 시 Dialog 내 에러 메시지

#### Step 4.2: 로딩 상태
- [ ] 지도 초기 로딩 중 LoadingSpinner
- [ ] 검색 중 버튼 비활성화 + 텍스트 "검색 중..."
- [ ] 마커 조회 중 기존 마커 유지 (깜빡임 방지)

#### Step 4.3: 사용성 개선
- [ ] 검색 결과 없을 시 안내 메시지
- [ ] Dialog 외부 클릭으로 닫기
- [ ] ESC 키로 Dialog 닫기

**검증 기준**:
- 모든 에러 상황에 사용자 친화적 메시지 표시
- 로딩 중 명확한 피드백 제공
- 네트워크 오류 재시도 가능

---

## 7. 기술적 고려사항

### 7.1 성능 최적화

#### 7.1.1 지도 이벤트 디바운스
- **문제**: 지도 드래그 시 매 픽셀마다 이벤트 발생 → 과도한 API 호출
- **해결**: `useDebounce(mapBounds, 500)` 적용
- **구현**: `src/hooks/use-debounce.ts` (이미 구현됨)

#### 7.1.2 마커 렌더링 최적화
- **문제**: 마커 100개 이상 시 성능 저하
- **해결**: 서버에서 LIMIT 100 적용 (이미 구현됨)
- **추가 고려**: 향후 클러스터링 적용 (P2 우선순위)

#### 7.1.3 React Query 캐싱
- **마커 조회**: staleTime 5분 (동일 viewport 재조회 방지)
- **장소 검색**: staleTime 10분 (동일 검색어 재사용)

---

### 7.2 타입 안정성

#### 7.2.1 네이버 지도 SDK 타입
- **전역 타입 선언**: `src/types/map.ts`에 이미 정의됨
```typescript
declare global {
  interface Window {
    naver: any;
  }
}
```

#### 7.2.2 공통 타입 사용
- `Place`: `src/types/place.ts` (이미 정의됨)
- `MapMarker`: `src/types/map.ts` (이미 정의됨)
- `MapBounds`: `src/types/map.ts` (이미 정의됨)

---

### 7.3 환경 변수

**필요한 환경 변수**:
```env
NEXT_PUBLIC_NAVER_CLIENT_ID=네이버_클라이언트_ID
NAVER_CLIENT_SECRET=네이버_클라이언트_시크릿
```

**검증**: `src/backend/config/index.ts`에서 이미 검증 로직 구현됨

---

### 7.4 보안

#### 7.4.1 Client Secret 보호
- ✅ 서버 환경 변수로만 관리 (`NEXT_PUBLIC_` 접두사 없음)
- ✅ API Route를 통해 서버에서만 네이버 API 호출

#### 7.4.2 XSS 방지
- ✅ 네이버 API 응답의 HTML 태그 제거 (`stripHtmlTags()` 이미 구현됨)

---

### 7.5 사용자 경험 (UX)

#### 7.5.1 모바일 최적화
- MainLayout 최대 너비: 360px
- 터치 타겟 최소 크기: 44x44px
- 검색창 높이: 44px 이상

#### 7.5.2 피드백 명확성
- 로딩 중: 스피너 + 텍스트
- 에러: 명확한 메시지 + 액션 버튼
- 성공: Dialog 즉시 표시

---

## 8. 테스트 항목

### 8.1 단위 테스트 (Hooks)

| 테스트 케이스 | 입력 | 기대 결과 |
|-------------|------|----------|
| useMarkersQuery - 성공 | bounds 객체 | markers 배열 반환 |
| useMarkersQuery - bounds null | null | API 호출 안 함 |
| useSearchPlaces - 성공 | "강남 카페" | places 배열 반환 |
| useSearchPlaces - 빈 쿼리 | "" | 에러 반환 |

### 8.2 통합 테스트 (컴포넌트)

| 테스트 케이스 | 사용자 행동 | 기대 결과 |
|-------------|-----------|----------|
| 지도 초기 로딩 | 페이지 접속 | 2초 이내 지도 표시 |
| 마커 표시 | 지도 로딩 완료 | viewport 내 마커 표시 |
| 마커 클릭 | 마커 클릭 | 장소 상세 페이지 이동 |
| 장소 검색 | "경복궁" 검색 | 검색 결과 Dialog 표시 |
| 검색 결과 없음 | "존재하지않는장소" 검색 | "검색 결과가 없습니다" 메시지 |
| 빈 검색어 | "" 입력 후 검색 | "검색어를 입력해주세요" 경고 |
| 리뷰 작성 진입 | Dialog 내 '리뷰 작성' 클릭 | 리뷰 작성 페이지 이동 |

### 8.3 E2E 테스트 (플로우)

| 시나리오 | 단계 | 검증 |
|---------|------|------|
| **맛집 검색 후 리뷰 작성** | 1. 홈 접속 | 지도 표시 |
| | 2. "강남 카페" 검색 | Dialog 표시 |
| | 3. '리뷰 작성' 클릭 | 리뷰 작성 페이지 이동 |
| **마커 클릭 후 리뷰 열람** | 1. 홈 접속 | 지도 표시 |
| | 2. 지도 이동 | 마커 업데이트 |
| | 3. 마커 클릭 | 장소 상세 페이지 이동 |

### 8.4 성능 테스트

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 지도 초기 로딩 | 2초 이내 | Lighthouse Performance |
| 마커 조회 API | 1초 이내 | Network 탭 타이밍 |
| 검색 API | 2초 이내 | Network 탭 타이밍 |
| 지도 드래그 후 마커 업데이트 | 디바운스 500ms + API 1초 | 수동 테스트 |

### 8.5 브라우저 호환성

| 브라우저 | 버전 | 테스트 항목 |
|---------|------|-----------|
| Chrome | 최신 | 전체 기능 |
| Safari (iOS) | 최신 | 터치 인터랙션 |
| Firefox | 최신 | 전체 기능 |

---

## 9. 체크리스트

### 9.1 구현 완료 체크리스트

- [ ] **Phase 1 완료**: 지도 표시 및 기본 레이아웃
  - [ ] 페이지 레이아웃 구성
  - [ ] Zustand Store 생성
  - [ ] 네이버 지도 초기화

- [ ] **Phase 2 완료**: 마커 표시
  - [ ] React Query Hook 생성
  - [ ] 지도 viewport 이벤트 처리
  - [ ] 마커 렌더링
  - [ ] 마커 클릭 이벤트

- [ ] **Phase 3 완료**: 장소 검색
  - [ ] SearchBar 컴포넌트
  - [ ] React Query Mutation
  - [ ] SearchResultDialog 컴포넌트
  - [ ] PlaceCard 컴포넌트

- [ ] **Phase 4 완료**: 에러 처리 및 UX 개선
  - [ ] 에러 UI
  - [ ] 로딩 상태
  - [ ] 사용성 개선

### 9.2 품질 보증 체크리스트

- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 경고 없음
- [ ] 모든 컴포넌트 `'use client'` 지시어 사용
- [ ] 환경 변수 검증 통과
- [ ] API 엔드포인트 정상 작동
- [ ] 에러 핸들링 완료
- [ ] 로딩 상태 표시 완료
- [ ] 모바일 반응형 확인
- [ ] 성능 목표 달성 (Lighthouse 90점 이상)

### 9.3 문서화 체크리스트

- [ ] 각 컴포넌트 JSDoc 주석 작성
- [ ] 복잡한 로직에 인라인 주석
- [ ] README 업데이트 (환경 변수 설정 안내)

---

## 10. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2025-10-21 | Development Team | 초기 계획 작성 |

---

## 11. 참고 자료

- [PRD 문서](/docs/prd.md)
- [Userflow 문서](/docs/userflow.md)
- [UC-001: 지도 표시 및 마커 관리](/docs/usecases/1-map-markers/spec.md)
- [UC-002: 장소 검색](/docs/usecases/2-place-search/spec.md)
- [공통 모듈 작업 계획](/docs/common-modules.md)
- [네이버 지도 연동 가이드](/docs/external/naver-map.md)

---

**End of Document**

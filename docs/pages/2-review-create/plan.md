# 리뷰 작성 페이지 구현 계획

> **문서 버전**: 1.0.0
> **작성일**: 2025년 10월 21일
> **대상 페이지**: `/review/create`
> **우선순위**: P0 (Must Have)

---

## 목차

1. [페이지 개요](#1-페이지-개요)
2. [URL 스펙](#2-url-스펙)
3. [컴포넌트 구조](#3-컴포넌트-구조)
4. [기능 목록](#4-기능-목록)
5. [API 연동 계획](#5-api-연동-계획)
6. [폼 유효성 검증 스키마](#6-폼-유효성-검증-스키마)
7. [상태 관리](#7-상태-관리)
8. [단계별 구현 순서](#8-단계별-구현-순서)
9. [테스트 항목](#9-테스트-항목)
10. [예외 처리](#10-예외-처리)

---

## 1. 페이지 개요

### 1.1 페이지 목적

사용자가 특정 장소에 대한 리뷰를 작성할 수 있는 페이지입니다. 비회원으로 간편하게 리뷰를 작성하며, 임시 비밀번호를 설정하여 향후 수정/삭제 시 사용할 수 있습니다.

### 1.2 핵심 기능

- 장소 정보 카드 표시 (네이버 API 데이터)
- 리뷰 작성 폼 제공 (작성자명, 평점, 본문, 비밀번호)
- 실시간 유효성 검증 및 에러 메시지 표시
- 리뷰 저장 후 완료 모달 표시
- 홈 페이지로 이동

### 1.3 사용자 여정

```
검색 결과 또는 장소 상세 페이지
    ↓
'리뷰 작성' 버튼 클릭
    ↓
리뷰 작성 페이지 (/review/create?placeId=...&placeName=...)
    ↓
폼 입력 (작성자명, 평점, 본문, 비밀번호)
    ↓
'리뷰 작성하기' 버튼 클릭
    ↓
API 호출 (POST /api/reviews)
    ↓
완료 모달 표시
    ↓
'확인' 버튼 클릭
    ↓
홈 페이지로 이동 (/)
```

---

## 2. URL 스펙

### 2.1 경로

```
/review/create
```

### 2.2 필수 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `placeId` | string | ✅ | 네이버 장소 고유 ID | `1234567890_9876543210` |
| `placeName` | string | ✅ | 장소명 | `강남%20카페` |

### 2.3 선택적 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `address` | string | ❌ | 주소 (도로명 우선) | `서울시%20강남구...` |
| `category` | string | ❌ | 카테고리 | `카페,디저트` |
| `latitude` | string | ❌ | 위도 | `37.5665` |
| `longitude` | string | ❌ | 경도 | `126.9780` |

### 2.4 URL 예시

```
/review/create?placeId=1234567890_9876543210&placeName=%EA%B0%95%EB%82%A8%20%EC%B9%B4%ED%8E%98&address=%EC%84%9C%EC%9A%B8%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC
```

---

## 3. 컴포넌트 구조

### 3.1 파일 구조

```
src/
├── app/
│   └── review/
│       └── create/
│           └── page.tsx              # 메인 페이지 (Server Component)
├── features/
│   └── review-create/
│       ├── components/
│       │   ├── place-info-card.tsx   # 장소 정보 카드
│       │   ├── review-form.tsx       # 리뷰 작성 폼 (Client Component)
│       │   └── review-success-modal.tsx # 작성 완료 모달
│       ├── hooks/
│       │   ├── use-create-review.ts  # 리뷰 작성 Mutation
│       │   └── use-review-form.ts    # 폼 상태 관리 (React Hook Form)
│       ├── lib/
│       │   └── dto.ts                # 클라이언트 측 DTO 재노출
│       └── backend/
│           ├── route.ts              # Hono 라우트 (POST /api/reviews)
│           ├── service.ts            # 비즈니스 로직 (Supabase 호출)
│           ├── schema.ts             # Zod 스키마 (요청/응답)
│           └── error.ts              # 에러 코드 정의
```

### 3.2 컴포넌트 계층 구조

```
ReviewCreatePage (Server Component)
  └─ ReviewForm (Client Component)
      ├─ PlaceInfoCard
      ├─ Form Fields
      │   ├─ Input (작성자명)
      │   ├─ RatingInput (평점)
      │   ├─ Textarea (본문)
      │   └─ Input (비밀번호)
      ├─ Button (제출 버튼)
      └─ ReviewSuccessModal
```

---

## 4. 기능 목록

### 4.1 P0 (필수 기능)

| 기능 ID | 기능명 | 설명 | 우선순위 |
|--------|--------|------|----------|
| F-001 | URL 파라미터 검증 | placeId, placeName 필수 파라미터 검증 | P0 |
| F-002 | 장소 정보 카드 렌더링 | 장소명, 주소, 카테고리 표시 | P0 |
| F-003 | 리뷰 작성 폼 렌더링 | 작성자명, 평점, 본문, 비밀번호 입력 필드 | P0 |
| F-004 | 실시간 유효성 검증 | 입력값 변경 시 즉시 검증 및 에러 표시 | P0 |
| F-005 | 글자 수 카운터 표시 | 작성자명, 본문 필드 글자 수 표시 | P0 |
| F-006 | 리뷰 제출 | POST /api/reviews 호출 | P0 |
| F-007 | 로딩 상태 표시 | 제출 중 버튼 비활성화 및 스피너 | P0 |
| F-008 | 완료 모달 표시 | 저장 성공 시 모달 렌더링 | P0 |
| F-009 | 홈 페이지 이동 | 확인 버튼 클릭 시 / 경로로 이동 | P0 |

### 4.2 P1 (권장 기능)

| 기능 ID | 기능명 | 설명 | 우선순위 |
|--------|--------|------|----------|
| F-010 | 중복 제출 방지 | 제출 중 추가 클릭 무시 | P1 |
| F-011 | 에러 토스트 표시 | API 실패 시 Toast UI 표시 | P1 |
| F-012 | 뒤로가기 경고 | 작성 중 뒤로가기 시 확인 Dialog | P2 |

---

## 5. API 연동 계획

### 5.1 리뷰 작성 API

#### 엔드포인트

```
POST /api/reviews
```

#### Request

**Headers**
```
Content-Type: application/json
```

**Body**
```typescript
{
  placeId: string;        // 네이버 장소 ID
  placeName: string;      // 장소명
  address: string;        // 주소
  category?: string;      // 카테고리 (선택)
  latitude?: number;      // 위도 (선택)
  longitude?: number;     // 경도 (선택)
  authorName: string;     // 작성자명 (1~20자)
  rating: number;         // 평점 (1~5)
  content: string;        // 본문 (10~500자)
  password: string;       // 평문 비밀번호 (4~20자)
}
```

#### Response (성공)

**Status Code**: `201 Created`

```typescript
{
  success: true;
  data: {
    reviewId: string;      // UUID
    createdAt: string;     // ISO 8601
  }
}
```

#### Response (실패)

**Status Code**: `400 Bad Request`

```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

**Status Code**: `500 Internal Server Error`

```typescript
{
  success: false;
  error: {
    code: "INTERNAL_ERROR";
    message: "Failed to create review";
  }
}
```

### 5.2 백엔드 처리 흐름

```typescript
POST /api/reviews
    ↓
1. 요청 데이터 검증 (Zod 스키마)
    ↓
2. 비밀번호 bcrypt 해싱 (salt rounds: 10)
    ↓
3. Supabase 트랜잭션 시작
    ↓
4. places 테이블 UPSERT (ON CONFLICT DO NOTHING)
    ↓
5. reviews 테이블 INSERT
    ↓
6. 트랜잭션 커밋
    ↓
7. 응답 반환 { success: true, reviewId, createdAt }
```

---

## 6. 폼 유효성 검증 스키마

### 6.1 Zod 스키마 정의

**경로**: `src/features/review-create/backend/schema.ts`

```typescript
import { z } from 'zod';

// 요청 스키마
export const CreateReviewRequestSchema = z.object({
  placeId: z.string().min(1, '장소 ID는 필수입니다'),
  placeName: z.string().min(1, '장소명은 필수입니다'),
  address: z.string().min(1, '주소는 필수입니다'),
  category: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  authorName: z.string()
    .min(1, '작성자명을 입력해주세요')
    .max(20, '작성자명은 최대 20자까지 입력 가능합니다')
    .refine((val) => val.trim().length > 0, {
      message: '작성자명은 공백만으로 구성될 수 없습니다',
    }),
  rating: z.number()
    .int('평점은 정수여야 합니다')
    .min(1, '평점은 최소 1점입니다')
    .max(5, '평점은 최대 5점입니다'),
  content: z.string()
    .min(10, '리뷰는 최소 10자 이상 작성해주세요')
    .max(500, '리뷰는 최대 500자까지 작성 가능합니다'),
  password: z.string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 최대 20자까지 입력 가능합니다'),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;

// 응답 스키마
export const CreateReviewResponseSchema = z.object({
  reviewId: z.string().uuid(),
  createdAt: z.string(),
});

export type CreateReviewResponse = z.infer<typeof CreateReviewResponseSchema>;
```

### 6.2 프론트엔드 폼 검증

**경로**: `src/features/review-create/hooks/use-review-form.ts`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateReviewRequestSchema, type CreateReviewRequest } from '../lib/dto';

export const useReviewForm = (defaultValues: Partial<CreateReviewRequest>) => {
  const form = useForm<CreateReviewRequest>({
    resolver: zodResolver(CreateReviewRequestSchema),
    defaultValues: {
      placeId: defaultValues.placeId || '',
      placeName: defaultValues.placeName || '',
      address: defaultValues.address || '',
      category: defaultValues.category,
      latitude: defaultValues.latitude,
      longitude: defaultValues.longitude,
      authorName: '',
      rating: 0,
      content: '',
      password: '',
    },
    mode: 'onChange', // 실시간 검증
  });

  return form;
};
```

### 6.3 필드별 검증 규칙

| 필드명 | 최소 | 최대 | 규칙 | 에러 메시지 |
|--------|------|------|------|------------|
| `authorName` | 1자 | 20자 | 공백만 불가 | "작성자명을 입력해주세요" |
| `rating` | 1 | 5 | 정수 필수 | "평점을 선택해주세요" |
| `content` | 10자 | 500자 | - | "리뷰는 10~500자로 작성해주세요" |
| `password` | 4자 | 20자 | - | "비밀번호는 4~20자로 입력해주세요" |

---

## 7. 상태 관리

### 7.1 로컬 상태 (React Hook Form)

리뷰 작성 폼의 모든 입력값은 `react-hook-form`으로 관리합니다.

```typescript
const form = useForm<CreateReviewRequest>({
  resolver: zodResolver(CreateReviewRequestSchema),
  defaultValues: { ... },
  mode: 'onChange',
});
```

### 7.2 서버 상태 (React Query)

리뷰 작성 API 호출은 React Query의 `useMutation`으로 관리합니다.

**경로**: `src/features/review-create/hooks/use-create-review.ts`

```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateReviewRequest, CreateReviewResponse } from '../lib/dto';

export const useCreateReview = () => {
  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      const response = await apiClient.post<CreateReviewResponse>(
        '/api/reviews',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Review created:', data.reviewId);
    },
    onError: (error) => {
      console.error('Failed to create review:', error);
    },
  });
};
```

### 7.3 UI 상태 (useState)

- 완료 모달 표시 여부: `const [showModal, setShowModal] = useState(false)`

---

## 8. 단계별 구현 순서

### Phase 1: 백엔드 API 구현 (우선순위: 최우선)

#### Step 1-1: Schema 정의
- [ ] `src/features/review-create/backend/schema.ts` 생성
- [ ] `CreateReviewRequestSchema` 정의
- [ ] `CreateReviewResponseSchema` 정의

#### Step 1-2: Service 구현
- [ ] `src/features/review-create/backend/service.ts` 생성
- [ ] `createReview` 함수 구현
  - [ ] 비밀번호 bcrypt 해싱 (salt rounds: 10)
  - [ ] Supabase 트랜잭션으로 places UPSERT + reviews INSERT
  - [ ] 에러 핸들링

#### Step 1-3: Error 정의
- [ ] `src/features/review-create/backend/error.ts` 생성
- [ ] 에러 코드 정의 (VALIDATION_ERROR, DB_ERROR 등)

#### Step 1-4: Route 구현
- [ ] `src/features/review-create/backend/route.ts` 생성
- [ ] `POST /api/reviews` 라우트 구현
- [ ] 요청 데이터 검증 (Zod)
- [ ] Service 호출 및 응답 반환

#### Step 1-5: Hono 앱에 라우트 등록
- [ ] `src/backend/hono/app.ts` 수정
- [ ] `registerReviewCreateRoutes(app)` 추가

---

### Phase 2: 프론트엔드 기본 구조 (우선순위: 필수)

#### Step 2-1: DTO 재노출
- [ ] `src/features/review-create/lib/dto.ts` 생성
- [ ] 백엔드 스키마 re-export

#### Step 2-2: 페이지 파일 생성
- [ ] `src/app/review/create/page.tsx` 생성 (Server Component)
- [ ] URL 쿼리 파라미터 파싱
- [ ] 필수 파라미터 검증 (placeId, placeName)
- [ ] 검증 실패 시 홈으로 리다이렉트

#### Step 2-3: 장소 정보 카드 컴포넌트
- [ ] `src/features/review-create/components/place-info-card.tsx` 생성
- [ ] 장소명, 주소, 카테고리 표시
- [ ] Card UI (shadcn-ui) 사용

---

### Phase 3: 폼 구현 (우선순위: 필수)

#### Step 3-1: React Hook Form Hook
- [ ] `src/features/review-create/hooks/use-review-form.ts` 생성
- [ ] useForm 설정 (Zod resolver, mode: 'onChange')
- [ ] 기본값 설정

#### Step 3-2: 리뷰 작성 폼 컴포넌트
- [ ] `src/features/review-create/components/review-form.tsx` 생성 (Client Component)
- [ ] 작성자명 Input 필드
- [ ] 평점 RatingInput 컴포넌트 (별점)
- [ ] 본문 Textarea 필드
- [ ] 비밀번호 Input 필드
- [ ] 필드별 에러 메시지 표시
- [ ] 글자 수 카운터 표시

#### Step 3-3: 제출 버튼
- [ ] 버튼 렌더링
- [ ] 유효성 검증 실패 시 비활성화
- [ ] 로딩 중 스피너 표시
- [ ] onClick 핸들러 연결

---

### Phase 4: API 연동 (우선순위: 필수)

#### Step 4-1: Mutation Hook
- [ ] `src/features/review-create/hooks/use-create-review.ts` 생성
- [ ] useMutation 설정
- [ ] POST /api/reviews 호출
- [ ] onSuccess, onError 핸들러

#### Step 4-2: 폼 제출 로직
- [ ] 폼 onSubmit 핸들러 구현
- [ ] Mutation 실행
- [ ] 로딩 상태 반영
- [ ] 에러 처리 (Toast 표시)

---

### Phase 5: 완료 모달 (우선순위: 필수)

#### Step 5-1: 완료 모달 컴포넌트
- [ ] `src/features/review-create/components/review-success-modal.tsx` 생성
- [ ] Dialog UI (shadcn-ui) 사용
- [ ] 제목: "리뷰가 작성되었습니다!"
- [ ] 내용: "소중한 리뷰 감사합니다."
- [ ] 확인 버튼

#### Step 5-2: 모달 표시 로직
- [ ] Mutation 성공 시 모달 표시 (setShowModal(true))
- [ ] 확인 버튼 클릭 시 홈 이동 (router.push('/'))

---

### Phase 6: 추가 기능 (우선순위: 권장)

#### Step 6-1: 중복 제출 방지
- [ ] 제출 중 버튼 비활성화
- [ ] 로딩 중 추가 클릭 무시

#### Step 6-2: 에러 Toast
- [ ] shadcn-ui Toast 컴포넌트 사용
- [ ] API 실패 시 에러 메시지 표시

---

## 9. 테스트 항목

### 9.1 단위 테스트

#### 백엔드
- [ ] `createReview` 서비스 함수 테스트
  - [ ] 정상 케이스: 장소 생성 + 리뷰 저장
  - [ ] 중복 장소: ON CONFLICT DO NOTHING 동작
  - [ ] 비밀번호 해싱 검증
  - [ ] 트랜잭션 롤백 (에러 발생 시)

#### 프론트엔드
- [ ] 폼 유효성 검증 테스트
  - [ ] 각 필드 최소/최대 길이 검증
  - [ ] 공백만 입력 시 에러
  - [ ] 평점 미선택 시 에러

### 9.2 통합 테스트

- [ ] API 엔드포인트 테스트
  - [ ] POST /api/reviews 정상 동작
  - [ ] 400 Bad Request (유효성 실패)
  - [ ] 500 Internal Error (DB 오류)

### 9.3 E2E 테스트

- [ ] 전체 사용자 플로우
  1. [ ] /review/create 페이지 접속 (URL 파라미터 포함)
  2. [ ] 장소 정보 카드 표시 확인
  3. [ ] 폼 입력
  4. [ ] 제출 버튼 클릭
  5. [ ] 로딩 스피너 표시 확인
  6. [ ] 완료 모달 표시 확인
  7. [ ] 확인 버튼 클릭 시 홈 이동 확인

### 9.4 수동 테스트 체크리스트

#### 정상 케이스
- [ ] 모든 필드 정상 입력 후 제출 → 성공 모달 표시
- [ ] 완료 모달 확인 버튼 클릭 → 홈 페이지 이동
- [ ] Supabase reviews 테이블에 데이터 저장 확인
- [ ] Supabase places 테이블에 장소 데이터 저장 확인

#### 에러 케이스
- [ ] 작성자명 빈 값 → "작성자명을 입력해주세요" 에러
- [ ] 작성자명 21자 입력 → "작성자명은 최대 20자까지" 에러
- [ ] 평점 미선택 → "평점을 선택해주세요" 에러
- [ ] 본문 9자 입력 → "리뷰는 최소 10자 이상" 에러
- [ ] 본문 501자 입력 → "리뷰는 최대 500자까지" 에러
- [ ] 비밀번호 3자 입력 → "비밀번호는 최소 4자 이상" 에러

#### 엣지 케이스
- [ ] URL 파라미터 누락 (placeId 없음) → 홈으로 리다이렉트
- [ ] URL 파라미터 누락 (placeName 없음) → 홈으로 리다이렉트
- [ ] 공백만 입력 (작성자명) → 에러 메시지
- [ ] 특수문자 입력 (본문) → 정상 저장 (XSS 방지는 서버에서)
- [ ] 네트워크 오류 시 → Toast 에러 표시
- [ ] 제출 버튼 빠르게 2번 클릭 → 중복 제출 방지

---

## 10. 예외 처리

### 10.1 URL 파라미터 오류

**시나리오**: placeId 또는 placeName 파라미터가 없는 경우

**처리**:
```typescript
// src/app/review/create/page.tsx
export default async function ReviewCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const placeId = params.placeId;
  const placeName = params.placeName;

  // 필수 파라미터 검증
  if (!placeId || !placeName) {
    redirect('/');
  }

  // ... 나머지 로직
}
```

### 10.2 API 호출 실패

**시나리오**: POST /api/reviews 호출 실패

**처리**:
```typescript
// src/features/review-create/hooks/use-create-review.ts
export const useCreateReview = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => { ... },
    onError: (error: any) => {
      toast({
        title: '리뷰 작성 실패',
        description: '리뷰 작성에 실패했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
};
```

### 10.3 비밀번호 해싱 실패

**시나리오**: bcrypt 해싱 중 오류 발생

**처리**:
```typescript
// src/features/review-create/backend/service.ts
try {
  const passwordHash = await bcrypt.hash(password, 10);
} catch (error) {
  throw new Error('PASSWORD_HASH_ERROR');
}
```

### 10.4 트랜잭션 실패

**시나리오**: places UPSERT 또는 reviews INSERT 실패

**처리**:
```typescript
// Supabase는 자동 롤백을 지원하지 않으므로 수동 처리
try {
  // places UPSERT
  const { error: placeError } = await supabase.from('places').upsert(...);
  if (placeError) throw placeError;

  // reviews INSERT
  const { data, error: reviewError } = await supabase.from('reviews').insert(...);
  if (reviewError) throw reviewError;

  return data;
} catch (error) {
  // 에러 로깅 및 응답
  logger.error('Transaction failed', error);
  throw new Error('DB_ERROR');
}
```

### 10.5 중복 제출 방지

**시나리오**: 사용자가 제출 버튼을 빠르게 여러 번 클릭

**처리**:
```typescript
// react-hook-form의 isSubmitting 상태 활용
<Button
  type="submit"
  disabled={!isValid || isSubmitting}
>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      작성 중...
    </>
  ) : (
    '리뷰 작성하기'
  )}
</Button>
```

---

## 11. 참고 자료

### 11.1 관련 문서

- [PRD 문서](/docs/prd.md)
- [Userflow 문서](/docs/userflow.md)
- [UC-003 리뷰 작성 유스케이스](/docs/usecases/3-review-create/spec.md)
- [Database 설계 문서](/docs/database.md)
- [공통 모듈 문서](/docs/common-modules.md)

### 11.2 기술 스택 문서

- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [React Query](https://tanstack.com/query/latest)
- [shadcn-ui](https://ui.shadcn.com/)
- [bcrypt.js](https://github.com/kelektiv/node.bcrypt.js)

---

## 12. 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0.0 | 2025-10-21 | 초기 구현 계획 작성 | Development Team |

---

**End of Document**

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

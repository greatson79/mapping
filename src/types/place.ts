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

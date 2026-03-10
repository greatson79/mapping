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

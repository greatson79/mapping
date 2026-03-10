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

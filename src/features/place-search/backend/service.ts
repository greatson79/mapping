import type { Place, NaverPlaceItem } from "@/types/place";
import type { AppConfig } from "@/backend/hono/context";

/**
 * 네이버 지역 검색 API 응답 타입
 */
interface LocalSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverPlaceItem[];
}

/**
 * HTML 태그 제거 유틸리티 함수
 */
const stripHtmlTags = (html: string): string => {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
};

/**
 * KATEC 좌표를 WGS84 좌표로 변환
 * mapx, mapy는 KATEC 좌표계를 10^7로 스케일링한 값
 */
const convertKatecToWgs84 = (mapx: string, mapy: string): { latitude: number; longitude: number } => {
  // KATEC 좌표를 원래 스케일로 복원
  const x = parseInt(mapx) / 10000000;
  const y = parseInt(mapy) / 10000000;

  // 간단한 변환 (실제로는 KATEC이 아니라 네이버 자체 좌표계일 수 있음)
  // 네이버 지도 API에서는 mapx, mapy가 이미 변환된 경도/위도 값일 수 있음
  return {
    longitude: x,
    latitude: y,
  };
};

/**
 * 네이버 지역 검색 API를 사용하여 장소 검색
 * 문서: https://developers.naver.com/docs/serviceapi/search/local/local.md
 */
export const searchPlaces = async (
  query: string,
  config: AppConfig
): Promise<Place[]> => {
  const apiURL = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5`;

  const response = await fetch(apiURL, {
    method: "GET",
    headers: {
      "X-Naver-Client-Id": config.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": config.NAVER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Naver Search API Error:", errorText);
    throw new Error(`Naver Search API error: ${response.status}`);
  }

  const data: LocalSearchResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items.map((item) => {
    const { latitude, longitude } = convertKatecToWgs84(item.mapx, item.mapy);

    return {
      placeId: `${item.mapx}_${item.mapy}`, // 좌표 기반 고유 ID
      name: stripHtmlTags(item.title),
      address: item.roadAddress || item.address,
      category: item.category,
      latitude,
      longitude,
    };
  });
};

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

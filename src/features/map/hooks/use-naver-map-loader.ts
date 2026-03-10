'use client';

import { useState, useEffect } from 'react';
import { waitForNaverMap } from '@/lib/naver/map-loader';

interface UseNaverMapLoaderResult {
  isLoaded: boolean;
  error: Error | null;
}

/**
 * 네이버 지도 SDK 로드 상태를 관리하는 Hook
 */
export function useNaverMapLoader(): UseNaverMapLoaderResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    waitForNaverMap()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

  return { isLoaded, error };
}

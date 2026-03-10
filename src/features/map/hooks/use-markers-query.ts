'use client';

import { useQuery } from '@tanstack/react-query';
import type { MapBounds, MapMarker } from '@/types/map';

interface MarkersResponse {
  markers: MapMarker[];
}

/**
 * 지도 viewport 내 마커 조회 Hook
 */
export function useMarkersQuery(bounds: MapBounds | null) {
  return useQuery({
    queryKey: ['markers', bounds],
    queryFn: async () => {
      if (!bounds) {
        return { markers: [] };
      }

      const params = new URLSearchParams({
        minLat: bounds.minLat.toString(),
        maxLat: bounds.maxLat.toString(),
        minLng: bounds.minLng.toString(),
        maxLng: bounds.maxLng.toString(),
      });

      const response = await fetch(`/api/markers?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch markers');
      }

      const data: MarkersResponse = await response.json();
      return data;
    },
    enabled: bounds !== null,
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });
}

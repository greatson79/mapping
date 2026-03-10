'use client';

import { useMutation } from '@tanstack/react-query';
import type { Place } from '@/types/place';

interface SearchPlacesResponse {
  places: Place[];
}

/**
 * 장소 검색 Hook
 */
export function useSearchPlaces() {
  return useMutation({
    mutationFn: async (query: string) => {
      const params = new URLSearchParams({ query });
      const response = await fetch(`/api/search/local?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to search places');
      }

      const data: SearchPlacesResponse = await response.json();
      return data;
    },
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { PlaceDetail } from '@/types/place';

interface UsePlaceOptions {
  placeId: string;
  enabled?: boolean;
}

export function usePlace({ placeId, enabled = true }: UsePlaceOptions) {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: PlaceDetail;
        message?: string;
      }>(`/api/places/${placeId}`);

      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch place');
      }

      return result.data;
    },
    enabled: enabled && !!placeId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2,
  });
}

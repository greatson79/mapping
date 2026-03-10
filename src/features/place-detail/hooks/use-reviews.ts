'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ReviewListResponse } from '@/types/review';

interface UseReviewsOptions {
  placeId: string;
  enabled?: boolean;
  limit?: number;
}

export function useReviews({
  placeId,
  enabled = true,
  limit = 10,
}: UseReviewsOptions) {
  return useInfiniteQuery({
    queryKey: ['reviews', placeId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.get<{
        success: boolean;
        data: ReviewListResponse;
        message?: string;
      }>('/api/reviews', {
        params: {
          placeId,
          limit: limit.toString(),
          offset: pageParam.toString(),
        },
      });

      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch reviews');
      }

      return result.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * limit;
    },
    enabled: enabled && !!placeId,
    staleTime: 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });
}

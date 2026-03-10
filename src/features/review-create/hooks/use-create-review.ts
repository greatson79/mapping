import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateReviewRequest, CreateReviewResponse } from '../lib/dto';

export const useCreateReview = () => {
  return useMutation({
    mutationFn: async (data: CreateReviewRequest) => {
      const response = await apiClient.post<CreateReviewResponse>(
        '/api/reviews',
        data
      );
      return response.data;
    },
  });
};

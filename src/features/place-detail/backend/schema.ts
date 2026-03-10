import { z } from 'zod';

/**
 * 장소 상세 응답 스키마
 */
export const PlaceDetailResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    placeId: z.string(),
    name: z.string(),
    address: z.string(),
    category: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    reviewCount: z.number(),
    averageRating: z.number(),
  }),
});

/**
 * 리뷰 목록 쿼리 파라미터 스키마
 */
export const ReviewListQuerySchema = z.object({
  placeId: z.string().min(1, 'placeId is required'),
  limit: z.string().optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 10;
    return Math.min(Math.max(num, 1), 50); // 1~50 범위
  }),
  offset: z.string().optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 0;
    return Math.max(num, 0); // 0 이상
  }),
});

export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;

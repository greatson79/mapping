import { z } from 'zod';

// 요청 스키마
export const CreateReviewRequestSchema = z.object({
  placeId: z.string().min(1, '장소 ID는 필수입니다'),
  placeName: z.string().min(1, '장소명은 필수입니다'),
  address: z.string().min(1, '주소는 필수입니다'),
  category: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  authorName: z.string()
    .min(1, '작성자명을 입력해주세요')
    .max(20, '작성자명은 최대 20자까지 입력 가능합니다')
    .refine((val) => val.trim().length > 0, {
      message: '작성자명은 공백만으로 구성될 수 없습니다',
    }),
  rating: z.number()
    .int('평점은 정수여야 합니다')
    .min(1, '평점은 최소 1점입니다')
    .max(5, '평점은 최대 5점입니다'),
  content: z.string()
    .min(10, '리뷰는 최소 10자 이상 작성해주세요')
    .max(500, '리뷰는 최대 500자까지 작성 가능합니다'),
  password: z.string()
    .min(4, '비밀번호는 최소 4자 이상이어야 합니다')
    .max(20, '비밀번호는 최대 20자까지 입력 가능합니다'),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;

// 응답 스키마
export const CreateReviewResponseSchema = z.object({
  reviewId: z.string().uuid(),
  createdAt: z.string(),
});

export type CreateReviewResponse = z.infer<typeof CreateReviewResponseSchema>;

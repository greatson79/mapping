import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { success, failure, respond } from '@/backend/http/response';
import { createReview } from './service';
import { CreateReviewRequestSchema } from './schema';
import { REVIEW_CREATE_ERRORS } from './error';

export const registerReviewCreateRoutes = (app: Hono<AppEnv>) => {
  // 리뷰 작성 API
  app.post('/api/reviews', async (c) => {
    const logger = c.get('logger');
    const supabase = c.get('supabase');

    try {
      // 요청 바디 파싱
      const body = await c.req.json();

      // 요청 데이터 검증
      const validation = CreateReviewRequestSchema.safeParse(body);

      if (!validation.success) {
        logger.info('Validation failed', validation.error.format());
        return respond(
          c,
          failure(
            400,
            REVIEW_CREATE_ERRORS.VALIDATION_ERROR,
            'Invalid request data',
            validation.error.format()
          )
        );
      }

      // 서비스 호출
      const result = await createReview(validation.data, supabase);

      logger.info('Review created successfully', { reviewId: result.reviewId });

      return respond(c, success(result, 201));
    } catch (error) {
      logger.error('Failed to create review', error);

      return respond(
        c,
        failure(
          500,
          REVIEW_CREATE_ERRORS.INTERNAL_ERROR,
          'Failed to create review'
        )
      );
    }
  });
};

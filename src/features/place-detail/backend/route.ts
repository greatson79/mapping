import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getPlaceDetail, getReviews } from './service';
import { ReviewListQuerySchema } from './schema';

export const registerPlaceDetailRoutes = (app: Hono<AppEnv>) => {
  // 장소 정보 조회 API
  app.get('/api/places/:placeId', async (c) => {
    const placeId = c.req.param('placeId');

    if (!placeId) {
      return c.json(
        {
          success: false,
          error: 'INVALID_PLACE_ID',
          message: 'placeId is required',
        },
        400
      );
    }

    try {
      const placeDetail = await getPlaceDetail(placeId, c.get('supabase'));

      if (!placeDetail) {
        return c.json(
          {
            success: false,
            error: 'PLACE_NOT_FOUND',
            message: '장소 정보를 찾을 수 없습니다.',
          },
          404
        );
      }

      return c.json({
        success: true,
        data: placeDetail,
      });
    } catch (error) {
      c.get('logger').error('Place detail fetch failed', error);
      return c.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message: '장소 정보를 불러올 수 없습니다.',
        },
        500
      );
    }
  });

  // 리뷰 목록 조회 API
  app.get('/api/reviews', async (c) => {
    const params = {
      placeId: c.req.query('placeId'),
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
    };

    const validation = ReviewListQuerySchema.safeParse(params);

    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: 'INVALID_PARAMS',
          message: 'Invalid query parameters',
        },
        400
      );
    }

    const { placeId, limit, offset } = validation.data;

    try {
      const result = await getReviews(
        placeId,
        limit,
        offset,
        c.get('supabase')
      );

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      c.get('logger').error('Reviews fetch failed', error);
      return c.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message: '리뷰를 불러올 수 없습니다.',
        },
        500
      );
    }
  });
};

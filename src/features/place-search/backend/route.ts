import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { searchPlaces } from './service';
import { SearchPlacesQuerySchema } from './schema';

export const registerPlaceSearchRoutes = (app: Hono<AppEnv>) => {
  // 장소 검색 API
  app.get('/api/search/local', async (c) => {
    const query = c.req.query('query');

    // 쿼리 파라미터 검증
    const validation = SearchPlacesQuerySchema.safeParse({ query });

    if (!validation.success) {
      return c.json(
        { error: 'Query parameter is required' },
        400
      );
    }

    try {
      const places = await searchPlaces(validation.data.query, c.get('config'));
      return c.json({ places });
    } catch (error) {
      c.get('logger').error('Place search failed', error);
      return c.json(
        { error: 'Failed to search places' },
        500
      );
    }
  });
};

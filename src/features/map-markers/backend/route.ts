import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getMarkersInBounds } from './service';
import { MapBoundsQuerySchema } from './schema';
import type { MapBounds } from '@/types/map';

export const registerMapMarkersRoutes = (app: Hono<AppEnv>) => {
  // 지도 마커 조회 API
  app.get('/api/markers', async (c) => {
    const params = {
      minLat: c.req.query('minLat'),
      maxLat: c.req.query('maxLat'),
      minLng: c.req.query('minLng'),
      maxLng: c.req.query('maxLng'),
    };

    const validation = MapBoundsQuerySchema.safeParse(params);

    if (!validation.success) {
      return c.json(
        { error: 'Invalid query parameters' },
        400
      );
    }

    try {
      const bounds: MapBounds = {
        minLat: validation.data.minLat,
        maxLat: validation.data.maxLat,
        minLng: validation.data.minLng,
        maxLng: validation.data.maxLng,
      };

      const markers = await getMarkersInBounds(
        bounds,
        c.get('supabase')
      );
      return c.json({ markers });
    } catch (error) {
      c.get('logger').error('Markers fetch failed', error);
      return c.json(
        { error: 'Failed to fetch markers' },
        500
      );
    }
  });
};

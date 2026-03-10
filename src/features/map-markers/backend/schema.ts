import { z } from 'zod';

export const MapBoundsQuerySchema = z.object({
  minLat: z.string().transform((val) => parseFloat(val)),
  maxLat: z.string().transform((val) => parseFloat(val)),
  minLng: z.string().transform((val) => parseFloat(val)),
  maxLng: z.string().transform((val) => parseFloat(val)),
});

export type MapBoundsQuery = z.infer<typeof MapBoundsQuerySchema>;

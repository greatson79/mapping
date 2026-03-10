import { z } from 'zod';

export const SearchPlacesQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
});

export type SearchPlacesQuery = z.infer<typeof SearchPlacesQuerySchema>;

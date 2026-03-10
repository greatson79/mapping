import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlaceDetail } from '@/types/place';
import type { Review, ReviewListResponse } from '@/types/review';

/**
 * 장소 정보 및 리뷰 통계 조회
 */
export const getPlaceDetail = async (
  placeId: string,
  supabase: SupabaseClient
): Promise<PlaceDetail | null> => {
  const { data, error } = await supabase
    .rpc('get_place_with_stats', { p_place_id: placeId })
    .single();

  if (error || !data) {
    return null;
  }

  const result = data as any;

  return {
    placeId: result.place_id,
    name: result.name,
    address: result.address,
    category: result.category,
    latitude: parseFloat(result.latitude),
    longitude: parseFloat(result.longitude),
    reviewCount: result.review_count,
    averageRating: parseFloat(result.average_rating),
  };
};

/**
 * 리뷰 목록 조회 (페이지네이션)
 */
export const getReviews = async (
  placeId: string,
  limit: number,
  offset: number,
  supabase: SupabaseClient
): Promise<ReviewListResponse> => {
  // 리뷰 목록 조회
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, author_name, rating, content, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (reviewsError) {
    throw reviewsError;
  }

  // 총 개수 조회
  const { count, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('place_id', placeId);

  if (countError) {
    throw countError;
  }

  const total = count || 0;
  const hasMore = total > offset + limit;

  return {
    reviews: (reviews || []).map((r) => ({
      id: r.id,
      placeId,
      authorName: r.author_name,
      rating: r.rating,
      content: r.content,
      createdAt: r.created_at,
    })),
    total,
    limit,
    offset,
    hasMore,
  };
};

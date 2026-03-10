import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import type { CreateReviewRequest, CreateReviewResponse } from './schema';

const BCRYPT_SALT_ROUNDS = 10;

export const createReview = async (
  data: CreateReviewRequest,
  supabase: SupabaseClient
): Promise<CreateReviewResponse> => {
  try {
    // 1. 비밀번호 bcrypt 해싱
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // 2. places 테이블 UPSERT (ON CONFLICT DO NOTHING)
    const { error: placeError } = await supabase
      .from('places')
      .upsert(
        {
          place_id: data.placeId,
          name: data.placeName,
          address: data.address,
          category: data.category || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
        },
        {
          onConflict: 'place_id',
          ignoreDuplicates: true,
        }
      );

    if (placeError) {
      throw new Error(`Place upsert failed: ${placeError.message}`);
    }

    // 3. reviews 테이블 INSERT
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        place_id: data.placeId,
        author_name: data.authorName,
        rating: data.rating,
        content: data.content,
        password_hash: passwordHash,
      })
      .select('id, created_at')
      .single();

    if (reviewError) {
      throw new Error(`Review insert failed: ${reviewError.message}`);
    }

    if (!reviewData) {
      throw new Error('Review data is null');
    }

    // 4. 응답 반환
    return {
      reviewId: reviewData.id,
      createdAt: reviewData.created_at,
    };
  } catch (error) {
    // 에러 재발생
    throw error;
  }
};

'use client';

import { RatingStars } from '@/components/common/rating-stars';

interface ReviewStatsProps {
  averageRating: number;
  reviewCount: number;
}

export function ReviewStats({ averageRating, reviewCount }: ReviewStatsProps) {
  return (
    <div className="flex items-center gap-4">
      <RatingStars rating={averageRating} size={18} showNumber={true} />
      <span className="text-sm text-muted-foreground">
        {reviewCount}개의 리뷰
      </span>
    </div>
  );
}

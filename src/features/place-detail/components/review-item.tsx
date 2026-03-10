'use client';

import type { Review } from '@/types/review';
import { RatingStars } from '@/components/common/rating-stars';
import { truncateReviewContent } from '@/lib/format/text';
import { formatDate } from '@/lib/format/date';
import { Card } from '@/components/ui/card';

interface ReviewItemProps {
  review: Review;
  onClick: () => void;
}

export function ReviewItem({ review, onClick }: ReviewItemProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-sm">{review.authorName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(review.createdAt)}
          </p>
        </div>
        <RatingStars rating={review.rating} showNumber={false} size={14} />
      </div>
      <p className="text-sm text-foreground">
        {truncateReviewContent(review.content)}
      </p>
    </Card>
  );
}

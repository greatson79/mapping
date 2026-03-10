'use client';

import type { Review } from '@/types/review';
import { RatingStars } from '@/components/common/rating-stars';
import { formatDateLong } from '@/lib/format/date';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReviewDetailModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewDetailModal({
  review,
  isOpen,
  onClose,
}: ReviewDetailModalProps) {
  if (!review) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>리뷰 상세</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{review.authorName}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateLong(review.createdAt)}
              </p>
            </div>
            <RatingStars rating={review.rating} showNumber={true} size={16} />
          </div>
          <div className="border-t pt-4">
            <p className="text-sm whitespace-pre-wrap">{review.content}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

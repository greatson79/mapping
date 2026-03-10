'use client';

import { useReviews } from '@/features/place-detail/hooks/use-reviews';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { ReviewItem } from './review-item';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewListProps {
  placeId: string;
  onReviewClick: (reviewId: string) => void;
}

export function ReviewList({ placeId, onReviewClick }: ReviewListProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useReviews({ placeId });

  const loadMoreRef = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: !!hasNextPage,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size={32} text="리뷰를 불러오는 중..." />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="리뷰를 불러올 수 없습니다"
        description={(error as Error).message}
        action={<Button onClick={() => refetch()}>재시도</Button>}
      />
    );
  }

  const allReviews = data?.pages.flatMap((page) => page.reviews) ?? [];

  if (allReviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="아직 작성된 리뷰가 없습니다"
        description="첫 번째 리뷰를 작성해보세요!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {allReviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          onClick={() => onReviewClick(review.id)}
        />
      ))}

      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && <LoadingSpinner size={24} />}
        {!hasNextPage && allReviews.length > 0 && (
          <p className="text-sm text-muted-foreground">
            모든 리뷰를 확인했습니다
          </p>
        )}
      </div>
    </div>
  );
}

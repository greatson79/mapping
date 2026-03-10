'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlace } from '@/features/place-detail/hooks/use-place';
import { useReviews } from '@/features/place-detail/hooks/use-reviews';
import { PlaceInfoCard } from '@/features/place-detail/components/place-info-card';
import { ReviewStats } from '@/features/place-detail/components/review-stats';
import { WriteReviewButton } from '@/features/place-detail/components/write-review-button';
import { ReviewList } from '@/features/place-detail/components/review-list';
import { ReviewDetailModal } from '@/features/place-detail/components/review-detail-modal';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PlaceDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get('placeId');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const placeQuery = usePlace({
    placeId: placeId || '',
    enabled: !!placeId,
  });

  const reviewsQuery = useReviews({
    placeId: placeId || '',
    enabled: !!placeId && placeQuery.isSuccess,
  });

  const handleReviewClick = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReviewId(null);
  };

  if (!placeId) {
    return (
      <div className="max-w-screen-sm mx-auto min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="잘못된 접근입니다"
          description="장소 정보를 찾을 수 없습니다"
          action={
            <Button onClick={() => router.push('/')}>홈으로 이동</Button>
          }
        />
      </div>
    );
  }

  if (placeQuery.isLoading) {
    return (
      <div className="max-w-screen-sm mx-auto min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size={48} text="장소 정보를 불러오는 중..." />
      </div>
    );
  }

  if (placeQuery.isError) {
    return (
      <div className="max-w-screen-sm mx-auto min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="장소 정보를 불러올 수 없습니다"
          description={
            (placeQuery.error as Error).message || '다시 시도해주세요'
          }
          action={<Button onClick={() => placeQuery.refetch()}>재시도</Button>}
        />
      </div>
    );
  }

  const placeData = placeQuery.data;

  if (!placeData) {
    return (
      <div className="max-w-screen-sm mx-auto min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="장소 정보를 찾을 수 없습니다"
          action={
            <Button onClick={() => router.push('/')}>홈으로 이동</Button>
          }
        />
      </div>
    );
  }

  // Get selected review from reviews query
  const allReviews =
    reviewsQuery.data?.pages.flatMap((page) => page.reviews) ?? [];
  const selectedReview = selectedReviewId
    ? allReviews.find((r) => r.id === selectedReviewId) || null
    : null;

  return (
    <div className="max-w-screen-sm mx-auto min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-2 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold">장소 상세</h1>
        </div>
      </header>

      {/* Place Info */}
      <div className="p-4">
        <PlaceInfoCard place={placeData} />
      </div>

      {/* Review Stats */}
      <div className="px-4 py-2 border-y bg-muted/30">
        <ReviewStats
          averageRating={placeData.averageRating}
          reviewCount={placeData.reviewCount}
        />
      </div>

      {/* Write Review Button */}
      <div className="p-4 border-b">
        <WriteReviewButton placeId={placeId} place={placeData} />
      </div>

      {/* Review List */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">리뷰</h2>
        <ReviewList placeId={placeId} onReviewClick={handleReviewClick} />
      </div>

      {/* Review Detail Modal */}
      <ReviewDetailModal
        review={selectedReview}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

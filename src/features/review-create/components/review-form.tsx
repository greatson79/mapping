'use client';

import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RatingInput } from '@/components/common/rating-input';
import { PlaceInfoCard } from './place-info-card';
import { ReviewSuccessModal } from './review-success-modal';
import { useReviewForm } from '../hooks/use-review-form';
import { useCreateReview } from '../hooks/use-create-review';
import { useToast } from '@/hooks/use-toast';
import type { CreateReviewRequest } from '../lib/dto';

interface ReviewFormProps {
  placeId: string;
  placeName: string;
  address: string;
  category?: string;
  latitude?: number;
  longitude?: number;
}

export function ReviewForm({
  placeId,
  placeName,
  address,
  category,
  latitude,
  longitude,
}: ReviewFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const form = useReviewForm({
    placeId,
    placeName,
    address,
    category,
    latitude,
    longitude,
  });

  const createReviewMutation = useCreateReview();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = form;

  const authorName = watch('authorName');
  const content = watch('content');
  const rating = watch('rating');

  const onSubmit = async (data: CreateReviewRequest) => {
    try {
      await createReviewMutation.mutateAsync(data);
      setShowSuccessModal(true);
    } catch (error) {
      toast({
        title: '리뷰 작성 실패',
        description: '리뷰 작성에 실패했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ChevronLeft size={20} />
          <span>뒤로가기</span>
        </Button>

        <PlaceInfoCard
          placeName={placeName}
          address={address}
          category={category}
        />

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="authorName">
                  작성자명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="authorName"
                  {...register('authorName')}
                  placeholder="이름을 입력하세요"
                  maxLength={20}
                />
                <div className="flex justify-between items-center">
                  <div>
                    {errors.authorName && (
                      <p className="text-sm text-destructive">
                        {errors.authorName.message}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {authorName.length}/20
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  평점 <span className="text-destructive">*</span>
                </Label>
                <RatingInput
                  value={rating}
                  onChange={(value) => setValue('rating', value, { shouldValidate: true })}
                />
                {errors.rating && (
                  <p className="text-sm text-destructive">
                    {errors.rating.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  리뷰 내용 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  {...register('content')}
                  placeholder="리뷰를 작성해주세요 (최소 10자)"
                  rows={5}
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <div>
                    {errors.content && (
                      <p className="text-sm text-destructive">
                        {errors.content.message}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {content.length}/500
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  비밀번호 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="비밀번호를 입력하세요 (4자 이상)"
                  maxLength={20}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  향후 리뷰 수정/삭제 시 사용됩니다
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    작성 중...
                  </>
                ) : (
                  '리뷰 작성하기'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <ReviewSuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
      />
    </>
  );
}

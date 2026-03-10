'use client';

import { useRouter } from 'next/navigation';
import type { PlaceDetail } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface WriteReviewButtonProps {
  placeId: string;
  place: PlaceDetail;
}

export function WriteReviewButton({ placeId, place }: WriteReviewButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams({
      placeId,
      placeName: place.name,
      address: place.address,
      category: place.category || '',
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
    });

    router.push(`/review/create?${params.toString()}`);
  };

  return (
    <Button onClick={handleClick} className="w-full" size="lg">
      <Pencil size={16} className="mr-2" />
      리뷰 작성하기
    </Button>
  );
}

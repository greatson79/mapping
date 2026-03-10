'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Place } from '@/types/place';

interface PlaceCardProps {
  place: Place;
  onReviewCreate?: () => void;
}

export function PlaceCard({ place, onReviewCreate }: PlaceCardProps) {
  const router = useRouter();

  const handleReviewCreate = () => {
    const params = new URLSearchParams({
      placeId: place.placeId,
      placeName: place.name,
      address: place.address,
      category: place.category || '',
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
    });

    router.push(`/review/create?${params.toString()}`);

    if (onReviewCreate) {
      onReviewCreate();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold text-lg mb-2">{place.name}</h3>
        <p className="text-sm text-muted-foreground mb-1">{place.address}</p>
        {place.category && (
          <p className="text-xs text-muted-foreground">{place.category}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleReviewCreate} className="w-full">
          리뷰 작성
        </Button>
      </CardFooter>
    </Card>
  );
}

'use client';

import type { PlaceDetail } from '@/types/place';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface PlaceInfoCardProps {
  place: PlaceDetail;
}

export function PlaceInfoCard({ place }: PlaceInfoCardProps) {
  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-2">{place.name}</h2>
      <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
        <p>{place.address}</p>
      </div>
      {place.category && (
        <Badge variant="secondary" className="mt-2">
          {place.category}
        </Badge>
      )}
    </Card>
  );
}

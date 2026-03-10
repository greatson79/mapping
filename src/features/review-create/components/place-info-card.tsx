'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Tag } from 'lucide-react';

interface PlaceInfoCardProps {
  placeName: string;
  address: string;
  category?: string;
}

export function PlaceInfoCard({
  placeName,
  address,
  category,
}: PlaceInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-3">{placeName}</h2>

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
            <span>{address}</span>
          </div>

          {category && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Tag size={16} className="mt-0.5 flex-shrink-0" />
              <span>{category}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;        // 0.0 ~ 5.0
  size?: number;         // 별 크기 (px)
  showNumber?: boolean;  // 숫자 표시 여부
  className?: string;
}

export function RatingStars({
  rating,
  size = 16,
  showNumber = true,
  className,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* 꽉 찬 별 */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className="fill-yellow-400 text-yellow-400"
        />
      ))}

      {/* 반 별 */}
      {hasHalfStar && (
        <Star
          size={size}
          className="fill-yellow-400 text-yellow-400 opacity-50"
        />
      )}

      {/* 빈 별 */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          className="text-gray-300"
        />
      ))}

      {/* 숫자 표시 */}
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

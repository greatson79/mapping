'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  className?: string;
}

export function RatingInput({
  value,
  onChange,
  size = 32,
  className,
}: RatingInputProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <Star
            size={size}
            className={cn(
              'transition-colors',
              rating <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            )}
          />
        </button>
      ))}
    </div>
  );
}

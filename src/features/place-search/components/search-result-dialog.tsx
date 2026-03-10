'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/empty-state';
import { SearchX } from 'lucide-react';
import { useSearchStore } from '../stores/search-store';
import { PlaceCard } from './place-card';

interface SearchResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchResultDialog({
  open,
  onOpenChange,
}: SearchResultDialogProps) {
  const searchResults = useSearchStore((state) => state.searchResults);
  const clearSearchResults = useSearchStore((state) => state.clearSearchResults);

  const handleClose = () => {
    onOpenChange(false);
    clearSearchResults();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>검색 결과</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {searchResults.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="검색 결과가 없습니다"
              description="다른 검색어로 다시 시도해보세요"
            />
          ) : (
            searchResults.map((place) => (
              <PlaceCard
                key={place.placeId}
                place={place}
                onReviewCreate={handleClose}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

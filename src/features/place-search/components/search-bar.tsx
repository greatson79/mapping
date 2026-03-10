'use client';

import { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSearchPlaces } from '../hooks/use-search-places';
import { useSearchStore } from '../stores/search-store';

interface SearchBarProps {
  onSearchComplete?: () => void;
  className?: string;
}

export function SearchBar({ onSearchComplete, className }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const searchMutation = useSearchPlaces();
  const setSearchResults = useSearchStore((state) => state.setSearchResults);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      toast({
        title: '검색어를 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = await searchMutation.mutateAsync(trimmedQuery);
      setSearchResults(data.places);

      if (data.places.length === 0) {
        toast({
          title: '검색 결과가 없습니다',
        });
      } else if (onSearchComplete) {
        onSearchComplete();
      }
    } catch (error) {
      toast({
        title: '검색 결과를 불러올 수 없습니다',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="장소명을 검색하세요"
          disabled={searchMutation.isPending}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={searchMutation.isPending}
          size="icon"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

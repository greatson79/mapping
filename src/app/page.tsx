'use client';

import { useState } from 'react';
import { NaverMapContainer } from '@/features/map/components/naver-map-container';
import { SearchBar } from '@/features/place-search/components/search-bar';
import { SearchResultDialog } from '@/features/place-search/components/search-result-dialog';

export default function HomePage() {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="p-4 bg-background border-b" style={{ flexShrink: 0 }}>
        <SearchBar onSearchComplete={() => setIsSearchDialogOpen(true)} />
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        <NaverMapContainer />
      </div>
      <SearchResultDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
      />
    </div>
  );
}

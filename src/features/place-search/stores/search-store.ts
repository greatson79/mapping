import { create } from 'zustand';
import type { Place } from '@/types/place';

interface SearchState {
  searchResults: Place[];
  setSearchResults: (results: Place[]) => void;
  clearSearchResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchResults: [],
  setSearchResults: (results: Place[]) => set({ searchResults: results }),
  clearSearchResults: () => set({ searchResults: [] }),
}));

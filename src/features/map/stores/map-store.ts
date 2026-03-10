import { create } from 'zustand';
import type { MapBounds } from '@/types/map';

interface MapState {
  mapBounds: MapBounds | null;
  setMapBounds: (bounds: MapBounds) => void;
  resetMapBounds: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapBounds: null,
  setMapBounds: (bounds: MapBounds) => set({ mapBounds: bounds }),
  resetMapBounds: () => set({ mapBounds: null }),
}));

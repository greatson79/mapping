import type { SupabaseClient } from '@supabase/supabase-js';
import type { MapMarker, MapBounds } from '@/types/map';

export const getMarkersInBounds = async (
  bounds: MapBounds,
  supabase: SupabaseClient
): Promise<MapMarker[]> => {
  const { data, error } = await supabase
    .from('places')
    .select('place_id, latitude, longitude')
    .gte('latitude', bounds.minLat)
    .lte('latitude', bounds.maxLat)
    .gte('longitude', bounds.minLng)
    .lte('longitude', bounds.maxLng)
    .limit(100);

  if (error) {
    throw error;
  }

  return (data || []).map(row => ({
    placeId: row.place_id,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
};

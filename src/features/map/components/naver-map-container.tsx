'use client';

import { useState } from 'react';
import { NaverMap } from './naver-map';
import { MapMarkers } from './map-markers';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Button } from '@/components/ui/button';

export function NaverMapContainer() {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapError, setMapError] = useState<Error | null>(null);

  const handleMapReady = (map: any) => {
    setIsMapLoaded(true);
    setMapInstance(map);
  };

  const handleMapError = (error: Error) => {
    setMapError(error);
  };

  const handleRetry = () => {
    setMapError(null);
    window.location.reload();
  };

  if (mapError) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }}>
        <p className="text-destructive font-semibold">지도를 불러올 수 없습니다</p>
        <p className="text-sm text-muted-foreground text-center">{mapError.message}</p>
        <Button onClick={handleRetry} className="mt-2">재시도</Button>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {!isMapLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
          <LoadingSpinner text="지도 로딩 중..." />
        </div>
      )}
      <NaverMap onMapReady={handleMapReady} onError={handleMapError} />
      {mapInstance && <MapMarkers mapInstance={mapInstance} />}
    </div>
  );
}

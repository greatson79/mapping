'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMapStore } from '../stores/map-store';
import { useMarkersQuery } from '../hooks/use-markers-query';

interface MapMarkersProps {
  mapInstance: any;
}

export function MapMarkers({ mapInstance }: MapMarkersProps) {
  const router = useRouter();
  const mapBounds = useMapStore((state) => state.mapBounds);
  const { data } = useMarkersQuery(mapBounds);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapInstance || !data) return;

    // 기존 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 새 마커 생성
    const markers = data.markers.map((markerData) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          markerData.latitude,
          markerData.longitude
        ),
        map: mapInstance,
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, 'click', () => {
        router.push(`/place/detail?placeId=${markerData.placeId}`);
      });

      return marker;
    });

    markersRef.current = markers;

    // 클린업
    return () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [mapInstance, data, router]);

  return null;
}

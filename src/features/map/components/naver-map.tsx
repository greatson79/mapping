"use client";

import { useRef, useEffect, useState } from "react";
import { useMapStore } from "../stores/map-store";
import { useDebounce } from "@/hooks/use-debounce";
import type { MapBounds } from "@/types/map";

interface NaverMapProps {
  onMapReady?: (map: any) => void;
  onError?: (error: Error) => void;
}

const NAVER_MAP_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "";
const NAVER_MAP_URL = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`;

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 17;

export function NaverMap({ onMapReady, onError }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const onMapReadyRef = useRef(onMapReady);
  const onErrorRef = useRef(onError);
  onMapReadyRef.current = onMapReady;
  onErrorRef.current = onError;

  const setMapBounds = useMapStore((state) => state.setMapBounds);
  const [tempBounds, setTempBounds] = useState<MapBounds | null>(null);
  const debouncedBounds = useDebounce<MapBounds | null>(tempBounds, 500);

  useEffect(() => {
    if (debouncedBounds) {
      setMapBounds(debouncedBounds);
    }
  }, [debouncedBounds, setMapBounds]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    const updateBounds = (map: any) => {
      const bounds = map.getBounds();
      const sw = bounds.getSW();
      const ne = bounds.getNE();
      setTempBounds({
        minLat: sw.lat(),
        maxLat: ne.lat(),
        minLng: sw.lng(),
        maxLng: ne.lng(),
      });
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      if (!(window as any).naver?.maps) return;

      try {
        const naver = (window as any).naver;
        const map = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT,
          },
        });

        mapInstanceRef.current = map;
        updateBounds(map);

        naver.maps.Event.addListener(map, "idle", () => {
          updateBounds(map);
        });

        onMapReadyRef.current?.(map);
      } catch (e) {
        onErrorRef.current?.(e instanceof Error ? e : new Error(String(e)));
      }
    };

    const waitAndInit = () => {
      // 이미 로드된 경우 즉시 초기화
      if ((window as any).naver?.maps) {
        initializeMap();
        return;
      }

      // 10초 타임아웃
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        onErrorRef.current?.(new Error("네이버 지도 SDK 로드 타임아웃"));
      }, 10000);

      // 100ms마다 로드 여부 확인
      intervalId = setInterval(() => {
        if ((window as any).naver?.maps) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          initializeMap();
        }
      }, 100);
    };

    // 스크립트가 이미 DOM에 있는지 확인
    const existingScript = document.querySelector(`script[src*="oapi.map.naver.com"]`);
    if (existingScript) {
      waitAndInit();
    } else {
      const script = document.createElement("script");
      script.src = NAVER_MAP_URL;
      script.async = true;
      script.onload = waitAndInit;
      script.onerror = () => {
        onErrorRef.current?.(new Error("네이버 지도 스크립트 로드 실패 (API 키 또는 네트워크 확인)"));
      };
      document.head.appendChild(script);
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  return <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />;
}

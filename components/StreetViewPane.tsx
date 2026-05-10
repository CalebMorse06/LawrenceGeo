"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: typeof google;
    __gmapsLoaderPromise?: Promise<void>;
  }
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__gmapsLoaderPromise) return window.__gmapsLoaderPromise;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing"));
  window.__gmapsLoaderPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__gmapsLoaderPromise;
}

interface Props {
  panoId: string;
}

export default function StreetViewPane({ panoId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        new window.google.maps.StreetViewPanorama(containerRef.current, {
          pano: panoId,
          addressControl: false,
          linksControl: false,
          panControl: false,
          zoomControl: false,
          fullscreenControl: false,
          showRoadLabels: false,
          clickToGo: false,
          disableDefaultUI: true,
        });
      })
      .catch((err) => {
        if (containerRef.current) containerRef.current.innerText = (err as Error).message;
      });
    return () => {
      cancelled = true;
    };
  }, [panoId]);

  return <div ref={containerRef} className="h-full w-full bg-zinc-900" />;
}

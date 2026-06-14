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
  panoId?: string | null;
  lat?: number;
  lng?: number;
  heading?: number;
  pitch?: number;
}

function getPanorama(
  svc: google.maps.StreetViewService,
  request: google.maps.StreetViewLocationRequest | google.maps.StreetViewPanoRequest,
): Promise<string | null> {
  return new Promise((resolve) => {
    svc.getPanorama(request, (data, status) => {
      if (status === window.google!.maps.StreetViewStatus.OK && data?.location?.pano) {
        resolve(data.location.pano);
      } else {
        resolve(null);
      }
    });
  });
}

// Resolve a usable pano id, escalating outward so a round never ends up blank:
// a stale hardcoded pano falls back to coordinates, and the coordinate search
// widens its radius and finally drops the outdoor-only constraint before
// giving up. The OUTDOOR source is preferred first so players don't spawn
// inside a business.
async function resolvePano(
  panoId: string | null | undefined,
  lat: number | undefined,
  lng: number | undefined,
): Promise<string | null> {
  const svc = new window.google!.maps.StreetViewService();
  if (panoId) {
    const direct = await getPanorama(svc, { pano: panoId });
    if (direct) return direct;
  }
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const { OUTDOOR, DEFAULT } = window.google!.maps.StreetViewSource;
  const attempts: google.maps.StreetViewLocationRequest[] = [
    { location: { lat, lng }, radius: 150, source: OUTDOOR },
    { location: { lat, lng }, radius: 400, source: OUTDOOR },
    { location: { lat, lng }, radius: 1000, source: DEFAULT },
  ];
  for (const attempt of attempts) {
    const found = await getPanorama(svc, attempt);
    if (found) return found;
  }
  return null;
}

export default function StreetViewPane({ panoId, lat, lng, heading, pitch }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => resolvePano(panoId, lat, lng))
      .then((pano) => {
        if (cancelled || !containerRef.current || !window.google) return;
        if (!pano) {
          containerRef.current.innerText = "No Street View imagery near this point.";
          return;
        }
        new window.google.maps.StreetViewPanorama(containerRef.current, {
          pano,
          addressControl: false,
          linksControl: false,
          panControl: false,
          zoomControl: false,
          fullscreenControl: false,
          showRoadLabels: false,
          clickToGo: false,
          disableDefaultUI: true,
          motionTracking: false,
          motionTrackingControl: false,
          pov: { heading: heading ?? 0, pitch: pitch ?? 0 },
        });
      })
      .catch((err) => {
        if (containerRef.current) containerRef.current.innerText = (err as Error).message;
      });
    return () => {
      cancelled = true;
    };
  }, [panoId, lat, lng, heading, pitch]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-stone-900"
      style={{ touchAction: "none" }}
    />
  );
}

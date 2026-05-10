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

export default function StreetViewPane({ panoId, lat, lng, heading, pitch }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        const sharedOptions: google.maps.StreetViewPanoramaOptions = {
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
        };

        if (panoId) {
          new window.google.maps.StreetViewPanorama(containerRef.current, {
            ...sharedOptions,
            pano: panoId,
          });
          return;
        }

        if (typeof lat !== "number" || typeof lng !== "number") {
          if (containerRef.current) {
            containerRef.current.innerText = "No pano id or coordinates provided.";
          }
          return;
        }

        const svc = new window.google.maps.StreetViewService();
        svc.getPanorama(
          { location: { lat, lng }, radius: 150, source: window.google.maps.StreetViewSource.OUTDOOR },
          (data, status) => {
            if (cancelled || !containerRef.current || !window.google) return;
            if (status !== window.google.maps.StreetViewStatus.OK || !data) {
              containerRef.current.innerText = "No Street View imagery near this point.";
              return;
            }
            new window.google.maps.StreetViewPanorama(containerRef.current, {
              ...sharedOptions,
              pano: data.location?.pano ?? undefined,
            });
          },
        );
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

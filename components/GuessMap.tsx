"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LAWRENCE_CENTER, type LatLng } from "@/lib/scoring";

const LAWRENCE_BOUNDS: [[number, number], [number, number]] = [
  [-95.34, 38.91],
  [-95.13, 39.03],
];

interface Props {
  guess: LatLng | null;
  actual?: LatLng | null;
  onGuess: (p: LatLng) => void;
  locked?: boolean;
}

export default function GuessMap({ guess, actual, onGuess, locked }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const guessMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const actualMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const onGuessRef = useRef(onGuess);
  onGuessRef.current = onGuess;

  useEffect(() => {
    if (!containerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      containerRef.current.innerText = "Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local";
      return;
    }
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [LAWRENCE_CENTER.lng, LAWRENCE_CENTER.lat],
      zoom: 12.5,
      maxBounds: LAWRENCE_BOUNDS,
    });
    map.on("click", (e) => {
      if (locked) return;
      onGuessRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!guess) {
      guessMarkerRef.current?.remove();
      guessMarkerRef.current = null;
      return;
    }
    if (!guessMarkerRef.current) {
      guessMarkerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([guess.lng, guess.lat])
        .addTo(map);
    } else {
      guessMarkerRef.current.setLngLat([guess.lng, guess.lat]);
    }
  }, [guess]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!actual) {
      actualMarkerRef.current?.remove();
      actualMarkerRef.current = null;
      return;
    }
    if (!actualMarkerRef.current) {
      actualMarkerRef.current = new mapboxgl.Marker({ color: "#dc2626" })
        .setLngLat([actual.lng, actual.lat])
        .addTo(map);
    } else {
      actualMarkerRef.current.setLngLat([actual.lng, actual.lat]);
    }
    if (guess) {
      map.fitBounds(
        [
          [Math.min(guess.lng, actual.lng), Math.min(guess.lat, actual.lat)],
          [Math.max(guess.lng, actual.lng), Math.max(guess.lat, actual.lat)],
        ],
        { padding: 80, duration: 600 },
      );
    }
  }, [actual, guess]);

  return <div ref={containerRef} className="h-full w-full rounded-lg overflow-hidden" />;
}

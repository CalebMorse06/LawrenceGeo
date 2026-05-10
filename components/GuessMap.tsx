"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LAWRENCE_CENTER, type LatLng } from "@/lib/scoring";

const LAWRENCE_BOUNDS: [[number, number], [number, number]] = [
  [-95.34, 38.91],
  [-95.13, 39.03],
];

const LINE_SOURCE_ID = "guess-actual-line";
const LINE_LAYER_ID = "guess-actual-line-layer";

// Visual orientation anchors so first-time players can place themselves on
// the map. A loose KU campus polygon in crimson, Mass St traced in jayhawk
// blue. Broad enough not to leak specific answers.
function addLawrenceAnchors(map: mapboxgl.Map) {
  map.addSource("ku-campus", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-95.257, 38.9645],
            [-95.24, 38.9645],
            [-95.24, 38.961],
            [-95.241, 38.9595],
            [-95.241, 38.953],
            [-95.247, 38.9525],
            [-95.254, 38.9525],
            [-95.258, 38.9555],
            [-95.258, 38.961],
            [-95.257, 38.9645],
          ],
        ],
      },
    },
  });
  map.addLayer({
    id: "ku-campus-fill",
    type: "fill",
    source: "ku-campus",
    paint: { "fill-color": "#E8000D", "fill-opacity": 0.1 },
  });
  map.addLayer({
    id: "ku-campus-outline",
    type: "line",
    source: "ku-campus",
    paint: { "line-color": "#A4123F", "line-width": 1.5, "line-opacity": 0.55 },
  });
  map.addLayer({
    id: "ku-campus-label",
    type: "symbol",
    source: "ku-campus",
    layout: {
      "symbol-placement": "point",
      "text-field": "KU",
      "text-size": 14,
      "text-letter-spacing": 0.2,
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
    },
    paint: {
      "text-color": "#A4123F",
      "text-halo-color": "#FAF6EC",
      "text-halo-width": 1.5,
    },
  });

  map.addSource("mass-st", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [-95.2353, 38.9685],
          [-95.2353, 38.9785],
        ],
      },
    },
  });
  map.addLayer({
    id: "mass-st-line",
    type: "line",
    source: "mass-st",
    paint: { "line-color": "#0051BA", "line-width": 3, "line-opacity": 0.55 },
  });
}

interface Props {
  guess: LatLng | null;
  actual?: LatLng | null;
  onGuess: (p: LatLng) => void;
  locked?: boolean;
}

export default function GuessMap({ guess, actual, onGuess, locked }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const styleLoadedRef = useRef(false);
  const guessMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const actualMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const onGuessRef = useRef(onGuess);
  const lockedRef = useRef(locked);
  onGuessRef.current = onGuess;
  lockedRef.current = locked;

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
      style: "mapbox://styles/mapbox/light-v11",
      center: [LAWRENCE_CENTER.lng, LAWRENCE_CENTER.lat],
      zoom: 12.5,
      maxBounds: LAWRENCE_BOUNDS,
    });
    map.on("load", () => {
      styleLoadedRef.current = true;
      addLawrenceAnchors(map);
    });
    map.on("click", (e) => {
      if (lockedRef.current) return;
      onGuessRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    mapRef.current = map;

    // Mapbox measures container size at construction; track resizes so it
    // follows the parent when the corner-pill expands.
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
  }, []);

  // guess marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!guess) {
      guessMarkerRef.current?.remove();
      guessMarkerRef.current = null;
      return;
    }
    if (!guessMarkerRef.current) {
      guessMarkerRef.current = new mapboxgl.Marker({ color: "#0051BA" })
        .setLngLat([guess.lng, guess.lat])
        .addTo(map);
    } else {
      guessMarkerRef.current.setLngLat([guess.lng, guess.lat]);
    }
  }, [guess]);

  // actual marker + line + fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const removeLine = () => {
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
      if (map.getSource(LINE_SOURCE_ID)) map.removeSource(LINE_SOURCE_ID);
    };
    if (!actual) {
      actualMarkerRef.current?.remove();
      actualMarkerRef.current = null;
      if (styleLoadedRef.current) removeLine();
      return;
    }
    if (!actualMarkerRef.current) {
      actualMarkerRef.current = new mapboxgl.Marker({ color: "#E8000D" })
        .setLngLat([actual.lng, actual.lat])
        .addTo(map);
    } else {
      actualMarkerRef.current.setLngLat([actual.lng, actual.lat]);
    }
    if (guess && styleLoadedRef.current) {
      removeLine();
      map.addSource(LINE_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [guess.lng, guess.lat],
              [actual.lng, actual.lat],
            ],
          },
        },
      });
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: LINE_SOURCE_ID,
        paint: {
          "line-color": "#1A1814",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });
      map.fitBounds(
        [
          [Math.min(guess.lng, actual.lng), Math.min(guess.lat, actual.lat)],
          [Math.max(guess.lng, actual.lng), Math.max(guess.lat, actual.lat)],
        ],
        { padding: 80, duration: 700 },
      );
    }
  }, [actual, guess]);

  return <div ref={containerRef} className="h-full w-full" />;
}

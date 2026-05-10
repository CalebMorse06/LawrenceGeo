"use client";

import { useEffect, useRef } from "react";

const PANNELLUM_JS = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
const PANNELLUM_CSS = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";

interface PannellumViewer {
  destroy?: () => void;
}
interface PannellumGlobal {
  viewer: (el: HTMLElement, cfg: Record<string, unknown>) => PannellumViewer;
}

declare global {
  interface Window {
    pannellum?: PannellumGlobal;
    __pannellumLoader?: Promise<void>;
  }
}

function loadPannellum(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.pannellum) return Promise.resolve();
  if (window.__pannellumLoader) return window.__pannellumLoader;
  window.__pannellumLoader = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${PANNELLUM_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = PANNELLUM_CSS;
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src = PANNELLUM_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load pannellum"));
    document.head.appendChild(s);
  });
  return window.__pannellumLoader;
}

interface Props {
  panoramaUrl: string;
}

export default function Pano360Pane({ panoramaUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: PannellumViewer | null = null;
    let cancelled = false;
    loadPannellum()
      .then(() => {
        if (cancelled || !containerRef.current || !window.pannellum) return;
        viewer = window.pannellum.viewer(containerRef.current, {
          type: "equirectangular",
          panorama: panoramaUrl,
          autoLoad: true,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          showControls: false,
          hfov: 100,
        });
      })
      .catch((err) => {
        if (containerRef.current) containerRef.current.innerText = (err as Error).message;
      });
    return () => {
      cancelled = true;
      viewer?.destroy?.();
    };
  }, [panoramaUrl]);

  return <div ref={containerRef} className="h-full w-full bg-zinc-900" />;
}

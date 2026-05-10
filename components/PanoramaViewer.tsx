"use client";

import type { GameLocation } from "@/lib/types";
import StreetViewPane from "./StreetViewPane";
import Pano360Pane from "./Pano360Pane";
import PhotoCarousel from "./PhotoCarousel";

interface Props {
  location: GameLocation;
  storageBaseUrl?: string;
}

function buildStorageUrl(base: string | undefined, path: string): string {
  if (!base) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export default function PanoramaViewer({ location, storageBaseUrl }: Props) {
  if (location.type === "streetview" && location.streetviewPanoId) {
    return <StreetViewPane panoId={location.streetviewPanoId} />;
  }
  if (location.type === "pano360" && location.panoStoragePath) {
    return <Pano360Pane panoramaUrl={buildStorageUrl(storageBaseUrl, location.panoStoragePath)} />;
  }
  if (location.type === "photos" && location.photoStoragePaths) {
    return (
      <PhotoCarousel
        photoUrls={location.photoStoragePaths.map((p) => buildStorageUrl(storageBaseUrl, p))}
      />
    );
  }
  return (
    <div className="flex h-full items-center justify-center text-zinc-400">
      No viewer available for this location.
    </div>
  );
}

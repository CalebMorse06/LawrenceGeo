"use client";

import { useState } from "react";

interface Props {
  photoUrls: string[];
}

export default function PhotoCarousel({ photoUrls }: Props) {
  const [index, setIndex] = useState(0);
  const total = photoUrls.length;
  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <div className="relative h-full w-full bg-dusk">
      {photoUrls.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrls[index]}
          alt={`view ${index + 1} of ${total}`}
          className="h-full w-full object-contain"
        />
      )}
      {total > 1 && (
        <>
          <button
            aria-label="Previous photo"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-ink/70 px-3 py-2 text-lg text-paper backdrop-blur"
          >
            ‹
          </button>
          <button
            aria-label="Next photo"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ink/70 px-3 py-2 text-lg text-paper backdrop-blur"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-xs font-mono text-paper backdrop-blur">
            {index + 1} / {total}
          </div>
        </>
      )}
    </div>
  );
}

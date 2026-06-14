import { ImageResponse } from "next/og";

// Branded social-share card. Rendered at build/request time by next/og, so
// links to the site get a proper preview on iMessage, Facebook, X, etc.
export const alt = "Lawrence Geo — guess your way around Lawrence, KS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#faf6ec";
const INK = "#1a1814";
const INK_SOFT = "#3a342b";
const CRIMSON = "#e8000d";
const JAYHAWK = "#0051ba";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 28,
              height: 28,
              borderRadius: 999,
              background: CRIMSON,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: INK_SOFT,
            }}
          >
            Lawrence, KS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 700, lineHeight: 1 }}>
            Lawrence
            <span style={{ color: CRIMSON }}>&nbsp;Geo</span>
          </div>
          <div style={{ display: "flex", fontSize: 46, color: INK_SOFT, marginTop: 16 }}>
            Five rounds. How well do you really know your town?
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 30, color: JAYHAWK, fontWeight: 700 }}>
            lawrence-geo.vercel.app
          </div>
          <div style={{ display: "flex", fontSize: 28, color: INK_SOFT }}>
            a guess-the-place game
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

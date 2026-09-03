import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get("title") ?? `${siteConfig.name} — Travel Guides & Smart Recommendations`;
  const title = rawTitle.slice(0, 110);
  const tagline = searchParams.get("type") ?? siteConfig.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        {/* decorative accent */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(255,45,120,0.30)",
          }}
        />

        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#6d28d9",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            ▲
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#ffffff",
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        {/* title */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            fontSize: 68,
            lineHeight: 1.12,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 40,
            maxWidth: 980,
          }}
        >
          {title}
        </div>

        {/* footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 26,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <span>{tagline}</span>
          <span>{siteConfig.url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
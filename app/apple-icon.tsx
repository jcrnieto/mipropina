import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #1d4ed8 0%, #2563eb 45%, #0f766e 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 112,
            width: 112,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.16)",
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -3,
          }}
        >
          MP
        </div>
      </div>
    ),
    size,
  );
}

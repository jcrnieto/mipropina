import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
            height: 320,
            width: 320,
            borderRadius: 72,
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.16)",
            boxShadow: "0 24px 80px rgba(15, 23, 42, 0.26)",
            fontSize: 126,
            fontWeight: 800,
            letterSpacing: -8,
          }}
        >
          MP
        </div>
      </div>
    ),
    size,
  );
}

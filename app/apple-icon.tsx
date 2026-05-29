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
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.satixapp.com"}/isologo-satix.png`}
          alt="Satix"
          style={{
            width: 126,
            height: 126,
            objectFit: "contain",
          }}
        />
      </div>
    ),
    size,
  );
}

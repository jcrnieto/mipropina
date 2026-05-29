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
          background: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.satixapp.com"}/isologo-satix.png`}
          alt="Satix"
          style={{
            width: 360,
            height: 360,
            objectFit: "contain",
          }}
        />
      </div>
    ),
    size,
  );
}

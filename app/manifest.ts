import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Satix",
    short_name: "Satix",
    description:
      "Panel para dueños de restaurantes con control de reseñas internas, propinas y métricas.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8fc",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

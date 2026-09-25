import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zain Traders",
    short_name: "Zain Traders",
    description: "Wholesale spices and dry fruits for retailers, dealers, hotels, resellers, and bulk buyers across Maharashtra.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F4E9",
    theme_color: "#0F3D2E",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

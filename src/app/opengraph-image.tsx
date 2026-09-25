import { ImageResponse } from "next/og";
import { businessInfo } from "@/lib/site-data";

export const alt = `${businessInfo.displayName} premium wholesale spices and dry fruits`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#F8F4E9",
          backgroundImage:
            "radial-gradient(circle at top left, rgba(212,175,55,0.3), transparent 34%), radial-gradient(circle at bottom right, rgba(15,61,46,0.22), transparent 36%)",
          color: "#1C1C1C",
          padding: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            borderRadius: 36,
            border: "14px solid #0F3D2E",
            padding: "54px 56px",
            justifyContent: "space-between",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: 9999,
                background: "#0F3D2E",
                color: "#F8F4E9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              ZT
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 20,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  color: "#D4AF37",
                }}
              >
                Premium Trade Supply
              </div>
              <div style={{ marginTop: 8, fontSize: 44, fontWeight: 700 }}>
                {businessInfo.displayName}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
            <div style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700 }}>
              Wholesale spices and dry fruits, chosen for trade
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.5, color: "#36594D" }}>
              Dharashiv • Solapur • Sambhajinagar
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 22,
              color: "#36594D",
            }}
          >
            <div>Head Office: Kondhwa, Pune • Branch: Paranda, Dharashiv</div>
            <div style={{ color: "#0F3D2E", fontWeight: 700 }}>WhatsApp Enquiry</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

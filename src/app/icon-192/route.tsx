import { ImageResponse } from "next/og";

/** Temporary placeholder (initials on neutral background). Replaced automatically once a logo is uploaded. */
export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#16150f", color: "#f6f4ef", fontSize: 192 * 0.4, fontWeight: 700 }}>
        SC
      </div>
    ),
    { width: 192, height: 192 },
  );
}

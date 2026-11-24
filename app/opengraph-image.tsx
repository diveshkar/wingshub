import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { getRestaurant } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** Reads a /public image into a data URI once, at build time. Remote URLs are skipped. */
async function publicImageAsDataUri(src: string | undefined): Promise<string | null> {
  if (!src || src.startsWith("http")) return null;
  const mime = MIME[extname(src).toLowerCase()];
  if (!mime) return null;
  const bytes = await readFile(join(process.cwd(), "public", src));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const restaurant = await getRestaurant();
const logoImage = restaurant.logoOnDark ?? restaurant.logo;

const [displayFont, logoUri, photoUri] = await Promise.all([
  readFile(
    join(
      process.cwd(),
      "node_modules/@fontsource/archivo/files/archivo-latin-800-normal.woff",
    ),
  ),
  publicImageAsDataUri(logoImage?.src),
  publicImageAsDataUri(restaurant.media.hero?.src),
]);

/** Branded 1200x630 share card: logo, tagline and the hero photo, all taken from the data files. */
export default function OpengraphImage() {
  const lines = restaurant.tagline.split(/(?<=\.)\s+/);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          color: "#fffcf7",
          backgroundColor: "#0d0d0e",
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(248,0,8,0.38), rgba(13,13,14,0) 55%), radial-gradient(circle at 0% 100%, rgba(247,183,49,0.14), rgba(13,13,14,0) 50%)",
          fontFamily: "Archivo",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "64px 56px 64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {logoUri && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUri} width={118} height={112} alt="" />
            )}
            <div style={{ display: "flex", fontSize: 50, fontWeight: 800, letterSpacing: -1.5 }}>
              {restaurant.name}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.02,
              textTransform: "uppercase",
              letterSpacing: -1,
            }}
          >
            {lines.map((line, index) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  color: index === lines.length - 1 ? "#ff4d52" : "#fffcf7",
                }}
              >
                {line}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", fontSize: 30, color: "#bcbcc2" }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>

        {photoUri && (
          <div style={{ display: "flex", width: 460, height: "100%" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUri}
              width={460}
              height={630}
              alt=""
              style={{ width: 460, height: 630, objectFit: "cover" }}
            />
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Archivo", data: displayFont, style: "normal", weight: 800 }],
    },
  );
}

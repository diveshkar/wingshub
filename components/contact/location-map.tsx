import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatAddressOneLine, hasAddress } from "@/lib/utils/format";
import type { Location } from "@/types";

type LocationMapProps = {
  location: Location;
  /** Sets the size, for example an aspect ratio or minimum height. */
  className?: string;
};

/**
 * Embeds Google Maps (no API key needed) once an address exists. Until then it shows a
 * neutral placeholder so no third-party request is made for an unknown location.
 */
export function LocationMap({ location, className }: LocationMapProps) {
  // No min-height here: combined with an aspect ratio it widens the box past a narrow screen.
  const frame = cn("relative w-full overflow-hidden rounded-xl bg-ink-800", className);

  if (!hasAddress(location.address)) {
    return (
      <div className={cn(frame, "grid min-h-64 place-items-center p-8 text-center text-ink-300")}>
        <div>
          <MapPin aria-hidden="true" className="mx-auto size-8" strokeWidth={1.5} />
          <p className="mt-3 font-display text-lg font-bold">Map coming soon</p>
          <p className="mt-1 font-serif">The map will appear here once our address is confirmed.</p>
        </div>
      </div>
    );
  }

  const address = formatAddressOneLine(location.address);
  const query = location.geo ? `${location.geo.latitude},${location.geo.longitude}` : address;

  return (
    <div className={frame}>
      <iframe
        title={`Map showing ${location.name} at ${address}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full border-0"
      />
    </div>
  );
}

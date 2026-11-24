import { OpeningHours } from "@/components/ui/opening-hours";
import { getContact, getOpeningHours, getPrimaryLocation, getRestaurant } from "@/lib/data";
import { cn } from "@/lib/utils/cn";
import { formatAddressLines, formatPhone, getDirectionsUrl, hasAddress } from "@/lib/utils/format";

type VisitDetailsProps = {
  /** "dark" is for dark sections. */
  tone?: "light" | "dark";
  className?: string;
};

/** Address, opening hours and contact details as plain labelled blocks. Shared by home, about and contact. */
export async function VisitDetails({ tone = "light", className }: VisitDetailsProps) {
  const [location, hours, contact, restaurant] = await Promise.all([
    getPrimaryLocation(),
    getOpeningHours(),
    getContact(),
    getRestaurant(),
  ]);

  const dark = tone === "dark";
  const addressLines = hasAddress(location.address) ? formatAddressLines(location.address) : null;
  const directions = getDirectionsUrl(location);

  const label = cn(
    "font-display text-xs font-bold uppercase tracking-[0.14em]",
    dark ? "text-flame-400" : "text-ember-600",
  );
  const link = "underline decoration-1 underline-offset-4 hover:decoration-2";
  const muted = dark ? "text-ink-300" : "text-ink-500";

  return (
    <div className={cn("grid gap-8", className)}>
      <section>
        <h3 className={label}>Address</h3>
        <div className="mt-2 font-serif text-lg leading-relaxed">
          {addressLines ? (
            <>
              <address className="not-italic">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(link, "mt-2 inline-block font-sans text-sm font-semibold")}
                >
                  Get directions
                </a>
              )}
            </>
          ) : (
            <p className={muted}>Our address will be announced soon.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className={label}>Opening hours</h3>
        <OpeningHours
          rows={hours}
          className={cn("mt-2", muted)}
          emptyClassName="font-serif text-lg leading-relaxed"
        />
      </section>

      <section>
        <h3 className={label}>Contact</h3>
        <ul className="mt-2 font-serif text-lg">
          <li>
            <a href={`mailto:${contact.email}`} className={link}>
              {contact.email}
            </a>
          </li>
          {contact.phone && (
            <li>
              <a href={`tel:${contact.phone}`} className={link}>
                {formatPhone(contact.phone)}
              </a>
            </li>
          )}
        </ul>
      </section>

      {restaurant.onlineOrdering.length > 0 && (
        <section>
          <h3 className={label}>Order online</h3>
          <ul className="mt-2 font-serif text-lg">
            {restaurant.onlineOrdering.map((service) => (
              <li key={service.name}>
                {service.url ? (
                  <a href={service.url} target="_blank" rel="noopener noreferrer" className={link}>
                    {service.name}
                  </a>
                ) : (
                  service.name
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

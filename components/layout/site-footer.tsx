import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { OpeningHours } from "@/components/ui/opening-hours";
import { SOCIAL_LABELS, SocialIcon } from "@/components/ui/social-icon";
import { siteConfig } from "@/config/site";
import {
  getContact,
  getNavigation,
  getOpeningHours,
  getPrimaryLocation,
  getRestaurant,
} from "@/lib/data";
import { formatAddressLines, formatPhone, hasAddress } from "@/lib/utils/format";

const label = "mb-4 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-400";
const footerLink =
  "inline-block py-1 text-ink-300 underline-offset-4 transition-colors hover:text-bone-50 hover:underline";

export async function SiteFooter() {
  const [restaurant, contact, navigation, location, hours] = await Promise.all([
    getRestaurant(),
    getContact(),
    getNavigation(),
    getPrimaryLocation(),
    getOpeningHours(),
  ]);

  const addressLines = hasAddress(location.address) ? formatAddressLines(location.address) : null;
  const { explore, legal } = navigation.footer;

  return (
    <footer className="relative isolate overflow-hidden bg-ink-950 text-bone-50">
      {/* The name sits behind the footer content, flush with the bottom edge, so it adds no height.
          It is decorative (hidden from screen readers), sized from the container width so it always
          fits, and the bottom of the letters is cropped on purpose. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 select-none">
        <Container className="@container flow-root">
          <p className="-mb-[0.16em] whitespace-nowrap text-center font-display text-[20.3cqw] font-extrabold leading-[0.8] tracking-[-0.05em] text-bone-50/[0.06]">
            {restaurant.name}
          </p>
        </Container>
      </div>

      <Container className="py-14 md:py-16">
        {/* From lg up each column is only as wide as its content, so nothing wraps, and the four
            columns are spread evenly from the left edge to the right edge of the container. */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[repeat(4,auto)] lg:justify-between lg:gap-x-8">
          <div>
            <Link href="/" className="inline-block">
              <Logo name={restaurant.name} image={restaurant.logoOnDark ?? restaurant.logo} className="w-20" />
            </Link>
            <p className="mt-5 max-w-xs font-serif text-[0.9375rem] leading-relaxed text-ink-300">
              {restaurant.shortDescription}
            </p>

            {restaurant.social.length > 0 && (
              <ul className="mt-5 flex gap-2" aria-label="Social media">
                {restaurant.social.map((link) => (
                  <li key={link.platform}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${restaurant.name} on ${SOCIAL_LABELS[link.platform]}`}
                      className="grid size-11 place-items-center rounded-md border border-bone-50/25 text-bone-50 transition-colors hover:border-flame-500 hover:bg-flame-500"
                    >
                      <SocialIcon platform={link.platform} className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className={label}>Visit</h2>
            {addressLines ? (
              <address className="mb-4 py-1 not-italic leading-relaxed text-ink-300">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : (
              <p className="mb-4 py-1 text-ink-300">Our address will be announced soon.</p>
            )}
            <OpeningHours rows={hours} className="text-ink-300" />
          </div>

          <nav aria-label="Footer">
            <h2 className={label}>Explore</h2>
            <ul>
              {explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={label}>Contact</h2>
            <ul>
              <li>
                <a href={`mailto:${contact.email}`} className={footerLink}>
                  {contact.email}
                </a>
              </li>
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone}`} className={footerLink}>
                    {formatPhone(contact.phone)}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-bone-50/10 pt-6 text-sm text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {siteConfig.copyrightYear} {restaurant.legalName ?? restaurant.name}. All rights reserved.
          </p>
          {legal.length > 0 && (
            <ul className="flex flex-wrap gap-x-6">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </footer>
  );
}

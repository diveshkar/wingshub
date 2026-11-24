import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { getContact, getNavigation, getPrimaryLocation, getRestaurant } from "@/lib/data";
import { formatAddressLines, hasAddress } from "@/lib/utils/format";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export async function SiteHeader() {
  const [navigation, restaurant, contact, location] = await Promise.all([
    getNavigation(),
    getRestaurant(),
    getContact(),
    getPrimaryLocation(),
  ]);
  const { links, cta } = navigation.header;
  const logo = restaurant.logoOnDark ?? restaurant.logo;
  const addressLines = hasAddress(location.address) ? formatAddressLines(location.address) : [];

  return (
    <header className="sticky top-0 z-50 border-b border-bone-50/10 bg-ink-900 text-bone-50">
      <Container className="grid h-[var(--header-h)] grid-cols-[auto_1fr_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="justify-self-start">
          <Logo name={restaurant.name} image={logo} />
        </Link>

        <NavLinks links={links} className="hidden justify-self-center md:block" />

        <div className="flex items-center gap-3 justify-self-end">
          <div className="hidden sm:block">
            <ButtonLink href={cta.href}>{cta.label}</ButtonLink>
          </div>
          <MobileNav
            brandName={restaurant.name}
            logo={logo}
            links={links}
            cta={cta}
            addressLines={addressLines}
            email={contact.email}
          />
        </div>
      </Container>
    </header>
  );
}

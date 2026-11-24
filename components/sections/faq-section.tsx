import { Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section, SectionHeading } from "@/components/ui/section";
import { getFaqs, getPageContent } from "@/lib/data";

/** Native <details> accordion: accessible, works without JavaScript and the answers stay in the HTML. */
export async function FaqSection() {
  const [{ faq }, faqs] = await Promise.all([getPageContent("home"), getFaqs()]);
  if (faqs.length === 0) return null;

  return (
    <Section tone="bone" labelledBy="faq-heading">
      <Container className="grid grid-cols-1 gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <SectionHeading id="faq-heading" title={faq.title} description={faq.description} />

        <div className="border-t border-ink-900/15">
          {faqs.map((item) => (
            <details key={item.id} name="faq" className="group border-b border-ink-900/15">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-base font-bold leading-snug sm:text-lg [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 text-ember-600 transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="max-w-2xl pb-6 font-serif text-lg leading-relaxed text-ink-500">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}

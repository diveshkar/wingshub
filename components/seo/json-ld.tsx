type JsonLdProps = {
  data: Record<string, unknown> | null;
};

/**
 * Renders a schema.org JSON-LD block. "<" is escaped so data that later comes from a
 * database or CMS can never close the script tag early.
 */
export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

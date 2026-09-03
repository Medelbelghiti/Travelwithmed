import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Editorial Policy",
  description:
    "Our editorial standards — how we research, write and review travel content at Riversmag.",
  canonicalPath: "/editorial-policy",
});

export default function EditorialPolicyPage() {
  return (
    <LegalPage crumb="Editorial Policy" title="Editorial Policy" updated="August 30, 2026">
      <h2>Our promise</h2>
      <p>
        Riversmag exists to help you plan smarter and travel better. Our editorial team is committed to producing
        accurate, honest and useful travel content that puts the reader first.
      </p>

      <h2>1. Independence</h2>
      <p>
        Our recommendations are based on editorial judgment, not commercial relationships. We never accept money
        in exchange for positive coverage. A commission from an affiliate link never influences whether we
        recommend a hotel, tour or product.
      </p>

      <h2>2. Accuracy</h2>
      <p>
        We verify information where we can (prices, hours, visas, transport) and clearly date our articles so
        readers know when guidance was last updated. When travel information changes — and it changes often —
        we update our content.
      </p>

      <h2>3. First-hand experience</h2>
      <p>
        We only claim first-hand experience of a place we have actually visited. Where a guide is compiled from
        research rather than personal visits, we say so. We never fabricate travel experiences.
      </p>

      <h2>4. Reviews we trust</h2>
      <p>
        We never fabricate product specifications, prices, ratings or reviews. Where we cite data, we source it.
        If we can&apos;t verify something, we tell you.
      </p>

      <h2>5. Corrections</h2>
      <p>
        We fix errors promptly. If you spot a mistake, contact us at{" "}
        <a href="mailto:editors@riversmag.com">editors@riversmag.com</a> and we&apos;ll review it and correct it
        where necessary.
      </p>

      <h2>6. AI-assisted content</h2>
      <p>
        Where AI tools assist with research, outlines or first drafts, every piece is reviewed, fact-checked and
        edited by a human before publication. We never publish unedited AI content.
      </p>

      <h2>7. Sponsored content</h2>
      <p>
        Sponsored or partner content is always clearly labelled as such and never disguised as editorial advice.
      </p>

      <h2>8. Transparency</h2>
      <p>
        We disclose our affiliate relationships openly — see our{" "}
        <a href="/affiliate-disclosure">Affiliate Disclosure</a>. Our readers&apos; trust matters more than any
        single commission, and we&apos;d rather recommend nothing than recommend something we don&apos;t believe in.
      </p>
    </LegalPage>
  );
}
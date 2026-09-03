import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Affiliate Disclosure",
  description:
    "How Riversmag makes money through affiliate partnerships — and why you can trust our recommendations.",
  canonicalPath: "/affiliate-disclosure",
});

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage crumb="Affiliate Disclosure" title="Affiliate Disclosure" updated="August 30, 2026">
      <h2>How Riversmag is funded</h2>
      <p>
        Riversmag is an independent travel media brand. Our content is researched and written by editors who care
        about helping you plan smarter trips. To keep our guides free, we earn money through affiliate
        partnerships.
      </p>

      <h2>What this means for you</h2>
      <p>
        When you click an affiliate link on our site — for example to a hotel, tour, insurance provider or eSIM
        store — and then make a booking or purchase, we may receive a commission from our partner. This comes at{" "}
        <strong>no additional cost to you</strong>.
      </p>

      <h2>Does this affect our recommendations?</h2>
      <p>
        No. We choose which products, hotels and services to recommend based on editorial judgment — quality,
        value and fit for your trip. We never recommend something solely because it pays a commission, and we
        are transparent about the pros and cons of everything we feature.
      </p>

      <h2>How we identify affiliate links</h2>
      <p>
        Affiliate links on Riversmag include the attributes <code>rel=&quot;nofollow sponsored&quot;</code> so search
        engines and your browser can identify them as sponsored links. We also add a commission disclosure in
        relevant articles and sections.
      </p>

      <h2>Our monetisation rules</h2>
      <ul>
        <li>No misleading buttons or fake countdown timers</li>
        <li>No fake reviews, ratings or prices</li>
        <li>No fabricated scarcity or urgency</li>
        <li>Clear and honest pros and cons</li>
        <li>We never guarantee earnings or savings</li>
      </ul>

      <h2>Questions</h2>
      <p>
        Want to know more about how we partner with brands, or report a concern about a recommendation? Email us
        at <a href="mailto:partners@riversmag.com">partners@riversmag.com</a>.
      </p>
    </LegalPage>
  );
}
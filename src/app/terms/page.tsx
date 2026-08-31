import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "The terms that apply when you use the Roamora website.",
  canonicalPath: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage crumb="Terms" title="Terms of Service" updated="August 30, 2026">
      <h2>1. Acceptance of terms</h2>
      <p>
        By accessing or using Roamora (&quot;the Site&quot;), you agree to these Terms of Service. If you do not agree,
        please do not use the Site.
      </p>

      <h2>2. Use of content</h2>
      <p>
        All content on the Site is provided for personal, non-commercial use. You may not copy, reproduce,
        redistribute or republish our content without written permission.
      </p>

      <h2>3. Accuracy of information</h2>
      <p>
        We work hard to keep our content accurate and up to date, but travel information changes quickly —
        prices, opening hours, visa rules and availability can change without notice. You confirm that you
        understand and accept this, and that you rely on the information at your own judgment.
      </p>

      <h2>4. Affiliate links and advertising</h2>
      <p>
        The Site contains affiliate links. When you click these links and make a booking or purchase, we may
        receive a commission at no additional cost to you. This does not influence our editorial recommendations —
        see our{" "}
        <a href="/affiliate-disclosure">Affiliate Disclosure</a>.
      </p>

      <h2>5. Third-party websites</h2>
      <p>
        The Site links to third-party websites. We are not responsible for the content, policies or practices
        of any third-party site.
      </p>

      <h2>6. No guarantees</h2>
      <p>
        We do not guarantee specific outcomes, savings or earnings from using the Site or the products we
        recommend, and we make no representation that particular prices or availability will be available.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Roamora shall not be liable for any indirect, incidental or
        consequential damages arising from your use of the Site or reliance on its content.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Roamora name, logo and original content are our intellectual property and may not be used without
        permission.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the Site after changes are posted
        constitutes acceptance of the revised terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms? Contact us at <a href="mailto:legal@roamora.com">legal@roamora.com</a>.
      </p>
    </LegalPage>
  );
}
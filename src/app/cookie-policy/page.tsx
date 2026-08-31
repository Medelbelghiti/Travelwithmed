import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cookie Policy",
  description: "How Roamora uses cookies and how you can control them.",
  canonicalPath: "/cookie-policy",
});

export default function CookiePolicyPage() {
  return (
    <LegalPage crumb="Cookie Policy" title="Cookie Policy" updated="August 30, 2026">
      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the site remember
        your preferences and understand how it is used.
      </p>

      <h2>2. Cookies we use</h2>
      <ul>
        <li>
          <strong>Essential cookies:</strong> Required for core functionality, such as remembering your admin
          session or saved settings.
        </li>
        <li>
          <strong>Analytics cookies:</strong> Help us understand traffic and see which content is most useful.
          Data is aggregated and anonymised where possible.
        </li>
        <li>
          <strong>Preference cookies:</strong> Remember choices like your language or region.
        </li>
        <li>
          <strong>Marketing/affiliate cookies:</strong> Set by our affiliate partners when you click an
          affiliate link, so they can attribute a referral. These are governed by the partner&apos;s own
          privacy and cookie policies.
        </li>
      </ul>

      <h2>3. Managing cookies</h2>
      <p>
        You can control and delete cookies through your browser settings. Most browsers allow you to block
        third-party cookies or all cookies. Please note that disabling essential cookies may affect how the
        website works.
      </p>

      <h2>4. Contact</h2>
      <p>
        Questions about cookies? Contact us at <a href="mailto:privacy@roamora.com">privacy@roamora.com</a>.
      </p>
    </LegalPage>
  );
}
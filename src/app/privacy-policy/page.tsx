import { LegalPage } from "@/components/legal-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How Riversmag collects, uses and protects your personal information.",
  canonicalPath: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPage crumb="Privacy Policy" title="Privacy Policy" updated="August 30, 2026">
      <h2>1. Who we are</h2>
      <p>
        Riversmag (&quot;we&quot;, &quot;us&quot;) is a travel media platform that publishes destination guides, itineraries and
        recommendations to help you plan your trips. This privacy policy explains what information we collect,
        why we collect it and how we use it.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Information you give us</h3>
      <p>
        When you subscribe to our newsletter, contact us, or create an account, we collect the details you
        provide — such as your name, email address and travel preferences.
      </p>
      <h3>Information we collect automatically</h3>
      <p>
        When you visit Riversmag, we may collect technical information such as your browser type, device type,
        approximate location (country level), pages visited, referral source and the date and time of your visit.
        This helps us understand traffic and improve the site.
      </p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To operate and improve the website</li>
        <li>To send newsletters you have subscribed to</li>
        <li>To analyse traffic and understand what content is useful</li>
        <li>To measure affiliate link performance (aggregated, not personally identifiable)</li>
        <li>To respond to enquiries</li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        We use cookies and similar technologies to keep the site working, remember preferences and understand
        how visitors use Riversmag. You can control cookies through your browser settings. See our{" "}
        <a href="/cookie-policy">Cookie Policy</a> for details.
      </p>

      <h2>5. Affiliate partners</h2>
      <p>
        When you click an affiliate link on Riversmag, you are redirected to a partner website
        (such as a hotel or tour booking platform). That partner may use cookies and is responsible for its own
        data practices. We encourage you to review the privacy policies of any partner sites you visit.
      </p>

      <h2>6. Analytics</h2>
      <p>
        We use privacy-conscious analytics to understand traffic patterns. This data is aggregated and does not
        identify individual visitors.
      </p>

      <h2>7. Data sharing</h2>
      <p>
        We do not sell your personal data. We may share data with trusted service providers (such as email
        platforms and analytics tools) strictly for operating the website, and only where processors comply
        with applicable data protection law.
      </p>

      <h2>8. Data retention</h2>
      <p>
        We keep newsletter subscription data until you unsubscribe or ask us to delete it. You may contact us at
        any time to request access to, correction of, or deletion of your personal data.
      </p>

      <h2>9. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct or delete your personal data, to
        object to processing, and to data portability. To exercise any of these rights, contact us at{" "}
        <a href="mailto:privacy@riversmag.com">privacy@riversmag.com</a>.
      </p>

      <h2>10. Children</h2>
      <p>
        Riversmag is not directed at children under 13 and we do not knowingly collect personal information from
        children.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about this policy? Contact us at <a href="mailto:privacy@riversmag.com">privacy@riversmag.com</a>.
      </p>
    </LegalPage>
  );
}
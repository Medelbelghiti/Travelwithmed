import { prisma } from "@/lib/prisma";
import { isEmailEnabled, sendEmail, escapeHtml } from "@/lib/email";

/**
 * Newsletter integration layer (server-side only — never import from a client
 * component; no secrets are exposed to the browser).
 *
 * The canonical owned audience lives in the `NewsletterSubscriber` table.
 * `NEWSLETTER_PROVIDER` + `NEWSLETTER_API_KEY` can be enabled later to push
 * subscriptions to an external email provider (Mailchimp, ConvertKit,
 * Klaviyo, ...). The switch below is the single extension point — swap or add
 * a case without touching any client code or endpoint.
 */
export interface SubscribeResult {
  ok: boolean;
  providerSynced: boolean;
  welcomeSent: boolean;
  alreadySubscribed: boolean;
}

function newsletterProvider(): string | null {
  return process.env.NEWSLETTER_PROVIDER?.trim().toLowerCase() || null;
}

/** External provider subscription hook. No-op until a provider is configured. */
async function syncExternalProvider(
  _params: { email: string; firstName?: string | null; interests?: string[] },
): Promise<boolean> {
  const provider = newsletterProvider();
  const apiKey = process.env.NEWSLETTER_API_KEY;
  if (!provider || !apiKey) return false;
  void _params;

  switch (provider) {
    case "mailchimp": {
      // TODO: Mailchimp API v3 — POST /lists/{listId}/members
      return false;
    }
    case "convertkit": {
      // TODO: ConvertKit API — POST /v3/subscribers with { api_key, email, first_name }
      return false;
    }
    case "klaviyo": {
      // TODO: Klaviyo API — POST /api/profiles && /api/lists/{list_id}/relationships/members
      return false;
    }
    default:
      return false;
  }
}

/**
 * Records a subscriber in the owned database, syncs to the configured email
 * provider (when enabled) and sends the welcome email. Safe to call from any
 * server file.
 */
export async function subscribeToNewsletter(params: {
  email: string;
  firstName?: string | null;
  interests?: string[];
  source?: string | null;
}): Promise<SubscribeResult> {
  const email = params.email.trim().toLowerCase();
  const firstName = params.firstName?.trim().slice(0, 100) || null;
  const interests = (params.interests ?? []).slice(0, 20);

  const upsert = await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      firstName,
      interests,
      source: params.source ?? "newsletter_form",
      status: "SUBSCRIBED",
    },
    update: {
      firstName: firstName ?? undefined,
      interests,
      status: "SUBSCRIBED",
      unsubscribedAt: null,
    },
  });

  const alreadySubscribed = upsert.createdAt.getTime() !== upsert.updatedAt.getTime();

  const [providerSynced, welcomeSent] = await Promise.all([
    syncExternalProvider({ email, firstName, interests }),
    sendWelcomeEmail({ email, firstName }),
  ]);

  return { ok: true, providerSynced, welcomeSent, alreadySubscribed };
}

async function sendWelcomeEmail(params: {
  email: string;
  firstName?: string | null;
}): Promise<boolean> {
  if (!isEmailEnabled()) return false;
  const greeting = params.firstName ? `Hi ${escapeHtml(params.firstName)},` : "Hi there,";
  await sendEmail({
    to: params.email,
    subject: "Welcome to Riversmag — practical travel tips, guides & deals",
    html: `
      <p>${greeting}</p>
      <p>Welcome to Riversmag.</p>
      <p>Every week you'll get one useful email: practical travel tips, refreshed destination guides and editor-picked travel deals — researched by real travellers, never spam.</p>
      <p>Happy travels,<br/>The Riversmag team</p>
    `,
  });
  return true;
}

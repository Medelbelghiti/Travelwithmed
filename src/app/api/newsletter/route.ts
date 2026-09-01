import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isEmailEnabled, sendEmail, escapeHtml } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`newsletter:${getClientIp(request)}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const body = await request.json().catch(() => null);
    const firstName = typeof body?.firstName === "string" ? body.firstName.slice(0, 100) : null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;
    const interests = Array.isArray(body?.interests) ? body.interests.slice(0, 20) : [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        firstName: firstName?.slice(0, 100) || null,
        interests,
        source: "newsletter_form",
        status: "SUBSCRIBED",
      },
      update: {
        firstName: firstName?.slice(0, 100) || undefined,
        interests,
        status: "SUBSCRIBED",
        unsubscribedAt: null,
      },
    });

    if (isEmailEnabled()) {
      const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi there,";
      await sendEmail({
        to: email,
        subject: "Welcome to Riversmag",
        html: `
          <p>${greeting}</p>
          <p>Welcome to Riversmag — hand-crafted itineraries, honest planning guides and the exact links we'd book ourselves.</p>
          <p>You're in. Expect one useful email per week, never spam, and the occasional free printable before everyone else gets it.</p>
          <p>Happy travels,<br/>The Riversmag team</p>
        `,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscribe error", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
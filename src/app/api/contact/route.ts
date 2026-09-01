import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isEmailEnabled, sendEmail, escapeHtml } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`contact:${getClientIp(request)}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 200) : "";
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 5000) : "";

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (isEmailEnabled()) {
      const to = process.env.CONTACT_TO_EMAIL ?? "hello@riversmag.com";
      await sendEmail({
        to,
        subject: `[Contact form] ${subject || "New message from riversmag.com"}`,
        html: `
          <h2>New contact message from riversmag.com</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr />
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        `,
        replyTo: email,
      });
    } else {
      console.info("Contact message received (email disabled)", {
        name,
        email,
        subject,
        messageLength: message.length,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Contact form error", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
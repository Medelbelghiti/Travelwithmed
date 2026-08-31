import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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

    // For V1, contact messages are accepted and logged. Configure an email
    // provider (e.g. Resend) in a future integration.
    console.info("Contact message received", { name, email, subject, messageLength: message.length });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Contact form error", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
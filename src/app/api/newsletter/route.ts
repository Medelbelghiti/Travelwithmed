import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { subscribeToNewsletter } from "@/lib/newsletter";

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

    await subscribeToNewsletter({
      email,
      firstName,
      interests,
      source: "newsletter_form",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscribe error", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-success/30 bg-success/10 p-10 text-center">
        <h2 className="font-serif text-2xl font-semibold text-success">Message sent</h2>
        <p className="mt-2 text-ink-soft">
          Thanks for reaching out. We&apos;ll get back to you as soon as we can.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-line bg-white p-6 shadow-sm md:p-8">
      <h2 className="font-serif text-2xl font-semibold text-ink">Send us a message</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Name
          </label>
          <input id="contact-name" name="name" required value={form.name} onChange={handleChange} className={inputClass} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-ink-soft">
          Subject
        </label>
        <select id="contact-subject" name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
          <option value="">Choose a topic</option>
          <option>Question about a guide</option>
          <option>Correction</option>
          <option>Partnership</option>
          <option>Press</option>
          <option>Other</option>
        </select>
      </div>
      <div className="mt-4">
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-ink-soft">
          Message
        </label>
        <textarea id="contact-message" name="message" required value={form.message} onChange={handleChange} rows={6} className={inputClass} placeholder="How can we help?" />
      </div>
      {status === "error" && <p className="mt-3 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden />
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
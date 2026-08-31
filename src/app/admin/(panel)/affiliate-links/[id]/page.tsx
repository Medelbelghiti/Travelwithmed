import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveAffiliateLinkAction } from "@/lib/actions/affiliate";
import { AFFILIATE_CATEGORY_LABELS } from "@/lib/affiliate";
import type { AffiliateCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateLinkEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const isNew = id === "new";

  const [link, articles, destinations, hotels, activities, products] = await Promise.all([
    isNew ? null : prisma.affiliateLink.findUnique({ where: { id } }),
    prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.destination.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 200 }),
    prisma.hotel.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.activity.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/affiliate-links" className="rounded-xl p-2 text-ink-muted hover:bg-sand" aria-label="Back">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="font-serif text-3xl font-semibold text-ink">
          {isNew ? "New affiliate link" : "Edit affiliate link"}
        </h1>
      </div>

      <form action={async (fd: FormData) => { await saveAffiliateLinkAction(undefined, fd) }} className="mt-6 space-y-6">
        <input type="hidden" name="id" value={isNew ? "" : id} />

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="alink-partner" className={L}>Partner name</label>
              <input id="alink-partner" name="partnerName" required defaultValue={link?.partnerName ?? ""} className={inputClass} placeholder="e.g. Booking.com" />
            </div>
            <div>
              <label htmlFor="alink-product" className={L}>Product name</label>
              <input id="alink-product" name="productName" required defaultValue={link?.productName ?? ""} className={inputClass} placeholder="e.g. Paris hotels" />
            </div>
            <div>
              <label htmlFor="alink-category" className={L}>Category</label>
              <select id="alink-category" name="category" defaultValue={link?.category ?? "HOTELS"} className={inputClass}>
                {(Object.keys(AFFILIATE_CATEGORY_LABELS) as AffiliateCategory[]).map((c) => (
                  <option key={c} value={c}>{AFFILIATE_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="alink-desttext" className={L}>Destination (text)</label>
              <input id="alink-desttext" name="destinationText" defaultValue={link?.destinationText ?? ""} className={inputClass} placeholder="e.g. Paris, France" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Destination URL & tracking</h2>
          <div className="grid gap-4">
            <div>
              <label htmlFor="alink-url" className={L}>Affiliate URL</label>
              <input id="alink-url" name="targetUrl" required defaultValue={link?.targetUrl ?? ""} className={inputClass} placeholder="https://partner.com/…?aff_id=123" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="alink-track" className={L}>Tracking parameter</label>
                <input id="alink-track" name="trackingParameter" defaultValue={link?.trackingParameter ?? ""} className={inputClass} placeholder="click_id" />
              </div>
              <div>
                <label htmlFor="alink-campaign" className={L}>UTM campaign</label>
                <input id="alink-campaign" name="utmCampaign" defaultValue={link?.utmCampaign ?? ""} className={inputClass} placeholder="paris-guide" />
              </div>
              <div>
                <label htmlFor="alink-content" className={L}>UTM content</label>
                <input id="alink-content" name="utmContent" defaultValue={link?.utmContent ?? ""} className={inputClass} placeholder="hotel-card" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="alink-priority" className={L}>Priority (higher wins)</label>
                <input id="alink-priority" name="priority" type="number" defaultValue={link?.priority ?? 0} className={inputClass} />
              </div>
              <div className="flex items-end gap-6 pb-1">
                <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                  <input type="checkbox" name="active" defaultChecked={link?.active ?? true} className="h-4 w-4 accent-brand" />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                  <input type="checkbox" name="disclosureRequired" defaultChecked={link?.disclosureRequired ?? true} className="h-4 w-4 accent-brand" />
                  Disclosure required
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Deal & promo (featured on /deals)</h2>
          <p className="mb-4 text-xs text-ink-muted">
            Optional. Filling in a deal title promotes this partner on the public deals page — perfect for running campaigns.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="alink-deal" className={L}>Deal title</label>
              <input id="alink-deal" name="dealTitle" defaultValue={link?.dealTitle ?? ""} className={inputClass} placeholder="e.g. Up to 15% off member deals" />
            </div>
            <div>
              <label htmlFor="alink-promo" className={L}>Promo code (optional)</label>
              <input id="alink-promo" name="promoCode" defaultValue={link?.promoCode ?? ""} className={inputClass} placeholder="e.g. ROAMORA15" />
            </div>
            <div>
              <label htmlFor="alink-expiry" className={L}>Deal expires (optional)</label>
              <input
                id="alink-expiry"
                name="dealExpiresAt"
                type="date"
                defaultValue={link?.dealExpiresAt ? new Date(link.dealExpiresAt).toISOString().slice(0, 10) : ""}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
              <input type="checkbox" name="featuredDeal" defaultChecked={link?.featuredDeal ?? false} className="h-4 w-4 accent-brand" />
              Featured on the deals page
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-semibold text-ink">Context (optional)</h2>
          <p className="mb-4 text-xs text-ink-muted">Attach this link to an article, destination or entity so it can be resolved automatically.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="alink-article" className={L}>Article</label>
              <select id="alink-article" name="articleId" defaultValue={link?.articleId ?? ""} className={inputClass}>
                <option value="">None</option>
                {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="alink-dest" className={L}>Destination</label>
              <select id="alink-dest" name="destinationId" defaultValue={link?.destinationId ?? ""} className={inputClass}>
                <option value="">None</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="alink-hotel" className={L}>Hotel</label>
              <select id="alink-hotel" name="hotelId" defaultValue={link?.hotelId ?? ""} className={inputClass}>
                <option value="">None</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="alink-activity" className={L}>Activity</label>
              <select id="alink-activity" name="activityId" defaultValue={link?.activityId ?? ""} className={inputClass}>
                <option value="">None</option>
                {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="alink-product" className={L}>Product</label>
              <select id="alink-product" name="productId" defaultValue={link?.productId ?? ""} className={inputClass}>
                <option value="">None</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </section>

        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark">
          <Save className="h-4 w-4" aria-hidden />
          Save affiliate link
        </button>
      </form>
    </div>
  );
}

const L = "mb-1.5 block text-sm font-medium text-ink-soft";
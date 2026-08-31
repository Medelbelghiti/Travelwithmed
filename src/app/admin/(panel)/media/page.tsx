import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveMediaAction } from "@/lib/actions/settings";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand";

export default async function AdminMediaPage() {
  await requireUser();
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { destination: true, article: true, author: true },
    take: 200,
  });

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Media library</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Track image sources, credits and licenses so you never publish without attribution.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {media.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-muted">No media yet. Add your first image URL on the right.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-sand">
                  <th className="px-4 py-3 font-semibold text-ink">Preview</th>
                  <th className="px-4 py-3 font-semibold text-ink">Alt / caption</th>
                  <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Source</th>
                  <th className="hidden px-4 py-3 font-semibold text-ink md:table-cell">Linked to</th>
                </tr>
              </thead>
              <tbody>
                {media.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3">
                      {m.format === "svg" ? (
                        <span className="inline-flex h-16 w-24 items-center justify-center rounded-xl border border-line bg-sand text-ink-muted">
                          <ImageIcon className="h-6 w-6" aria-hidden />
                        </span>
                      ) : (
                        <Image src={m.url} alt={m.altText ?? ""} width={96} height={64} unoptimized className="h-16 w-24 rounded-xl border border-line object-cover" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-2 font-medium text-ink">{m.altText || "No alt text"}</p>
                      {m.caption && <p className="line-clamp-2 mt-0.5 text-xs text-ink-muted">{m.caption}</p>}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted md:table-cell">
                      {m.url && (
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="block max-w-[260px] truncate hover:text-brand">
                          {m.url}
                        </a>
                      )}
                      {m.credit && <p className="mt-1">Photo: {m.credit}</p>}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-ink-muted md:table-cell">
                      {m.destination?.name ?? m.article?.title ?? m.author?.name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="rounded-2xl border border-line bg-white p-6 shadow-sm lg:self-start lg:sticky lg:top-8">
          <h2 className="font-serif text-lg font-semibold text-ink">Add media</h2>
          <form action={async (fd: FormData) => { await saveMediaAction(undefined, fd) }} className="mt-4 space-y-3">
            <div>
              <label htmlFor="media-url" className="mb-1 block text-sm font-medium text-ink-soft">
                Image URL
              </label>
              <input id="media-url" name="url" required className={inputClass} placeholder="https://…" />
            </div>
            <div>
              <label htmlFor="media-alt" className="mb-1 block text-sm font-medium text-ink-soft">
                Alt text
              </label>
              <input id="media-alt" name="altText" className={inputClass} />
            </div>
            <div>
              <label htmlFor="media-caption" className="mb-1 block text-sm font-medium text-ink-soft">
                Caption
              </label>
              <input id="media-caption" name="caption" className={inputClass} />
            </div>
            <div>
              <label htmlFor="media-credit" className="mb-1 block text-sm font-medium text-ink-soft">
                Credit
              </label>
              <input id="media-credit" name="credit" className={inputClass} />
            </div>
            <button type="submit" className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
              Add to library
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveSettingAction, deleteSettingAction } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand";

export default async function AdminSettingsPage() {
  await requireUser();
  const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });

  return (
    <div>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Key/value configuration for the platform. Most runtime config lives in <code className="rounded bg-sand px-1.5 py-0.5 text-xs">.env</code>.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          {settings.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-muted">No settings stored in the database yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-sand">
                  <th className="px-4 py-3 font-semibold text-ink">Key</th>
                  <th className="px-4 py-3 font-semibold text-ink">Value</th>
                  <th className="px-4 py-3 font-semibold text-ink">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold text-ink">Delete</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.key} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{s.key}</td>
                    <td className="max-w-[280px] px-4 py-3">
                      <span className="line-clamp-2 text-xs text-ink-muted">{s.isSecret ? "••••••••" : (typeof s.value === "string" ? s.value : JSON.stringify(s.value))}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">{s.updatedAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={async (fd: FormData) => { await deleteSettingAction(undefined, fd) }}>
                        <input type="hidden" name="key" value={s.key} />
                        <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="rounded-2xl border border-line bg-white p-6 shadow-sm lg:self-start lg:sticky lg:top-8">
          <h2 className="font-serif text-lg font-semibold text-ink">Add / update setting</h2>
          <form action={async (fd: FormData) => { await saveSettingAction(undefined, fd) }} className="mt-4 space-y-3">
            <div>
              <label htmlFor="setting-key" className="mb-1 block text-sm font-medium text-ink-soft">
                Key
              </label>
              <input id="setting-key" name="key" required className={`${inputClass} font-mono text-xs`} placeholder="feature.x.enabled" />
            </div>
            <div>
              <label htmlFor="setting-value" className="mb-1 block text-sm font-medium text-ink-soft">
                Value (JSON or text)
              </label>
              <textarea id="setting-value" name="value" rows={4} className={`${inputClass} font-mono text-xs`} placeholder={'{"enabled": true}'} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="isSecret" className="h-4 w-4 rounded border-line accent-brand" />
              Secret (masked in UI)
            </label>
            <button type="submit" className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
              Save setting
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
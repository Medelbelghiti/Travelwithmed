import type { ReactNode } from "react";
import { Breadcrumbs, buildCrumbs } from "@/components/ui/breadcrumbs";

export function LegalPage({
  crumb,
  title,
  updated,
  children,
}: {
  crumb: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="container-x section-pad">
      <Breadcrumbs items={buildCrumbs([{ name: crumb, href: `/${crumb.toLowerCase().replace(/ /g, "-")}` }])} />
      <article className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: {updated}</p>
        <div className="prose-roamora mt-8">{children}</div>
      </article>
    </main>
  );
}
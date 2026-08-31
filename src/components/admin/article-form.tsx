"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { BlockEditor } from "./block-editor";
import type { ContentBlock } from "@/lib/content";
import { saveArticleAction } from "@/lib/actions/content";
import { ARTICLE_TYPE_LABELS } from "@/components/article-card";
import type { Article, ArticleType, ArticleStatus } from "@prisma/client";

interface Option {
  id: string;
  name: string;
}

export interface ArticleFormProps {
  article?: Article | null;
  authors: Option[];
  destinations: Option[];
  categories: Option[];
  initialBlocks?: ContentBlock[];
}

const ARTICLE_TYPES = Object.keys(ARTICLE_TYPE_LABELS) as ArticleType[];
const STATUSES: ArticleStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "SCHEDULED", "ARCHIVED"];

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand";

export function ArticleForm({ article, authors, destinations, categories, initialBlocks = [] }: ArticleFormProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [contentJson, setContentJson] = useState(JSON.stringify(initialBlocks));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  void categories;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("content", contentJson);
    const result = (await saveArticleAction(undefined, formData)) as { error?: string } | undefined;
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push("/admin/articles");
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/articles" className="rounded-xl p-2 text-ink-muted hover:bg-sand" aria-label="Back to articles">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-semibold text-ink">
              {article ? "Edit article" : "New article"}
            </h1>
            {article && <p className="text-sm text-ink-muted">{article.slug}</p>}
          </div>
        </div>
        <button
          type="submit"
          form="article-form"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Save article
        </button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      <form id="article-form" onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <input type="hidden" name="id" value={article?.id ?? ""} />

        <div className="space-y-6">
          <Section title="Content">
            <div>
              <label htmlFor="editor-title" className={labelClass}>Title</label>
              <input id="editor-title" name="title" defaultValue={article?.title ?? ""} required className={inputClass} placeholder="Complete Guide to Paris" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="editor-slug" className={labelClass}>Slug (optional)</label>
                <input id="editor-slug" name="slug" defaultValue={article?.slug ?? ""} className={inputClass} placeholder="auto-generated from title" />
              </div>
              <div>
                <label htmlFor="editor-cover" className={labelClass}>Cover image URL</label>
                <input id="editor-cover" name="coverImage" defaultValue={article?.coverImage ?? ""} className={inputClass} placeholder="https://…" />
              </div>
            </div>
            <div>
              <label htmlFor="editor-excerpt" className={labelClass}>Excerpt</label>
              <textarea id="editor-excerpt" name="excerpt" defaultValue={article?.excerpt ?? ""} rows={3} className={inputClass} placeholder="A short summary shown in listings and search results." />
            </div>
          </Section>

          <Section title="Body blocks">
            <p className="mb-3 flex items-center gap-2 text-xs text-ink-muted">
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Blocks render as rich content, affiliate cards and CTAs on the published article.
            </p>
            <BlockEditor
              initialBlocks={blocks}
              onChange={(blocks, json) => {
                setBlocks(blocks);
                setContentJson(json);
              }}
            />
          </Section>

          <Section title="SEO">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="editor-metatitle" className={labelClass}>Meta title</label>
                <input id="editor-metatitle" name="metaTitle" defaultValue={article?.metaTitle ?? ""} className={inputClass} placeholder="Overrides the H1 in search results" />
              </div>
              <div>
                <label htmlFor="editor-focus" className={labelClass}>Focus keyword</label>
                <input id="editor-focus" name="focusKeyword" defaultValue={article?.focusKeyword ?? ""} className={inputClass} placeholder="best hotels in paris" />
              </div>
            </div>
            <div>
              <label htmlFor="editor-metadesc" className={labelClass}>Meta description</label>
              <textarea id="editor-metadesc" name="metaDescription" defaultValue={article?.metaDescription ?? ""} rows={3} className={inputClass} placeholder="A compelling description, ideally 140–160 characters." />
            </div>
            <div>
              <label htmlFor="editor-canonical" className={labelClass}>Canonical URL</label>
              <input id="editor-canonical" name="canonicalUrl" defaultValue={article?.canonicalUrl ?? ""} className={inputClass} placeholder="https://… (leave empty to use defaults)" />
            </div>
          </Section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <Section title="Publishing">
            <div>
              <label htmlFor="editor-status" className={labelClass}>Status</label>
              <select id="editor-status" name="status" defaultValue={article?.status ?? "DRAFT"} className={inputClass}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status.toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="editor-type" className={labelClass}>Article type</label>
              <select id="editor-type" name="type" defaultValue={article?.type ?? "TRAVEL_TIPS"} className={inputClass}>
                {ARTICLE_TYPES.map((type) => (
                  <option key={type} value={type}>{ARTICLE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="editor-author" className={labelClass}>Author</label>
                <select id="editor-author" name="authorId" defaultValue={article?.authorId ?? ""} className={inputClass}>
                  <option value="">None</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editor-dest" className={labelClass}>Destination</label>
                <select id="editor-dest" name="destinationId" defaultValue={article?.destinationId ?? ""} className={inputClass}>
                  <option value="">None</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="editor-scheduled" className={labelClass}>Scheduled publish date (optional)</label>
              <input id="editor-scheduled" name="scheduledAt" type="datetime-local" defaultValue={article?.scheduledAt ? article.scheduledAt.toISOString().slice(0, 16) : ""} className={inputClass} />
            </div>
          </Section>

          {article?.status === "PUBLISHED" && (
            <Section title="Live article">
              <Link href={`/articles/${article.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-sand px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sand-dark">
                <Eye className="h-4 w-4" aria-hidden />
                View published article
              </Link>
            </Section>
          )}
        </aside>
      </form>
    </div>
  );
}

const labelClass = "mb-1.5 block text-sm font-medium text-ink-soft";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-serif text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
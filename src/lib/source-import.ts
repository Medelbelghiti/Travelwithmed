import type { ContentBlock } from "./content";

/**
 * Conversion of the author's source documents (DOCX) into the ContentBlock[]
 * format the renderer expects.
 *
 * Two source shapes arrive here:
 *
 *  1. Word-styled documents (Albania, Azores, Georgia) where structure lives in
 *     paragraph styles: Heading1/2/3, ListNumber, ListBullet, Quote.
 *  2. Markdown-in-DOCX (Best Summer Holiday) where every paragraph is "Normal"
 *     and structure is carried by "#", "##", "- " and "**bold**".
 *
 * The renderer writes block.text straight into React as text - it never parses
 * HTML or markdown (src/components/content-renderer.tsx:89). Any markup left in
 * the string would render literally, so markdown syntax must be stripped here.
 *
 * This file is deliberately ASCII-only. Non-ASCII marks are written as unicode
 * escapes so the source can never be corrupted by an encoding round-trip.
 */

export interface SourceParagraph {
  style?: string | null;
  text: string;
}

export interface ConversionResult {
  blocks: ContentBlock[];
  /** First Heading1 / "# " line, used as the article title. */
  title: string | null;
  /** Editorial notes stripped from the body - never shown to readers. */
  editorialNotes: string[];
  /** Paragraphs whose text looked corrupted during extraction. */
  anomalies: string[];
}

/** MIDDLE DOT - the intended metadata separator. */
const SEP = "\u00B7";
/** Leading glyph of a bulleted item, as the extractor emits it. */
const BULLET_LEAD = /^[-\u2022*]/;

/** Editorial notes the author left for a human, not for the reader. */
const EDITORIAL_PREFIXES = [
  "image sources:",
  "publishing note:",
  "editorial note:",
  "sources:",
  "note to editor",
];

/** Words below this are thin and must not be published without a human. */
export const MIN_WORDS = 600;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Strip markdown emphasis and headings so nothing renders as literal syntax. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?=[^*]|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function isEditorialNote(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return EDITORIAL_PREFIXES.some((p) => lower.startsWith(p));
}

/**
 * Collapse the run-boundary gaps Word leaves behind ("Best forTravelers") and
 * the mixed separator runs the extractor produces (three filler marks around a
 * single intended MIDDLE DOT). Only non-ASCII marks count as separators so
 * "7-10 days" and "3.5-4 hours" survive untouched.
 */
function repairRunBoundaries(text: string): string {
  return text
    .replace(/\s{3,}/g, " ")
    .replace(/\u00B7(?:\s*[\u2022\u2013\u2014\u00B7])+/g, SEP)
    .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function convertParagraphs(paragraphs: SourceParagraph[]): ConversionResult {
  const blocks: ContentBlock[] = [];
  const editorialNotes: string[] = [];
  const anomalies: string[] = [];
  let title: string | null = null;

  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flush = () => {
    if (list.length > 0 && listType) {
      blocks.push(listType === "ol" ? { type: "ol", items: list } : { type: "ul", items: list });
    }
    list = [];
    listType = null;
  };

  const pushList = (kind: "ul" | "ol", item: string) => {
    if (listType && listType !== kind) flush();
    listType = kind;
    list.push(stripInlineMarkdown(item));
  };

  const stripBullet = (s: string) => s.replace(BULLET_LEAD, "").replace(/^\s+/, "");

  for (const raw of paragraphs) {
    const text = repairRunBoundaries(raw.text ?? "");
    if (!text) {
      flush();
      continue;
    }

    if (isEditorialNote(text)) {
      flush();
      editorialNotes.push(text);
      continue;
    }

    const style = (raw.style ?? "").toLowerCase();

    // --- Word styles -------------------------------------------------
    if (style === "heading1") {
      flush();
      if (!title) title = stripInlineMarkdown(text);
      continue;
    }
    if (style === "heading2") {
      flush();
      blocks.push({ type: "h2", text: stripInlineMarkdown(text) });
      continue;
    }
    if (style === "heading3" || style === "heading4" || style.startsWith("heading")) {
      flush();
      blocks.push({ type: "h3", text: stripInlineMarkdown(text) });
      continue;
    }
    if (style === "listnumber" || style === "listnumber2") {
      pushList("ol", stripBullet(text));
      continue;
    }
    if (style === "listbullet" || style === "listbullet2") {
      // Unambiguous bulleted style - the bullet glyph is not in the text.
      pushList("ul", stripBullet(text));
      continue;
    }
    if (style === "listparagraph") {
      // Word's default style for both bulleted and numbered paragraphs; the
      // glyph is the only signal, so fall back to detecting it.
      if (/^[-\u2022*]\s*/.test(text)) {
        pushList("ul", stripBullet(text));
        continue;
      }
      flush();
      blocks.push({ type: "p", text: stripInlineMarkdown(text) });
      continue;
    }
    if (style === "quote" || style === "intensequote") {
      flush();
      blocks.push({ type: "quote", text: stripInlineMarkdown(text) });
      continue;
    }

    // --- Markdown fallback (every paragraph is "Normal") --------------
    const md = detectMarkdown(text, { title, hasBlocks: blocks.length > 0 });
    if (md.kind === "title") {
      flush();
      if (!title) title = md.value;
      continue;
    }
    if (md.kind === "h2") {
      flush();
      blocks.push({ type: "h2", text: md.value });
      continue;
    }
    if (md.kind === "h3") {
      flush();
      blocks.push({ type: "h3", text: md.value });
      continue;
    }
    if (md.kind === "ul") {
      pushList("ul", md.value);
      continue;
    }
    if (md.kind === "ol") {
      pushList("ol", md.value);
      continue;
    }
    if (md.kind === "quote") {
      flush();
      blocks.push({ type: "quote", text: md.value });
      continue;
    }

    flush();
    blocks.push({ type: "p", text: stripInlineMarkdown(text) });

    if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(text)) anomalies.push(text);
  }

  flush();
  return { blocks, title, editorialNotes, anomalies };
}

type Markdown =
  | { kind: "title"; value: string }
  | { kind: "h2"; value: string }
  | { kind: "h3"; value: string }
  | { kind: "ul"; value: string }
  | { kind: "ol"; value: string }
  | { kind: "quote"; value: string }
  | { kind: "p"; value: string };

function detectMarkdown(
  text: string,
  ctx: { title: string | null; hasBlocks: boolean },
): Markdown {
  if (text.startsWith("### ")) return { kind: "h3", value: stripInlineMarkdown(text.slice(4)) };
  if (text.startsWith("## ")) return { kind: "h2", value: stripInlineMarkdown(text.slice(3)) };
  if (text.startsWith("# ")) {
    const value = stripInlineMarkdown(text.slice(2));
    if (!ctx.title && !ctx.hasBlocks) return { kind: "title", value };
    return { kind: "h2", value };
  }
  if (/^[-\u2022*]\s+/.test(text))
    return { kind: "ul", value: stripInlineMarkdown(text.replace(/^[-\u2022*]\s+/, "")) };
  if (/^\d+[.)]\s+/.test(text))
    return { kind: "ol", value: stripInlineMarkdown(text.replace(/^\d+[.)]\s+/, "")) };
  if (text.startsWith("> ")) return { kind: "quote", value: stripInlineMarkdown(text.slice(2)) };
  return { kind: "p", value: text };
}

export function blocksToPlainText(blocks: ContentBlock[]): string {
  const parts = blocks.map((b) => {
    switch (b.type) {
      case "p":
      case "h2":
      case "h3":
      case "quote":
        return b.text;
      case "ul":
      case "ol":
        return b.items.join(" ");
      case "table":
        return [...b.headers, ...b.rows.flat()].join(" ");
      case "faq":
        return b.items.map((i) => `${i.question} ${i.answer}`).join(" ");
      case "image":
        return b.alt;
      case "cta":
        return b.label ?? b.category;
      default:
        return "";
    }
  });
  return parts.join(" ").trim();
}

export interface ImportCandidate {
  slug: string;
  title: string;
  excerpt: string;
  blocks: ContentBlock[];
  wordCount: number;
  thin: boolean;
  editorialNotes: string[];
  anomalies: string[];
}

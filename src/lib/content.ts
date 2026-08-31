import type { AffiliateCategory } from "@prisma/client";

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "cta"; label?: string; category: AffiliateCategory; destinationId?: string; destinationSlug?: string; placement?: string }
  | { type: "hotels"; title?: string; destinationId?: string }
  | { type: "activities"; title?: string; destinationId?: string }
  | { type: "products"; title?: string; category?: string }
  | { type: "affiliate_link"; linkId: string; label?: string }
  | { type: "faq"; items: { question: string; answer: string }[] };

export function parseContentBlocks(content: string): ContentBlock[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed as ContentBlock[];
    if (parsed && Array.isArray(parsed.blocks)) return parsed.blocks as ContentBlock[];
    return [];
  } catch {
    // Fallback: treat the raw content as a single markdown-style document.
    return parseLegacyContent(content);
  }
}

function parseLegacyContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = content.split("\n");
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flush = () => {
    if (list.length) {
      blocks.push({ type: listType === "ol" ? "ol" : "ul", items: list });
      list = [];
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3) });
    } else if (line.startsWith("### ")) {
      flush();
      blocks.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("- ")) {
      if (listType && listType !== "ul") flush();
      listType = "ul";
      list.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      if (listType && listType !== "ol") flush();
      listType = "ol";
      list.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.startsWith("> ")) {
      flush();
      blocks.push({ type: "quote", text: line.slice(2) });
    } else {
      flush();
      blocks.push({ type: "p", text: line });
    }
  }
  flush();
  return blocks;
}

export function blocksToText(blocks: ContentBlock[]): string {
  const texts = blocks.map((b) => {
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
      case "cta":
        return b.label ?? b.category;
      case "image":
        return b.alt;
      default:
        return "";
    }
  });
  return texts.join(" ");
}
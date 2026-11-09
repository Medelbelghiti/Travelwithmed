import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readingTimeFromBlocks, tocAnchorId, type ContentBlock } from "../src/lib/content";

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

describe("readingTimeFromBlocks", () => {
  it("never returns less than one minute", () => {
    assert.equal(readingTimeFromBlocks([]), 1);
    assert.equal(readingTimeFromBlocks([{ type: "p", text: "short" } as ContentBlock]), 1);
  });

  it("counts lists, tables and FAQs, not only paragraphs", () => {
    const blocks = [
      { type: "p", text: words(220) },
      { type: "ul", items: [words(110), words(110)] },
      { type: "table", headers: ["a"], rows: [[words(219)]] },
      { type: "faq", items: [{ question: "q", answer: words(100) }] },
    ] as unknown as ContentBlock[];
    // 220 + 220 + (1 + 219) + (1 + 100) = 761 words at 220 wpm -> 4 minutes (rounded up)
    assert.equal(readingTimeFromBlocks(blocks), 4);
  });
});

describe("table of contents anchors", () => {
  it("numbers anchors by h2 position", () => {
    assert.equal(tocAnchorId(0), "section-0");
    assert.equal(tocAnchorId(3), "section-3");
  });

  it("renderer and article page both use the shared helper", () => {
    const renderer = readFileSync(join(__dirname, "../src/components/content-renderer.tsx"), "utf8");
    const page = readFileSync(join(__dirname, "../src/app/articles/[slug]/page.tsx"), "utf8");
    // Regression: the renderer used the block index, so TOC links pointed at the wrong ids.
    assert.match(renderer, /id=\{tocAnchorId\(h2Index\+\+\)\}/);
    assert.match(page, /tocAnchorId\(i\)/);
    assert.doesNotMatch(renderer, /id=\{`section-\$\{i\}`\}/);
  });
});

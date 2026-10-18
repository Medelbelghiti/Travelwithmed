import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  convertParagraphs,
  countWords,
  blocksToPlainText,
  MIN_WORDS,
  type SourceParagraph,
} from "../src/lib/source-import";
import { parseContentBlocks, blocksToText, type ContentBlock } from "../src/lib/content";

const SEP = "\u00B7"; // MIDDLE DOT
const EN_DASH = "\u2013";

describe("convertParagraphs - Word styles", () => {
  it("takes Heading1 as the title and never emits it as a block", () => {
    const res = convertParagraphs([
      { style: "Heading1", text: "Tirana and the Albanian Riviera" },
      { style: "", text: "A city-to-sea itinerary." },
    ]);
    assert.equal(res.title, "Tirana and the Albanian Riviera");
    assert.equal(res.blocks.length, 1);
    assert.equal(res.blocks[0]!.type, "p");
  });

  it("maps Heading2/Heading3 and splits Number/Bullet runs into one list each", () => {
    const res = convertParagraphs([
      { style: "Heading2", text: "Best time to go" },
      { style: "ListNumber", text: "First day" },
      { style: "ListNumber", text: "Second day" },
      { style: "ListBullet", text: "Pack layers" },
      { style: "Heading3", text: "Packing" },
    ]);
    const types = res.blocks.map((b) => b.type);
    assert.deepEqual(types, ["h2", "ol", "ul", "h3"]);
    const ol = res.blocks[1] as Extract<ContentBlock, { type: "ol" }>;
    assert.deepEqual(ol.items, ["First day", "Second day"]);
  });

  it("treats ListBullet as a list item even with no glyph in the text", () => {
    const res = convertParagraphs([{ style: "ListBullet", text: "Item one" }]);
    assert.equal(res.blocks.length, 1);
    assert.equal(res.blocks[0]!.type, "ul");
    const ul = res.blocks[0] as Extract<ContentBlock, { type: "ul" }>;
    assert.deepEqual(ul.items, ["Item one"]);
  });

  it("drops a glyph the extractor already left on a ListBullet item", () => {
    const res = convertParagraphs([{ style: "ListBullet", text: "\u2022 Pack layers" }]);
    const ul = res.blocks[0] as Extract<ContentBlock, { type: "ul" }>;
    assert.deepEqual(ul.items, ["Pack layers"]);
  });

  it("flushes a running list when a non-list block arrives", () => {
    const res = convertParagraphs([
      { style: "ListBullet", text: "Item one" },
      { style: "", text: "Paragraph" },
      { style: "ListBullet", text: "Item two" },
    ]);
    assert.deepEqual(res.blocks.map((b) => b.type), ["ul", "p", "ul"]);
  });

  it("keeps Quote distinct from paragraphs", () => {
    const res = convertParagraphs([{ style: "Quote", text: "Clear Ionian water." }]);
    assert.equal(res.blocks[0]!.type, "quote");
  });
});

describe("convertParagraphs - markdown fallback", () => {
  it("takes the leading # as title, ## as h2, ### as h3", () => {
    const res = convertParagraphs([
      { style: "", text: "# Best Summer Holiday" },
      { style: "", text: "Intro paragraph." },
      { style: "", text: "## 1. Greece" },
      { style: "", text: "### What to Wear in Greece" },
    ]);
    assert.equal(res.title, "Best Summer Holiday");
    assert.deepEqual(res.blocks.map((b) => b.type), ["p", "h2", "h3"]);
  });

  it("treats a later # as h2, not as a second title", () => {
    const res = convertParagraphs([
      { style: "", text: "# Title" },
      { style: "", text: "# Later heading" },
    ]);
    assert.equal(res.title, "Title");
    assert.equal(res.blocks[0]!.type, "h2");
  });

  it("groups consecutive - items into one ul and 1. items into one ol", () => {
    const res = convertParagraphs([
      { style: "", text: "- Pack light" },
      { style: "", text: "- Book early" },
      { style: "", text: "1. Land" },
      { style: "", text: "2. Sleep" },
    ]);
    assert.deepEqual(res.blocks.map((b) => b.type), ["ul", "ol"]);
    const ul = res.blocks[0] as Extract<ContentBlock, { type: "ul" }>;
    assert.deepEqual(ul.items, ["Pack light", "Book early"]);
  });

  it("strips ** so nothing renders as literal markdown", () => {
    const res = convertParagraphs([
      { style: "", text: "**Getting there:** Direct flights run around 3.5-4 hours." },
    ]);
    assert.equal(res.blocks[0]!.type, "p");
    const text = (res.blocks[0] as Extract<ContentBlock, { type: "p" }>).text;
    assert.equal(text, "Getting there: Direct flights run around 3.5-4 hours.");
    assert.ok(!text.includes("**"));
  });
});

describe("convertParagraphs - editorial notes", () => {
  it("strips Image sources and Publishing note out of the body", () => {
    const res = convertParagraphs([
      { style: "", text: "Real paragraph." },
      { style: "", text: "Image sources: Tirana image: Nomads Travel Guide. Confirm reuse or licensing terms with the original source before commercial publication." },
      { style: "", text: "Publishing note: Verify current entry rules before publication." },
    ]);
    assert.equal(res.blocks.length, 1);
    assert.equal(res.editorialNotes.length, 2);
    assert.ok(res.editorialNotes[0]!.startsWith("Image sources:"));
  });

  it("keeps a reader-facing line that merely mentions image sources", () => {
    const res = convertParagraphs([
      { style: "", text: "Where to see the best images in the city." },
    ]);
    assert.equal(res.blocks.length, 1);
    assert.equal(res.editorialNotes.length, 0);
  });
});

describe("convertParagraphs - text repair", () => {
  it("inserts the missing space at a Word run boundary", () => {
    const res = convertParagraphs([
      { style: "", text: "Best forTravelers who want one trip." },
    ]);
    const p = res.blocks[0] as Extract<ContentBlock, { type: "p" }>;
    assert.equal(p.text, "Best for Travelers who want one trip.");
  });

  it("collapses collapsed whitespace without duplicating an existing separator", () => {
    const res = convertParagraphs([
      { style: "", text: `01 / Albania   ${SEP}   7-10 days   ${SEP}   city + coast` },
    ]);
    const p = res.blocks[0] as Extract<ContentBlock, { type: "p" }>;
    assert.equal(p.text, `01 / Albania ${SEP} 7-10 days ${SEP} city + coast`);
    assert.ok(!p.text.includes("  "));
  });

  it("merges a mixed separator run into a single mark", () => {
    const res = convertParagraphs([
      { style: "", text: `01 / Albania   ${SEP}   ${EN_DASH}   7-10 days` },
    ]);
    const p = res.blocks[0] as Extract<ContentBlock, { type: "p" }>;
    assert.equal(p.text, `01 / Albania ${SEP} 7-10 days`);
  });

  it("does not split hyphenated numbers or words", () => {
    const res = convertParagraphs([
      { style: "", text: "Allow 7-10 days; flights are 3.5-4 hours." },
    ]);
    const p = res.blocks[0] as Extract<ContentBlock, { type: "p" }>;
    assert.equal(p.text, "Allow 7-10 days; flights are 3.5-4 hours.");
  });

  it("leaves normal lowercase-uppercase sequences alone", () => {
    const res = convertParagraphs([{ style: "", text: "The Iberian coast" }]);
    const p = res.blocks[0] as Extract<ContentBlock, { type: "p" }>;
    assert.equal(p.text, "The Iberian coast");
  });
});

describe("round-trip through parseContentBlocks", () => {
  it("survives serialise then parse for a representative document", () => {
    const res = convertParagraphs([
      { style: "Heading1", text: "Title" },
      { style: "", text: "Intro." },
      { style: "Heading2", text: "Section" },
      { style: "ListNumber", text: "One" },
      { style: "ListNumber", text: "Two" },
      { style: "ListBullet", text: "Note" },
      { style: "Quote", text: "A quote." },
    ]);
    const round = parseContentBlocks(JSON.stringify(res.blocks));
    assert.equal(round.length, res.blocks.length);
    assert.equal(blocksToText(round), blocksToText(res.blocks));
  });

  it("emits no blocks the parser would drop", () => {
    const res = convertParagraphs([
      { style: "", text: "- a" },
      { style: "", text: "- b" },
      { style: "", text: "## H" },
    ]);
    // The two bullets coalesce into one ul, so two blocks total.
    assert.equal(res.blocks.length, 2);
    assert.equal(parseContentBlocks(JSON.stringify(res.blocks)).length, 2);
  });
});

describe("countWords / blocksToPlainText", () => {
  it("counts whitespace-delimited words", () => {
    assert.equal(countWords("one two  three"), 3);
    assert.equal(countWords("   "), 0);
  });

  it("reads text out of the block kinds that carry it", () => {
    const text = blocksToPlainText([
      { type: "p", text: "body" },
      { type: "h2", text: "heading" },
      { type: "ul", items: ["a", "b"] },
      { type: "ol", items: ["c"] },
    ]);
    assert.equal(text, "body heading a b c");
  });
});

describe("source documents (when extracted)", () => {
  const SRC = join(import.meta.dirname, "..", "tmp", "import");
  const SKIP = !existsSync(join(SRC, "doc01.json"));

  const read = (file: string): SourceParagraph[] => {
    const raw = JSON.parse(readFileSync(join(SRC, file), "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(raw) ? raw : (raw.paragraphs ?? []);
  };

  const ALL = ["doc01", "doc02", "doc03", "doc04", "doc05", "doc06", "doc07", "doc08", "doc09", "doc10", "doc11"];
  const PUBLISHABLE = ["doc01", "doc02", "doc03", "doc04"];

  it("produces 4 publishable articles and 7 thin ones", { skip: SKIP }, () => {
    const rows = ALL.map((id) => {
      const res = convertParagraphs(read(`${id}.json`));
      return { id, words: countWords(blocksToPlainText(res.blocks)) };
    });

    const publishable = rows.filter((r) => r.words >= MIN_WORDS).map((r) => r.id);
    const thin = rows.filter((r) => r.words < MIN_WORDS).map((r) => r.id);

    assert.deepEqual(publishable, PUBLISHABLE);
    assert.equal(thin.length, 7);
  });

  it("parses every publishable document into a valid, markup-free payload", { skip: SKIP }, () => {
    for (const id of PUBLISHABLE) {
      const res = convertParagraphs(read(`${id}.json`));
      assert.ok(res.title, `${id} has no title`);
      assert.ok(res.blocks.length > 0, `${id} has no blocks`);

      const round = parseContentBlocks(JSON.stringify(res.blocks));
      assert.equal(round.length, res.blocks.length, `${id} lost blocks on round-trip`);

      const text = blocksToPlainText(res.blocks);
      assert.ok(!text.includes("**"), `${id} kept markdown emphasis`);
      assert.ok(!/(^|\s)#{1,3}\s/.test(text), `${id} kept a markdown heading`);
      assert.ok(!/\bundefined\b|\bNaN\b|\[object Object\]/.test(text), `${id} leaked a placeholder`);
      assert.ok(!/Best forTravelers/.test(text), `${id} kept an unpatched run boundary`);

      assert.equal(res.anomalies.length, 0, `${id} flagged anomalies`);
    }
  });

  it("keeps the author's licensing and verification notes out of the reader-facing text", { skip: SKIP }, () => {
    for (const id of ["doc01", "doc02", "doc03"]) {
      const res = convertParagraphs(read(`${id}.json`));
      const text = blocksToPlainText(res.blocks).toLowerCase();
      assert.ok(!text.includes("confirm reuse or licensing"), `${id} leaked an image-sources note`);
      assert.ok(!text.includes("publishing note:"), `${id} leaked a publishing note`);
      assert.ok(res.editorialNotes.length > 0, `${id} lost its notes entirely`);
    }
  });

  it("extracts at least 600 words and an H2 structure from each publishable article", { skip: SKIP }, () => {
    for (const id of PUBLISHABLE) {
      const res = convertParagraphs(read(`${id}.json`));
      assert.ok(countWords(blocksToPlainText(res.blocks)) >= MIN_WORDS, `${id} under ${MIN_WORDS} words`);
      const h2 = res.blocks.filter((b) => b.type === "h2").length;
      assert.ok(h2 >= 3, `${id} has only ${h2} h2`);
    }
  });
});

/**
 * Convert the extracted source documents into ContentBlock[] payloads.
 *
 *   npm run import:convert            -> dry-run, prints a report
 *   npm run import:convert -- --write -> writes tmp/import/*.blocks.json
 *
 * Reads only from tmp/import/ (produced by scripts/extract-docx.ps1).
 * Never touches the database - see prisma/import-source-articles.ts for that.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { convertParagraphs, countWords, blocksToPlainText, MIN_WORDS, type SourceParagraph } from "../src/lib/source-import";
import { parseContentBlocks } from "../src/lib/content";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "tmp", "import");
const WRITE = process.argv.includes("--write");

/** Targets to attempt once credentials are available. All DRAFT, none published. */
const TARGETS: Record<string, { slug: string; destination?: string }> = {
  doc01: { slug: "albania-tirana-albanian-riviera", destination: "albania" },
  doc02: { slug: "azores-hidden-islands-nature-lovers", destination: "azores" },
  doc03: { slug: "georgia-tbilisi-caucasus", destination: "georgia" },
  doc04: { slug: "best-summer-holiday-destinations" },
};


function main() {
  if (!existsSync(SRC)) {
    console.error(`missing ${SRC} - run scripts/extract-docx.ps1 first`);
    process.exit(1);
  }

  const files = readdirSync(SRC).filter((f) => /^doc\d+\.json$/.test(f)).sort();
  if (files.length === 0) {
    console.error("no docNN.json found");
    process.exit(1);
  }

  const rows: {
    id: string; title: string; words: number; blocks: number;
    thin: boolean; notes: number; anomalies: number; headings: number;
  }[] = [];

  for (const file of files) {
    const id = file.replace(".json", "");
    // PowerShell wrote the extraction as UTF-8 with BOM; JSON.parse rejects it.
    const raw = JSON.parse(readFileSync(join(SRC, file), "utf8").replace(/^\uFEFF/, ""));
    const paragraphs: SourceParagraph[] = Array.isArray(raw) ? raw : (raw.paragraphs ?? []);
    const res = convertParagraphs(paragraphs);
    if (!res.title) {
      rows.push({ id, title: "(no title)", words: 0, blocks: 0, thin: true, notes: res.editorialNotes.length, anomalies: res.anomalies.length, headings: 0 });
      continue;
    }

    const words = countWords(blocksToPlainText(res.blocks));
    const headings = res.blocks.filter((b) => b.type === "h2").length;

    // Round-trip guard: the parser must read back exactly what we emitted.
    const roundTrip = parseContentBlocks(JSON.stringify(res.blocks));
    if (roundTrip.length !== res.blocks.length) {
      throw new Error(`${file}: round-trip lost blocks ${res.blocks.length} -> ${roundTrip.length}`);
    }

    rows.push({
      id,
      title: res.title,
      words,
      blocks: res.blocks.length,
      thin: words < MIN_WORDS,
      notes: res.editorialNotes.length,
      anomalies: res.anomalies.length,
      headings,
    });

    if (WRITE) {
      const target = TARGETS[id];
      writeFileSync(
        join(SRC, `${id}.blocks.json`),
        JSON.stringify(
          {
            id,
            slug: target?.slug ?? res.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
            destination: target?.destination ?? null,
            title: res.title,
            blocks: res.blocks,
            wordCount: words,
            thin: words < MIN_WORDS,
            editorialNotes: res.editorialNotes,
            anomalies: res.anomalies,
            published: false,
            status: "DRAFT",
          },
          null,
          2,
        ),
        "utf8",
      );
    }
  }

  console.log("\nid      words   h2  blocks  thin  notes  anoms  title");
  console.log("      ------  ---  ------  ----  -----  -----  ----");
  for (const r of rows) {
    console.log(
      `${r.id.padEnd(7)} ${String(r.words).padStart(6)}  ${String(r.headings).padStart(3)}  ${String(r.blocks).padStart(6)}  ` +
        `${(r.thin ? "Y" : "-").padStart(4)}  ${String(r.notes).padStart(5)}  ${String(r.anomalies).padStart(5)}  ${r.title}`,
    );
  }

  const publishable = rows.filter((r) => !r.thin);
  const thin = rows.filter((r) => r.thin);
  const anomalies = rows.filter((r) => r.anomalies > 0);

  console.log(`\npublishable : ${publishable.length} -> ${publishable.map((r) => r.id).join(", ") || "-"}`);
  console.log(`thin        : ${thin.length}    -> ${thin.map((r) => r.id).join(", ") || "-"}  (NEEDS_MY_INPUT)`);
  console.log(`anomalies   : ${anomalies.length} -> ${anomalies.map((r) => r.id).join(", ") || "-"}  (manual review)`);
  console.log(`\n${WRITE ? "wrote tmp/import/*.blocks.json (status DRAFT, published: false)" : "dry-run - add --write to emit payloads"}`);
}

main();

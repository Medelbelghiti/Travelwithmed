"use client";

import { useState } from "react";
import { Plus, Trash2, MoveUp, MoveDown, GripVertical } from "lucide-react";
import type { ContentBlock } from "@/lib/content";
import type { AffiliateCategory } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface BlockEditorProps {
  initialBlocks: ContentBlock[];
  onChange: (blocks: ContentBlock[], json: string) => void;
}

const ADDABLE: { type: ContentBlock["type"]; label: string }[] = [
  { type: "h2", label: "Heading 2" },
  { type: "h3", label: "Heading 3" },
  { type: "p", label: "Paragraph" },
  { type: "ul", label: "Bullet list" },
  { type: "ol", label: "Numbered list" },
  { type: "quote", label: "Quote" },
  { type: "table", label: "Table" },
  { type: "image", label: "Image" },
  { type: "cta", label: "Affiliate CTA" },
  { type: "hotels", label: "Hotels grid" },
  { type: "activities", label: "Activities grid" },
  { type: "products", label: "Products grid" },
  { type: "affiliate_link", label: "Affiliate button" },
  { type: "faq", label: "FAQ block" },
];

export function BlockEditor({ initialBlocks, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);

  const commit = (next: ContentBlock[]) => {
    setBlocks(next);
    onChange(next, JSON.stringify(next));
  };

  const addBlock = (type: ContentBlock["type"]) => {
    const defaults: Record<ContentBlock["type"], ContentBlock> = {
      p: { type: "p", text: "" },
      h2: { type: "h2", text: "" },
      h3: { type: "h3", text: "" },
      ul: { type: "ul", items: [""] },
      ol: { type: "ol", items: [""] },
      quote: { type: "quote", text: "" },
      image: { type: "image", src: "", alt: "" },
      table: { type: "table", headers: [""], rows: [[""]] },
      cta: { type: "cta", category: "HOTELS", label: "Check prices", placement: "article" },
      hotels: { type: "hotels", title: "Where to stay" },
      activities: { type: "activities", title: "Book these experiences" },
      products: { type: "products", title: "Recommended gear" },
      affiliate_link: { type: "affiliate_link", linkId: "", label: "Check prices" },
      faq: { type: "faq", items: [{ question: "", answer: "" }] },
    };
    commit([...blocks, defaults[type]]);
  };

  const updateBlock = (index: number, patch: Partial<ContentBlock>) => {
    const next = blocks.map((b, i) => (i === index ? ({ ...b, ...patch } as ContentBlock) : b));
    commit(next);
  };

  const setList = (index: number, field: "items", listIndex: number, value: string) => {
    const block = blocks[index];
    if (block.type !== "ul" && block.type !== "ol") return;
    const items = [...block.items];
    items[listIndex] = value;
    updateBlock(index, { items } as Partial<ContentBlock>);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const remove = (index: number) => {
    commit(blocks.filter((_, i) => i !== index));
  };

  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand";

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <BlockEditorItem
          key={`block-${index}`}
          block={block}
          inputClass={inputClass}
          onChange={(patch) => updateBlock(index, patch)}
          onListChange={(listIndex, value) => setList(index, "items", listIndex, value)}
          onMove={(dir) => move(index, dir)}
          onRemove={() => remove(index)}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
        />
      ))}

      {blocks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-sand p-8 text-center">
          <p className="text-sm text-ink-muted">No content blocks yet. Add your first block below.</p>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-sand p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Add a block</p>
        <div className="flex flex-wrap gap-2">
          {ADDABLE.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => addBlock(option.type)}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand"
            >
              <Plus className="h-3 w-3" aria-hidden />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockEditorItem({
  block,
  inputClass,
  onChange,
  onListChange,
  onMove,
  onRemove,
  isFirst,
  isLast,
}: {
  block: ContentBlock;
  inputClass: string;
  onChange: (patch: Partial<ContentBlock>) => void;
  onListChange: (index: number, value: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const typeLabel = ADDABLE.find((a) => a.type === block.type)?.label ?? block.type;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-ink-muted/40" aria-hidden />
        <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-dark">{typeLabel}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton onClick={() => onMove(-1)} disabled={isFirst} label="Move up" icon="up" />
          <ToolbarButton onClick={() => onMove(1)} disabled={isLast} label="Move down" icon="down" />
          <ToolbarButton onClick={onRemove} label="Delete" icon="trash" danger />
        </div>
      </div>

      <BlockFields
        block={block}
        inputClass={inputClass}
        onChange={onChange}
        onListChange={onListChange}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: "up" | "down" | "trash";
  danger?: boolean;
}) {
  const Icon = icon === "up" ? MoveUp : icon === "down" ? MoveDown : Trash2;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "rounded-lg p-1.5 transition-colors",
        danger ? "text-ink-muted hover:bg-danger/10 hover:text-danger" : "text-ink-muted hover:bg-sand hover:text-ink",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold text-ink-muted">{children}</label>;
}

function BlockFields({
  block,
  inputClass,
  onChange,
  onListChange,
}: {
  block: ContentBlock;
  inputClass: string;
  onChange: (patch: Partial<ContentBlock>) => void;
  onListChange: (i: number, v: string) => void;
}) {
  switch (block.type) {
    case "p":
    case "h2":
    case "h3":
    case "quote":
      return (
        <div>
          <SmallLabel>{block.type === "quote" ? "Quote text" : "Text"}</SmallLabel>
          {block.type === "p" ? (
            <textarea value={block.text} onChange={(e) => onChange({ text: e.target.value })} rows={3} className={inputClass} />
          ) : (
            <input value={block.text} onChange={(e) => onChange({ text: e.target.value })} className={inputClass} />
          )}
        </div>
      );
    case "ul":
    case "ol":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SmallLabel>{block.type === "ul" ? "Bullet list items" : "Numbered list items"}</SmallLabel>
            <button
              type="button"
              onClick={() => onChange({ items: [...block.items, ""] } as Partial<ContentBlock>)}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-light"
            >
              + Add item
            </button>
          </div>
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input value={item} onChange={(e) => onListChange(i, e.target.value)} className={inputClass} />
              {block.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange({ items: block.items.filter((_, j) => j !== i) } as Partial<ContentBlock>)}
                  className="rounded-lg p-2 text-ink-muted hover:text-danger"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>
      );
    case "image":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <SmallLabel>Image URL</SmallLabel>
            <input value={block.src} onChange={(e) => onChange({ src: e.target.value })} placeholder="https://…" className={inputClass} />
          </div>
          <div>
            <SmallLabel>Alt text</SmallLabel>
            <input value={block.alt} onChange={(e) => onChange({ alt: e.target.value })} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <SmallLabel>Caption (optional)</SmallLabel>
            <input value={block.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} className={inputClass} />
          </div>
        </div>
      );
    case "table":
      return (
        <div className="space-y-3">
          <div>
            <SmallLabel>Headers (comma separated)</SmallLabel>
            <input value={block.headers.join(", ")} onChange={(e) => onChange({ headers: e.target.value.split(",").map((h) => h.trim()) })} className={inputClass} />
          </div>
          {block.rows.map((row, r) => (
            <div key={r}>
              <div className="mb-1 flex items-center justify-between">
                <SmallLabel>Row {r + 1}</SmallLabel>
                {block.rows.length > 1 && (
                  <button type="button" onClick={() => onChange({ rows: block.rows.filter((_, j) => j !== r) })} className="rounded-lg px-2 py-0.5 text-xs font-semibold text-danger hover:bg-danger/10">
                    Remove
                  </button>
                )}
              </div>
              <input value={row.join(" | ")} onChange={(e) => { const next = [...block.rows]; next[r] = e.target.value.split("|").map((c) => c.trim()); onChange({ rows: next }); }} className={inputClass} />
            </div>
          ))}
          <button type="button" onClick={() => onChange({ rows: [...block.rows, [""]] })} className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-light">
            + Add row
          </button>
        </div>
      );
    case "cta":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <SmallLabel>Button label</SmallLabel>
            <input value={block.label ?? "Check prices"} onChange={(e) => onChange({ label: e.target.value })} className={inputClass} />
          </div>
          <div>
            <SmallLabel>Category</SmallLabel>
            <select value={block.category} onChange={(e) => onChange({ category: e.target.value as AffiliateCategory })} className={inputClass}>
              {["HOTELS", "FLIGHTS", "ACTIVITIES", "CAR_RENTAL", "INSURANCE", "ESIM", "TRAVEL_GEAR", "AIRPORT_TRANSFERS"].map((c) => (
                <option key={c} value={c}>{c.replace("_", " ").toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <SmallLabel>Destination ID (optional)</SmallLabel>
            <input value={block.destinationId ?? ""} onChange={(e) => onChange({ destinationId: e.target.value || undefined })} placeholder="Leave empty to auto-match" className={inputClass} />
          </div>
          <div>
            <SmallLabel>Placement name</SmallLabel>
            <input value={block.placement ?? "article"} onChange={(e) => onChange({ placement: e.target.value })} className={inputClass} />
          </div>
        </div>
      );
    case "hotels":
    case "activities":
    case "products":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SmallLabel>Section title</SmallLabel>
            <input value={block.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} />
          </div>
          {(block.type === "hotels" || block.type === "activities") && (
            <div className="sm:col-span-2">
              <SmallLabel>Destination ID (optional)</SmallLabel>
              <input value={block.destinationId ?? ""} onChange={(e) => onChange({ destinationId: e.target.value || undefined })} placeholder="Leave empty to use article destination" className={inputClass} />
            </div>
          )}
          {block.type === "products" && (
            <div className="sm:col-span-2">
              <SmallLabel>Product category (optional)</SmallLabel>
              <input value={block.category ?? ""} onChange={(e) => onChange({ category: e.target.value })} placeholder="e.g. Backpacks, Luggage" className={inputClass} />
            </div>
          )}
        </div>
      );
    case "affiliate_link":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <SmallLabel>Affiliate link ID</SmallLabel>
            <input value={block.linkId} onChange={(e) => onChange({ linkId: e.target.value })} className={inputClass} />
          </div>
          <div>
            <SmallLabel>Button label</SmallLabel>
            <input value={block.label ?? "Check prices"} onChange={(e) => onChange({ label: e.target.value })} className={inputClass} />
          </div>
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-line bg-sand/60 p-3">
              <div className="flex items-center justify-between">
                <SmallLabel>Question {i + 1}</SmallLabel>
                {block.items.length > 1 && (
                  <button type="button" onClick={() => onChange({ items: block.items.filter((_, j) => j !== i) })} className="rounded-lg px-2 py-0.5 text-xs font-semibold text-danger hover:bg-danger/10">
                    Remove
                  </button>
                )}
              </div>
              <input value={item.question} onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], question: e.target.value }; onChange({ items }); }} placeholder="Question" className={inputClass} />
              <div className="mt-2">
                <SmallLabel>Answer</SmallLabel>
                <textarea value={item.answer} onChange={(e) => { const items = [...block.items]; items[i] = { ...items[i], answer: e.target.value }; onChange({ items }); }} rows={2} className={inputClass} />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ items: [...block.items, { question: "", answer: "" }] })} className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-light">
            + Add FAQ
          </button>
        </div>
      );
    default:
      return null;
  }
}
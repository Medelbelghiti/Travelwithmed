"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

type ServerAction = (prev: { error?: string } | void, formData: FormData) => Promise<{ error?: string } | void>;

export interface EntityEditField {
  name: string;
  label: string;
  type?: string;
  step?: string;
  textarea?: boolean;
}

export interface EntityEditFormProps {
  entity: string;
  action: ServerAction;
  id: string;
  groups: EntityEditField[][];
  row: Record<string, unknown>;
}

export function EntityEditForm({ entity, action, id, groups, row }: EntityEditFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand";
  const L = "mb-1.5 block text-sm font-medium text-ink-soft";

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <input type="hidden" name="id" value={id} />
      {groups.map((group, gi) => (
        <section key={gi} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className={`grid gap-4 ${group.some((f) => f.textarea) ? "" : "sm:grid-cols-2"}`}>
            {group.map((field) => (
              <div key={field.name} className={field.textarea ? "sm:col-span-2" : ""}>
                <label htmlFor={`edit-${entity}-${field.name}`} className={L}>
                  {field.label}
                </label>
                {field.textarea ? (
                  <textarea
                    id={`edit-${entity}-${field.name}`}
                    name={field.name}
                    rows={4}
                    defaultValue={(row[field.name] as string | undefined) ?? ""}
                    className={inputClass}
                  />
                ) : (
                  <input
                    id={`edit-${entity}-${field.name}`}
                    name={field.name}
                    type={field.type ?? "text"}
                    step={field.step}
                    defaultValue={(row[field.name] as string | undefined) ?? ""}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        <Save className="h-4 w-4" aria-hidden />
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

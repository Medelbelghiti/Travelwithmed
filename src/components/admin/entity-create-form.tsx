"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";

type ServerAction = (prev: { error?: string } | void, formData: FormData) => Promise<{ error?: string } | void>;

interface Field {
  name: string;
  label: string;
  type?: string;
}

export interface EntityCreateFormProps {
  entity: string;
  action: ServerAction;
  fields: Field[];
  destinations: { id: string; name: string }[];
}

export function EntityCreateForm({ entity, action, fields, destinations }: EntityCreateFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand";

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input type="hidden" name="id" value="" />
      {fields.map((field) => (
        <div key={field.name}>
          <label htmlFor={`create-${entity}-${field.name}`} className="mb-1 block text-sm font-medium text-ink-soft">
            {field.label}
          </label>
          {field.name === "type" ? (
            <select id={`create-${entity}-${field.name}`} name={field.name} className={inputClass} defaultValue="content">
              {["content", "travel_style", "planning"].map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          ) : (
            <input id={`create-${entity}-${field.name}`} name={field.name} required={field.name === "name"} className={inputClass} />
          )}
        </div>
      ))}
      {destinations.length > 0 && (
        <div>
          <label htmlFor={`create-${entity}-dest`} className="mb-1 block text-sm font-medium text-ink-soft">
            Destination
          </label>
          <select id={`create-${entity}-dest`} name="destinationId" className={inputClass} defaultValue="">
            <option value="">None</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        <Save className="h-4 w-4" aria-hidden />
        {pending ? "Saving…" : "Create"}
      </button>
    </form>
  );
}
"use client";

import { useEffect, useState } from "react";

export function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent" />
    </div>
  );
}

export function FieldTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent" />
    </div>
  );
}

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function FieldCommaInput({
  label,
  values,
  onParsedChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onParsedChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState((values || []).join(", "));

  useEffect(() => {
    setDraft((values || []).join(", "));
  }, [values]);

  const commit = () => {
    onParsedChange(parseCommaSeparated(draft));
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}

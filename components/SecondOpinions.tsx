"use client";

import { useState, useEffect } from "react";
import { SecondOpinion } from "@/lib/types";
import { Avatar } from "./Avatar";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function parseOpinions(raw: string | null): SecondOpinion[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// Read-only display of all second opinions
export function SecondOpinionsList({ opinions }: { opinions: SecondOpinion[] }) {
  if (opinions.length === 0) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontSize: 10, fontWeight: 700, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: 10, fontFamily: "var(--font-mono)",
        }}
      >
        Second Opinions
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opinions.map((op) => (
          <div
            key={op.author}
            style={{
              padding: "12px 14px",
              background: "var(--bg-tint)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Avatar name={op.author} size={22} ring />
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                {capitalize(op.author)}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
                {formatDate(op.updatedAt)}
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
              {op.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Editable textarea for writing/updating your own second opinion
export function SecondOpinionInput({
  author,
  existing,
  onSave,
}: {
  author: string;
  existing: string;
  onSave: (body: string) => Promise<void>;
}) {
  const [text, setText] = useState(existing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(existing);
  }, [existing, author]);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await onSave(text);
    setSaving(false);
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        background: "rgba(255,203,125,0.10)",
        border: "1.5px solid rgba(255,203,125,0.5)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Avatar name={author} size={22} ring />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Your Second Opinion
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your perspective or recommendation…"
        rows={4}
        style={{
          width: "100%", padding: "10px 12px",
          background: "var(--bg-surface)",
          border: "1.5px solid var(--mb-black)",
          borderRadius: 8, color: "var(--text-primary)",
          fontSize: 13.5, resize: "vertical",
          fontFamily: "inherit", lineHeight: 1.6,
          outline: "none", boxShadow: "0 2px 0 0 var(--mb-black)",
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving || !text.trim()}
        className="btn btn-primary"
        style={{ marginTop: 8 }}
      >
        {saving ? "Saving…" : existing ? "Update Opinion" : "Submit Opinion"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { Person, ALL_PEOPLE } from "@/lib/types";
import { Avatar } from "./Avatar";

type Props = {
  onSelect: (person: Person) => void;
  onClose: () => void;
  exclude?: string[];
  multiSelect?: boolean;
  selected?: string[];
  onToggle?: (person: Person) => void;
  onConfirm?: () => void;
  title: string;
};

export function PersonPicker({
  onSelect,
  onClose,
  exclude = [],
  multiSelect = false,
  selected = [],
  onToggle,
  onConfirm,
  title,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const options = ALL_PEOPLE.filter((p) => !exclude.includes(p.id));

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        zIndex: 200,
        background: "var(--bg-surface)",
        border: "1.5px solid var(--mb-black)",
        borderRadius: 10,
        boxShadow: "0 4px 0 0 var(--mb-black)",
        minWidth: 200,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px 8px",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {title}
      </div>
      {options.map((p) => {
        const isSelected = selected.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => {
              if (multiSelect && onToggle) {
                onToggle(p.id);
              } else {
                onSelect(p.id);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "9px 14px",
              background: isSelected ? "var(--accent-subtle)" : "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => {
              if (!isSelected)
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected)
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <Avatar name={p.id} size={22} />
            <span style={{ flex: 1, color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>
              {p.label}
            </span>
            {multiSelect && (
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: isSelected ? "none" : "1.5px solid var(--border)",
                  background: isSelected ? "var(--accent)" : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "#fff",
                }}
              >
                {isSelected && "✓"}
              </span>
            )}
          </button>
        );
      })}
      {multiSelect && onConfirm && (
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}

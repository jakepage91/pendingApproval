"use client";

import { Item } from "@/lib/types";
import { PriorityDot, TypeBadge } from "./Badges";
import { Avatar } from "./Avatar";

type Props = {
  item: Item;
  selected: boolean;
  onClick: () => void;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ItemRow({ item, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 14px",
        background: selected ? "var(--accent-subtle)" : "transparent",
        border: "none",
        borderLeft: selected ? "3px solid var(--accent)" : "3px solid transparent",
        borderRadius: selected ? "0 10px 10px 0" : "10px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 120ms ease, border-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (!selected)
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        if (!selected)
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <PriorityDot priority={item.priority} />
      <span
        style={{
          flex: 1,
          color: "var(--text-primary)",
          fontSize: "13.5px",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.title}
      </span>
      <TypeBadge type={item.type} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Avatar name={item.submittedBy} size={20} />
        <span style={{ color: "var(--text-secondary)", fontSize: "12px", whiteSpace: "nowrap" }}>
          {capitalize(item.submittedBy)}
        </span>
      </span>
      <span
        style={{
          color: "var(--text-muted)",
          fontSize: "12px",
          whiteSpace: "nowrap",
          minWidth: 48,
          textAlign: "right",
          fontFamily: "var(--font-mono)",
        }}
      >
        {formatDate(item.submittedAt)}
      </span>
    </button>
  );
}

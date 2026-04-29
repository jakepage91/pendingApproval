"use client";

import { useEffect, useState, useCallback } from "react";
import { Item, Status, ItemType, Priority } from "@/lib/types";
import { ItemRow } from "@/components/ItemRow";
import {
  PriorityDot,
  TypeBadge,
  StatusBadge,
  PriorityLabel,
} from "@/components/Badges";
import { Toast, useToast } from "@/components/Toast";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";

type NavSection = "open" | "inprogress" | "decided" | "closed";
type TypeFilter = "all" | ItemType;

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ManagerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [navSection, setNavSection] = useState<NavSection>("open");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/items");
    const data: Item[] = await res.json();
    setItems(data);
  }, []);

  useEffect(() => {
    fetchItems();
    fetch("/api/seed", { method: "POST" }).then(() => fetchItems());
  }, [fetchItems]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const statusMap: Record<NavSection, Status> = {
    open: "open",
    inprogress: "inprogress",
    decided: "decided",
    closed: "closed",
  };

  const counts: Record<NavSection, number> = {
    open: items.filter((i) => i.status === "open").length,
    inprogress: items.filter((i) => i.status === "inprogress").length,
    decided: items.filter((i) => i.status === "decided").length,
    closed: items.filter((i) => i.status === "closed").length,
  };

  const visibleItems = items
    .filter((i) => i.status === statusMap[navSection])
    .filter((i) => typeFilter === "all" || i.type === typeFilter);

  const groupedByPriority =
    navSection === "open"
      ? PRIORITY_ORDER.reduce<Record<Priority, Item[]>>(
          (acc, p) => {
            acc[p] = visibleItems.filter((i) => i.priority === p);
            return acc;
          },
          { urgent: [], high: [], normal: [], low: [] }
        )
      : null;

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  const updateItem = async (
    id: string,
    patch: Partial<{ status: Status; managerResponse: string; closedBy: string }>
  ) => {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await fetchItems();
      return true;
    }
    return false;
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg-base)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
        }}
      >
        <div style={{ padding: "0 18px 20px" }}>
          <div style={{ marginBottom: 10 }}>
            <Logo size={16} />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-tint)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 8,
              padding: "6px 8px",
            }}
          >
            <Avatar name="lorena" size={20} />
            <span style={{ flex: 1, color: "var(--text-primary)", fontSize: 12.5, fontWeight: 600 }}>
              Lorena&rsquo;s Board
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 10px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "0 8px 8px",
            }}
          >
            pendingApproval
          </div>
          {(
            [
              { key: "open", label: "Needs Decision" },
              { key: "inprogress", label: "In Progress" },
              { key: "decided", label: "Decided" },
              { key: "closed", label: "Closed" },
            ] as { key: NavSection; label: string }[]
          ).map(({ key, label }) => {
            const active = navSection === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setNavSection(key);
                  setPanelOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: active ? "var(--accent-subtle)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  marginBottom: 2,
                  transition: "background 100ms",
                }}
              >
                {label}
                <span
                  style={{
                    fontSize: "11px",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active ? "rgba(117,109,243,0.18)" : "var(--bg-tint)",
                    borderRadius: 999,
                    padding: "1px 7px",
                    minWidth: 20,
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Filter bar */}
        <div
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            padding: "14px 28px",
            display: "flex",
            gap: 8,
            flexShrink: 0,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              marginRight: 6,
            }}
          >
            Filter
          </span>
          {(["all", "approval", "question", "design"] as TypeFilter[]).map((f) => {
            const labels: Record<TypeFilter, string> = {
              all: "All",
              approval: "Approvals",
              question: "Questions",
              design: "Design",
            };
            const active = typeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 999,
                  border: `1.5px solid ${active ? "var(--mb-black)" : "var(--border)"}`,
                  background: active ? "var(--mb-yellow)" : "transparent",
                  color: active ? "var(--mb-black)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  boxShadow: active ? "0 2px 0 0 var(--mb-black)" : "none",
                  transition: "all 120ms",
                }}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Content + Panel */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
            <div style={{ padding: "0 28px 16px", display: "flex", alignItems: "baseline", gap: 14 }}>
              <h2 className="display" style={{ fontSize: 28, color: "var(--text-primary)" }}>
                {navSection === "open"
                  ? "Needs Decision"
                  : navSection === "inprogress"
                  ? "In Progress"
                  : navSection === "decided"
                  ? "Decided"
                  : "Closed"}
              </h2>
              <span style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            {visibleItems.length === 0 ? (
              <ManagerEmptyState section={navSection} />
            ) : groupedByPriority && navSection === "open" ? (
              PRIORITY_ORDER.map((p) =>
                groupedByPriority[p].length > 0 ? (
                  <div key={p} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        padding: "8px 28px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <PriorityDot priority={p} />
                      <PriorityLabel priority={p} />
                      <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                        ({groupedByPriority[p].length})
                      </span>
                    </div>
                    <div style={{ padding: "0 16px" }}>
                      {groupedByPriority[p].map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          selected={selectedId === item.id}
                          onClick={() => {
                            setSelectedId(item.id);
                            setPanelOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null
              )
            ) : (
              <div style={{ padding: "0 16px" }}>
                {visibleItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setPanelOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              width: panelOpen ? "min(500px, 55vw)" : 0,
              flexShrink: 0,
              overflowY: "auto",
              overflowX: "hidden",
              background: "var(--bg-surface)",
              borderLeft: panelOpen ? "1px solid var(--border)" : "none",
              transition: "width 150ms ease",
            }}
          >
            {selectedItem && (
              <ManagerDetailPanel
                item={selectedItem}
                onClose={() => setPanelOpen(false)}
                onSaveResponse={async (response) => {
                  const ok = await updateItem(selectedItem.id, { managerResponse: response });
                  if (ok) addToast("Response saved.");
                  else addToast("Failed to save.", "error");
                }}
                onSetStatus={async (status) => {
                  const patch: Parameters<typeof updateItem>[1] = { status };
                  if (status === "closed") patch.closedBy = "lorena";
                  const ok = await updateItem(selectedItem.id, patch);
                  if (ok) {
                    addToast(`Marked as ${status}.`);
                    if (status === "closed") setPanelOpen(false);
                  } else {
                    addToast("Failed to update status.", "error");
                  }
                  await fetchItems();
                }}
              />
            )}
          </div>
        </div>
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function ManagerDetailPanel({
  item,
  onClose,
  onSaveResponse,
  onSetStatus,
}: {
  item: Item;
  onClose: () => void;
  onSaveResponse: (response: string) => Promise<void>;
  onSetStatus: (status: Status) => Promise<void>;
}) {
  const [response, setResponse] = useState(item.managerResponse ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setResponse(item.managerResponse ?? "");
  }, [item.id, item.managerResponse]);

  const handleSave = async () => {
    setSaving(true);
    await onSaveResponse(response);
    setSaving(false);
  };

  return (
    <div style={{ padding: 28, minWidth: 320 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Detail
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 20,
            padding: 4,
          }}
        >
          ×
        </button>
      </div>

      <h2 className="display" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 18, lineHeight: 1.2 }}>
        {item.title}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px 18px",
          marginBottom: 20,
          padding: 16,
          background: "var(--bg-tint)",
          borderRadius: 10,
          border: "1px solid var(--border-subtle)",
        }}
      >
        <MetaField label="Status">
          <StatusBadge status={item.status} />
        </MetaField>
        <MetaField label="Type">
          <TypeBadge type={item.type} />
        </MetaField>
        <MetaField label="Priority">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PriorityDot priority={item.priority} />
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {capitalize(item.priority)}
            </span>
          </span>
        </MetaField>
        <MetaField label="From">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Avatar name={item.submittedBy} size={20} />
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {capitalize(item.submittedBy)}
            </span>
          </span>
        </MetaField>
        <MetaField label="Submitted">
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            {formatDateTime(item.submittedAt)}
          </span>
        </MetaField>
        {item.closedAt && (
          <MetaField label="Closed">
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {formatDateTime(item.closedAt)}
            </span>
          </MetaField>
        )}
      </div>

      <Section label="Context">{item.context}</Section>
      {item.additionalInfo && <Section label="Additional Info">{item.additionalInfo}</Section>}

      {item.status !== "closed" && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
              fontFamily: "var(--font-mono)",
            }}
          >
            Your Response
          </div>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response or decision here…"
            rows={5}
            style={{
              width: "100%",
              padding: 12,
              background: "var(--bg-surface)",
              border: "1.5px solid var(--mb-black)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: 13.5,
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.6,
              outline: "none",
              boxShadow: "0 2px 0 0 var(--mb-black)",
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{ marginTop: 10 }}
          >
            {saving ? "Saving…" : "Save Response"}
          </button>
        </div>
      )}

      {item.managerResponse && item.status === "closed" && (
        <div
          style={{
            marginTop: 20,
            padding: 18,
            background: "var(--mb-yellow-soft)",
            border: "1.5px solid var(--mb-black)",
            borderRadius: 12,
            boxShadow: "0 3px 0 0 var(--mb-black)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Avatar name="lorena" size={22} ring />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--mb-black)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Response
            </span>
          </div>
          <p
            style={{
              color: "var(--mb-black)",
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {item.managerResponse}
          </p>
        </div>
      )}

      {item.status !== "closed" && (
        <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {item.status !== "inprogress" && (
            <button onClick={() => onSetStatus("inprogress")} className="btn">
              Mark In Progress
            </button>
          )}
          {item.status !== "decided" && (
            <button onClick={() => onSetStatus("decided")} className="btn">
              Mark Decided
            </button>
          )}
          <button onClick={() => onSetStatus("closed")} className="btn">
            Close Item
          </button>
        </div>
      )}
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 5,
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 8,
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </div>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 14,
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </p>
    </div>
  );
}

function ManagerEmptyState({ section }: { section: NavSection }) {
  const msgs: Record<NavSection, string> = {
    open: "Nothing needs a decision right now.",
    inprogress: "No items in progress.",
    decided: "No decided items yet.",
    closed: "No closed items yet.",
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: "2px solid var(--mb-black)",
          background: "var(--mb-yellow-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 3px 0 0 var(--mb-black)",
          fontSize: 32,
        }}
      >
        🐻
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>{msgs[section]}</div>
    </div>
  );
}

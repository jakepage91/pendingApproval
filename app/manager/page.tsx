"use client";

import { useEffect, useState, useCallback } from "react";
import { Item, Status, ItemType, Priority, Manager, Person, MANAGERS } from "@/lib/types";
import { ItemRow } from "@/components/ItemRow";
import { PriorityDot, TypeBadge, StatusBadge, PriorityLabel } from "@/components/Badges";
import { Toast, useToast } from "@/components/Toast";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { PersonPicker } from "@/components/PersonPicker";
import { SecondOpinionsList, SecondOpinionInput, parseOpinions } from "@/components/SecondOpinions";
import { BottomSheet } from "@/components/BottomSheet";
import { useIsMobile } from "@/lib/useIsMobile";

type NavSection = "open" | "inprogress" | "decided" | "closed" | "delegated" | "included";
type TypeFilter = "all" | ItemType;

const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseIncluded(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export default function ManagerPage() {
  const isMobile = useIsMobile();
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);
  const [showManagerPicker, setShowManagerPicker] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [navSection, setNavSection] = useState<NavSection>("open");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("ap_manager") as Manager | null;
    if (stored && MANAGERS.includes(stored)) {
      setCurrentManager(stored);
    } else {
      setShowManagerPicker(true);
    }
  }, []);

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

  const selectManager = (m: Manager) => {
    setCurrentManager(m);
    localStorage.setItem("ap_manager", m);
    setShowManagerPicker(false);
  };

  const counts = {
    open: items.filter((i) => i.status === "open").length,
    inprogress: items.filter((i) => i.status === "inprogress").length,
    decided: items.filter((i) => i.status === "decided").length,
    closed: items.filter((i) => i.status === "closed").length,
    delegated: items.filter((i) => i.delegatedTo === currentManager && i.status !== "closed").length,
    included: items.filter((i) => {
      try { return currentManager && JSON.parse(i.includedPeople ?? "[]").includes(currentManager) && i.status !== "closed"; }
      catch { return false; }
    }).length,
  };

  const statusMap: Record<Exclude<NavSection, "delegated" | "included">, Status> = {
    open: "open",
    inprogress: "inprogress",
    decided: "decided",
    closed: "closed",
  };

  const visibleItems = (() => {
    let base: Item[];
    if (navSection === "delegated") {
      base = items.filter((i) => i.delegatedTo === currentManager && i.status !== "closed");
    } else if (navSection === "included") {
      base = items.filter((i) => {
        try { return currentManager && JSON.parse(i.includedPeople ?? "[]").includes(currentManager) && i.status !== "closed"; }
        catch { return false; }
      });
    } else {
      base = items.filter((i) => i.status === statusMap[navSection as Exclude<NavSection, "delegated" | "included">]);
    }
    return base.filter((i) => typeFilter === "all" || i.type === typeFilter);
  })();

  const groupedByPriority =
    navSection === "open"
      ? PRIORITY_ORDER.reduce<Record<Priority, Item[]>>(
          (acc, p) => { acc[p] = visibleItems.filter((i) => i.priority === p); return acc; },
          { urgent: [], high: [], normal: [], low: [] }
        )
      : null;

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  const patchItem = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { await fetchItems(); return true; }
    return false;
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedId(null);
      setPanelOpen(false);
      await fetchItems();
      addToast("Request deleted.");
    } else {
      addToast("Failed to delete.", "error");
    }
  };

  if (showManagerPicker) {
    return <ManagerPicker onSelect={selectManager} />;
  }

  const navSectionLabel: Record<NavSection, string> = {
    open: "Needs Decision",
    inprogress: "In Progress",
    decided: "Decided",
    closed: "Closed",
    delegated: "Delegated to Me",
    included: "Included On",
  };

  const detailPanel = selectedItem && currentManager ? (
    <ManagerDetailPanel
      item={selectedItem}
      currentManager={currentManager}
      onClose={() => setPanelOpen(false)}
      onSaveResponse={async (response) => {
        const ok = await patchItem(selectedItem.id, { managerResponse: response });
        if (ok) addToast("Response saved."); else addToast("Failed to save.", "error");
      }}
      onSetStatus={async (status) => {
        const patch: Record<string, unknown> = { status };
        if (status === "closed") patch.closedBy = currentManager;
        const ok = await patchItem(selectedItem.id, patch);
        if (ok) addToast(status === "open" ? "Item reopened." : `Marked as ${status}.`);
        else addToast("Failed to update status.", "error");
      }}
      onDelegate={async (to) => {
        const ok = await patchItem(selectedItem.id, { delegatedTo: to, delegatedBy: currentManager });
        if (ok) addToast(`Delegated to ${capitalize(to)}.`);
        else addToast("Failed to delegate.", "error");
      }}
      onRemoveDelegate={async () => {
        const ok = await patchItem(selectedItem.id, { delegatedTo: null, delegatedBy: null });
        if (ok) addToast("Delegation removed.");
      }}
      onUpdateInclusion={async (people) => {
        const ok = await patchItem(selectedItem.id, { includedPeople: people.length ? JSON.stringify(people) : null });
        if (ok) addToast("Second opinions updated.");
        else addToast("Failed to update.", "error");
      }}
      onSaveSecondOpinion={async (body) => {
        const ok = await patchItem(selectedItem.id, { secondOpinion: { author: currentManager, body } });
        if (ok) addToast("Opinion saved.");
        else addToast("Failed to save.", "error");
      }}
      onDelete={() => deleteItem(selectedItem.id)}
    />
  ) : null;

  const mobileNavSections: { key: NavSection; icon: string; shortLabel: string }[] = [
    { key: "open", icon: "⚡", shortLabel: "Open" },
    { key: "inprogress", icon: "🔄", shortLabel: "Progress" },
    { key: "decided", icon: "✓", shortLabel: "Decided" },
    { key: "closed", icon: "✅", shortLabel: "Closed" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-base)", overflow: "hidden", flexDirection: "column" }}>
      {/* Mobile top bar */}
      {isMobile && (
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)", flexShrink: 0,
          }}
        >
          <Logo size={15} />
          <button
            onClick={() => setShowManagerPicker(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Avatar name={currentManager} size={26} ring />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>↗</span>
          </button>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar — desktop only */}
        <aside
          style={{
            width: 232, flexShrink: 0,
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border-subtle)",
            display: isMobile ? "none" : "flex",
            flexDirection: "column", padding: "20px 0",
          }}
        >
          <div style={{ padding: "0 18px 20px" }}>
            <div style={{ marginBottom: 10 }}><Logo size={16} /></div>
            <button
              onClick={() => setShowManagerPicker(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--bg-tint)", border: "1px solid var(--border-subtle)",
                borderRadius: 8, padding: "6px 8px", width: "100%", cursor: "pointer",
              }}
            >
              <Avatar name={currentManager} size={20} />
              <span style={{ flex: 1, color: "var(--text-primary)", fontSize: 12.5, fontWeight: 600, textAlign: "left" }}>
                {capitalize(currentManager ?? "")}&rsquo;s Board
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 11 }}>↗</span>
            </button>
          </div>

          <nav style={{ flex: 1, padding: "0 10px", overflowY: "auto" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0 8px 8px" }}>
              Queue
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
                  onClick={() => { setNavSection(key); setPanelOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 10px", borderRadius: 8, border: "none",
                    background: active ? "var(--accent-subtle)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "13px", fontWeight: active ? 600 : 500, cursor: "pointer",
                    textAlign: "left", marginBottom: 2, transition: "background 100ms",
                  }}
                >
                  {label}
                  <span style={{ fontSize: "11px", color: active ? "var(--accent)" : "var(--text-muted)", background: active ? "rgba(117,109,243,0.18)" : "var(--bg-tint)", borderRadius: 999, padding: "1px 7px", minWidth: 20, textAlign: "center", fontWeight: 600 }}>
                    {counts[key as Exclude<NavSection, "delegated">]}
                  </span>
                </button>
              );
            })}

            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "16px 8px 8px" }}>
              Delegated to Me
            </div>
            {(["delegated", "included"] as const).map((key) => {
              const labels = { delegated: "My Delegations", included: "Included On" };
              const active = navSection === key;
              const count = counts[key];
              return (
                <button
                  key={key}
                  onClick={() => { setNavSection(key); setPanelOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 10px", borderRadius: 8, border: "none",
                    background: active ? "var(--accent-subtle)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: "13px", fontWeight: active ? 600 : 500, cursor: "pointer",
                    textAlign: "left", marginBottom: 2, transition: "background 100ms",
                  }}
                >
                  {labels[key]}
                  <span style={{ fontSize: "11px", color: active ? "var(--accent)" : count > 0 ? "var(--mb-blush)" : "var(--text-muted)", background: active ? "rgba(117,109,243,0.18)" : count > 0 ? "rgba(243,104,105,0.12)" : "var(--bg-tint)", borderRadius: 999, padding: "1px 7px", minWidth: 20, textAlign: "center", fontWeight: 600 }}>
                    {count}
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
              borderBottom: "1px solid var(--border-subtle)", padding: isMobile ? "10px 16px" : "14px 28px",
              display: "flex", gap: 6, flexShrink: 0, alignItems: "center", overflowX: "auto",
            }}
          >
            {!isMobile && (
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginRight: 6 }}>
                Filter
              </span>
            )}
            {(["all", "approval", "question", "design"] as TypeFilter[]).map((f) => {
              const labels: Record<TypeFilter, string> = { all: "All", approval: "Approvals", question: "Questions", design: "Design" };
              const active = typeFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  style={{
                    padding: isMobile ? "4px 10px" : "5px 14px", borderRadius: 999,
                    border: `1.5px solid ${active ? "var(--mb-black)" : "var(--border)"}`,
                    background: active ? "var(--mb-yellow)" : "transparent",
                    color: active ? "var(--mb-black)" : "var(--text-secondary)",
                    fontSize: isMobile ? 11 : 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                    boxShadow: active ? "0 2px 0 0 var(--mb-black)" : "none", transition: "all 120ms",
                  }}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {/* Content + Panel */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 0", paddingBottom: isMobile ? 80 : 24 }}>
              <div style={{ padding: isMobile ? "0 16px 16px" : "0 28px 16px", display: "flex", alignItems: "baseline", gap: 14 }}>
                <h2 className="display" style={{ fontSize: isMobile ? 22 : 28, color: "var(--text-primary)" }}>
                  {navSectionLabel[navSection]}
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
                      <div style={{ padding: isMobile ? "8px 16px" : "8px 28px", display: "flex", alignItems: "center", gap: 10 }}>
                        <PriorityDot priority={p} />
                        <PriorityLabel priority={p} />
                        <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                          ({groupedByPriority[p].length})
                        </span>
                      </div>
                      <div style={{ padding: "0 16px" }}>
                        {groupedByPriority[p].map((item) => (
                          <ItemRow key={item.id} item={item} selected={selectedId === item.id}
                            onClick={() => { setSelectedId(item.id); setPanelOpen(true); }} />
                        ))}
                      </div>
                    </div>
                  ) : null
                )
              ) : (
                <div style={{ padding: "0 16px" }}>
                  {visibleItems.map((item) => (
                    <ItemRow key={item.id} item={item} selected={selectedId === item.id}
                      onClick={() => { setSelectedId(item.id); setPanelOpen(true); }} />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop detail panel */}
            {!isMobile && (
              <div
                style={{
                  width: panelOpen ? "min(500px, 55vw)" : 0,
                  flexShrink: 0, overflowY: "auto", overflowX: "hidden",
                  background: "var(--bg-surface)",
                  borderLeft: panelOpen ? "1px solid var(--border)" : "none",
                  transition: "width 150ms ease",
                }}
              >
                {detailPanel}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <BottomSheet open={panelOpen} onClose={() => setPanelOpen(false)}>
          {detailPanel}
        </BottomSheet>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
            background: "var(--bg-surface)", borderTop: "1.5px solid var(--mb-black)",
            display: "flex", alignItems: "center", padding: "8px 12px",
            paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
          }}
        >
          {mobileNavSections.map(({ key, icon, shortLabel }) => {
            const active = navSection === key;
            const count = counts[key as Exclude<NavSection, "delegated">];
            return (
              <button
                key={key}
                onClick={() => { setNavSection(key); setPanelOpen(false); }}
                style={{
                  flex: 1, padding: "6px 4px", borderRadius: 8, border: "none",
                  background: active ? "var(--accent-subtle)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  fontSize: 10, fontWeight: active ? 700 : 500, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}
              >
                <span style={{ fontSize: 15 }}>{icon}</span>
                {shortLabel}
                {count > 0 && (
                  <span style={{ fontSize: 9, background: active ? "var(--accent)" : "var(--border)", color: active ? "#fff" : "var(--text-muted)", borderRadius: 999, padding: "0 4px", lineHeight: "14px", minWidth: 14, textAlign: "center" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function ManagerPicker({ onSelect }: { onSelect: (m: Manager) => void }) {
  return (
    <div
      style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 40%, rgba(117,109,243,0.08) 0%, var(--bg-base) 70%)",
        gap: 32,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }} className="display">
          Which manager are you?
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>Select your name to open your board</div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {(["lorena", "eyal"] as Manager[]).map((m) => (
          <button
            key={m}
            onClick={() => onSelect(m)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              padding: "24px 36px",
              background: "var(--bg-surface)",
              border: "2px solid var(--mb-black)",
              borderRadius: 14,
              cursor: "pointer",
              transition: "box-shadow 150ms, transform 150ms",
              boxShadow: "0 4px 0 0 var(--mb-black)",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = "translateY(-2px)";
              b.style.boxShadow = "0 6px 0 0 var(--mb-black)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = "translateY(0)";
              b.style.boxShadow = "0 4px 0 0 var(--mb-black)";
            }}
          >
            <Avatar name={m} size={48} ring />
            <span style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}>{capitalize(m)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ManagerDetailPanel({
  item,
  currentManager,
  onClose,
  onSaveResponse,
  onSetStatus,
  onDelegate,
  onRemoveDelegate,
  onUpdateInclusion,
  onSaveSecondOpinion,
  onDelete,
}: {
  item: Item;
  currentManager: Manager;
  onClose: () => void;
  onSaveResponse: (response: string) => Promise<void>;
  onSetStatus: (status: Status) => Promise<void>;
  onDelegate: (to: Person) => Promise<void>;
  onRemoveDelegate: () => Promise<void>;
  onUpdateInclusion: (people: string[]) => Promise<void>;
  onSaveSecondOpinion: (body: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [response, setResponse] = useState(item.managerResponse ?? "");
  const [saving, setSaving] = useState(false);
  const [showDelegatePicker, setShowDelegatePicker] = useState(false);
  const [showIncludePicker, setShowIncludePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [includedDraft, setIncludedDraft] = useState<string[]>(() => parseIncluded(item.includedPeople));

  useEffect(() => {
    setResponse(item.managerResponse ?? "");
    setIncludedDraft(parseIncluded(item.includedPeople));
  }, [item.id, item.managerResponse, item.includedPeople]);

  const handleSave = async () => {
    setSaving(true);
    await onSaveResponse(response);
    setSaving(false);
  };

  const included = parseIncluded(item.includedPeople);
  const opinions = parseOpinions(item.secondOpinions);
  const myExistingOpinion = opinions.find((o) => o.author === currentManager)?.body ?? "";
  const isIncluded = included.includes(currentManager);

  return (
    <div style={{ padding: 28, minWidth: 320 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Detail
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, padding: 4 }}>
          ×
        </button>
      </div>

      {/* Delegation / inclusion banners */}
      {item.delegatedTo && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
            padding: "8px 12px", background: "rgba(117,109,243,0.08)",
            border: "1px solid rgba(117,109,243,0.25)", borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>↪</span>
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
            Delegated to {capitalize(item.delegatedTo)}
          </span>
          {item.delegatedBy && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>by {capitalize(item.delegatedBy)}</span>
          )}
          <button
            onClick={onRemoveDelegate}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 16, padding: 2 }}
          >×</button>
        </div>
      )}
      {included.length > 0 && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap",
            padding: "8px 12px", background: "rgba(255,203,125,0.12)",
            border: "1px solid rgba(255,203,125,0.4)", borderRadius: 8,
          }}
        >
          <span style={{ fontSize: 13 }}>💬</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Second opinions from:</span>
          {included.map((p) => (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Avatar name={p} size={18} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{capitalize(p)}</span>
            </span>
          ))}
        </div>
      )}

      <h2 className="display" style={{ fontSize: 24, color: "var(--text-primary)", marginBottom: 18, lineHeight: 1.2 }}>
        {item.title}
      </h2>

      <div
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px",
          marginBottom: 20, padding: 16, background: "var(--bg-tint)",
          borderRadius: 10, border: "1px solid var(--border-subtle)",
        }}
      >
        <MetaField label="Status"><StatusBadge status={item.status} /></MetaField>
        <MetaField label="Type"><TypeBadge type={item.type} /></MetaField>
        <MetaField label="Priority">
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PriorityDot priority={item.priority} />
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{capitalize(item.priority)}</span>
          </span>
        </MetaField>
        <MetaField label="From">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Avatar name={item.submittedBy} size={20} />
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{capitalize(item.submittedBy)}</span>
          </span>
        </MetaField>
        <MetaField label="Submitted">
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{formatDateTime(item.submittedAt)}</span>
        </MetaField>
        {item.closedAt && (
          <MetaField label="Closed">
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{formatDateTime(item.closedAt)}</span>
          </MetaField>
        )}
      </div>

      <Section label="Context">{item.context}</Section>
      {item.additionalInfo && <Section label="Additional Info">{item.additionalInfo}</Section>}

      {item.attachmentUrl && (
        <div style={{ marginTop: 16, marginBottom: 4 }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
            Attachment
          </div>
          <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
            <img src={item.attachmentUrl} alt={item.attachmentName ?? "Attachment"}
              style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 10, border: "1.5px solid var(--mb-black)", boxShadow: "0 2px 0 0 var(--mb-black)", display: "block" }} />
          </a>
          {item.attachmentName && <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{item.attachmentName}</p>}
        </div>
      )}

      {item.status !== "closed" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
            Your Response
          </div>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response or decision here…"
            rows={5}
            style={{ width: "100%", padding: 12, background: "var(--bg-surface)", border: "1.5px solid var(--mb-black)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13.5, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, outline: "none", boxShadow: "0 2px 0 0 var(--mb-black)" }}
          />
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
            {saving ? "Saving…" : "Save Response"}
          </button>
        </div>
      )}

      {item.managerResponse && item.status === "closed" && (
        <div style={{ marginTop: 20, padding: 18, background: "var(--mb-yellow-soft)", border: "1.5px solid var(--mb-black)", borderRadius: 12, boxShadow: "0 3px 0 0 var(--mb-black)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Avatar name={item.closedBy ?? currentManager} size={22} ring />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mb-black)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Response</span>
          </div>
          <p style={{ color: "var(--mb-black)", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.managerResponse}</p>
        </div>
      )}

      {/* Second opinions — input if included, list for everyone */}
      {isIncluded && item.status !== "closed" && (
        <SecondOpinionInput
          author={currentManager}
          existing={myExistingOpinion}
          onSave={onSaveSecondOpinion}
        />
      )}
      <SecondOpinionsList opinions={opinions} />

      {/* Action buttons */}
      <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {item.status === "closed" ? (
          <button onClick={() => onSetStatus("open")} className="btn">Reopen</button>
        ) : (
          <>
            {item.status !== "inprogress" && (
              <button onClick={() => onSetStatus("inprogress")} className="btn">Mark In Progress</button>
            )}
            {item.status !== "decided" && (
              <button onClick={() => onSetStatus("decided")} className="btn">Mark Decided</button>
            )}
            <button onClick={() => onSetStatus("closed")} className="btn">Close Item</button>
          </>
        )}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn"
            style={{ color: "var(--mb-blush)", borderColor: "var(--mb-blush)", boxShadow: "0 3px 0 0 var(--mb-blush)" }}
          >
            Delete
          </button>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sure?</span>
            <button onClick={onDelete} className="btn" style={{ color: "var(--mb-blush)", borderColor: "var(--mb-blush)", boxShadow: "0 3px 0 0 var(--mb-blush)", fontSize: 12 }}>Yes, delete</button>
            <button onClick={() => setConfirmDelete(false)} className="btn" style={{ fontSize: 12 }}>Cancel</button>
          </span>
        )}
      </div>

      {/* Delegation + Inclusion row */}
      {item.status !== "closed" && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowDelegatePicker((v) => !v); setShowIncludePicker(false); }}
              className="btn"
              style={{ fontSize: 12 }}
            >
              ↪ {item.delegatedTo ? `Delegated to ${capitalize(item.delegatedTo)}` : "Delegate"}
            </button>
            {showDelegatePicker && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200 }}>
                <PersonPicker
                  title="Delegate to…"
                  exclude={[currentManager]}
                  onSelect={async (p) => { setShowDelegatePicker(false); await onDelegate(p); }}
                  onClose={() => setShowDelegatePicker(false)}
                />
              </div>
            )}
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowIncludePicker((v) => !v); setShowDelegatePicker(false); }}
              className="btn"
              style={{ fontSize: 12 }}
            >
              💬 {included.length > 0 ? `${included.length} included` : "Include"}
            </button>
            {showIncludePicker && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200 }}>
                <PersonPicker
                  title="Include for second opinion"
                  exclude={[]}
                  multiSelect
                  selected={includedDraft}
                  onSelect={() => {}}
                  onToggle={(p) => setIncludedDraft((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                  onConfirm={async () => { setShowIncludePicker(false); await onUpdateInclusion(includedDraft); }}
                  onClose={() => setShowIncludePicker(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5, fontFamily: "var(--font-mono)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
        {label}
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
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
    delegated: "Nothing delegated to you yet.",
    included: "You haven't been included on any requests yet.",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 14 }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid var(--mb-black)", background: "var(--mb-yellow-soft)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 0 0 var(--mb-black)", fontSize: 32 }}>
        🐻
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>{msgs[section]}</div>
    </div>
  );
}

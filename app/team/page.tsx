"use client";

import { useEffect, useState, useCallback } from "react";
import { Item, TeamMember, ItemType, Priority, Person, Manager, MANAGERS, ALL_PEOPLE } from "@/lib/types";
import { ItemRow } from "@/components/ItemRow";
import { PriorityDot, TypeBadge, StatusBadge } from "@/components/Badges";
import { Toast, useToast } from "@/components/Toast";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { PersonPicker } from "@/components/PersonPicker";
import { SecondOpinionsList, parseOpinions } from "@/components/SecondOpinions";
import { BottomSheet } from "@/components/BottomSheet";
import { useIsMobile } from "@/lib/useIsMobile";

type NavSection = "mine" | "open" | "resolved";

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

function PriorityIcon({ priority }: { priority: Priority }) {
  const labels: Record<Priority, string> = {
    urgent: "Urgent",
    high: "High",
    normal: "Normal",
    low: "Low",
  };
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <PriorityDot priority={priority} />
      <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
        {labels[priority]}
      </span>
    </span>
  );
}

export default function TeamPage() {
  const isMobile = useIsMobile();
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [navSection, setNavSection] = useState<NavSection>("mine");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem("ap_user") as TeamMember | null;
    if (stored && ["jake", "arsh", "ioana"].includes(stored)) {
      setCurrentUser(stored);
    } else {
      setShowUserPicker(true);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/items");
    const data: Item[] = await res.json();
    setItems(data);
  }, []);

  useEffect(() => {
    fetchItems();
    const poll = setInterval(fetchItems, 15000);
    return () => clearInterval(poll);
  }, [fetchItems]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanelOpen(false);
        setShowNewModal(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setShowNewModal(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const selectUser = (user: TeamMember) => {
    setCurrentUser(user);
    localStorage.setItem("ap_user", user);
    setShowUserPicker(false);
  };

  const visibleItems = items.filter((item) => {
    if (navSection === "mine") return item.submittedBy === currentUser;
    if (navSection === "open")
      return item.status === "open" || item.status === "inprogress";
    return item.status === "decided" || item.status === "closed";
  });

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  const counts = {
    mine: items.filter((i) => i.submittedBy === currentUser).length,
    open: items.filter((i) => i.status === "open" || i.status === "inprogress").length,
    resolved: items.filter((i) => i.status === "decided" || i.status === "closed").length,
  };

  const closeItem = async () => {
    if (!selectedItem || !currentUser) return;
    const res = await fetch(`/api/items/${selectedItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed", closedBy: currentUser }),
    });
    if (res.ok) {
      await fetchItems();
      addToast("Item closed.");
    }
  };

  const reopenItem = async () => {
    if (!selectedItem) return;
    const res = await fetch(`/api/items/${selectedItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "open", closedBy: null, closedAt: null }),
    });
    if (res.ok) { await fetchItems(); addToast("Item reopened."); }
  };

  const patchItem = async (patch: Record<string, unknown>) => {
    if (!selectedItem) return false;
    const res = await fetch(`/api/items/${selectedItem.id}`, {
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

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/share/${currentUser}`
    : "";

  if (showUserPicker) {
    return <UserPicker onSelect={selectUser} />;
  }

  const detailPanelContent = selectedItem ? (
    <TeamDetailPanel
      item={selectedItem}
      currentUser={currentUser}
      onClose={() => setPanelOpen(false)}
      onCloseItem={closeItem}
      onReopenItem={reopenItem}
      onDelete={() => deleteItem(selectedItem.id)}
      onReassign={async (manager) => {
        const ok = await patchItem({ assignedManager: manager });
        if (ok) addToast(`Sent to ${capitalize(manager)}.`);
        else addToast("Failed to reassign.", "error");
      }}
      onDelegate={async (to) => {
        const ok = await patchItem({ delegatedTo: to, delegatedBy: currentUser });
        if (ok) addToast(`Delegated to ${capitalize(to)}.`);
        else addToast("Failed to delegate.", "error");
      }}
      onRemoveDelegate={async () => {
        const ok = await patchItem({ delegatedTo: null, delegatedBy: null });
        if (ok) addToast("Delegation removed.");
      }}
      onUpdateInclusion={async (people) => {
        const ok = await patchItem({ includedPeople: people.length ? JSON.stringify(people) : null });
        if (ok) addToast("Second opinions updated.");
      }}
    />
  ) : null;

  const navLabels: Record<NavSection, string> = { mine: "My Requests", open: "All Open", resolved: "Resolved" };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg-base)",
        overflow: "hidden",
        flexDirection: "column",
      }}
    >
      {/* Mobile top bar */}
      {isMobile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border-subtle)",
            flexShrink: 0,
          }}
        >
          <Logo size={15} />
          <button
            onClick={() => setShowUserPicker(true)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <Avatar name={currentUser} size={28} ring />
          </button>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar — desktop only */}
        <aside
          style={{
            width: 232,
            flexShrink: 0,
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border-subtle)",
            display: isMobile ? "none" : "flex",
            flexDirection: "column",
            padding: "20px 0",
          }}
        >
          <div style={{ padding: "0 18px 20px" }}>
            <div style={{ marginBottom: 10 }}>
              <Logo size={16} />
            </div>
            <button
              onClick={() => setShowUserPicker(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg-tint)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                padding: "6px 8px",
                color: "var(--text-secondary)",
                fontSize: "12.5px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <Avatar name={currentUser} size={20} />
              <span style={{ flex: 1, textAlign: "left", color: "var(--text-primary)", fontWeight: 600 }}>
                {capitalize(currentUser ?? "")}
              </span>
              <span style={{ color: "var(--text-muted)" }}>↗</span>
            </button>
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
            {(["mine", "open", "resolved"] as NavSection[]).map((section) => {
              const active = navSection === section;
              return (
                <button
                  key={section}
                  onClick={() => { setNavSection(section); setPanelOpen(false); }}
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
                  {navLabels[section]}
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
                    {counts[section]}
                  </span>
                </button>
              );
            })}
          </nav>

          <div style={{ padding: "12px 10px 0" }}>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              + New Request
            </button>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              ⌘N
            </div>
            <button
              onClick={() => {
                if (shareUrl) {
                  navigator.clipboard.writeText(shareUrl);
                  addToast("Share link copied!");
                }
              }}
              className="btn"
              style={{ width: "100%", justifyContent: "center", marginTop: 8, fontSize: 12 }}
            >
              🔗 Copy share link
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 0", minWidth: 0, paddingBottom: isMobile ? 80 : 24 }}>
            <div style={{ padding: isMobile ? "0 16px 16px" : "0 28px 16px", display: "flex", alignItems: "baseline", gap: 14 }}>
              <h2 className="display" style={{ fontSize: isMobile ? 22 : 28, color: "var(--text-primary)" }}>
                {navLabels[navSection]}
              </h2>
              <span style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            {visibleItems.length === 0 ? (
              <EmptyState section={navSection} />
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

          {/* Desktop slide-in detail panel */}
          {!isMobile && (
            <div
              style={{
                width: panelOpen ? "min(480px, 55vw)" : 0,
                flexShrink: 0,
                overflowY: "auto",
                overflowX: "hidden",
                background: "var(--bg-surface)",
                borderLeft: panelOpen ? "1px solid var(--border)" : "none",
                transition: "width 150ms ease",
              }}
            >
              {selectedItem && detailPanelContent}
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <BottomSheet open={panelOpen} onClose={() => setPanelOpen(false)}>
          {detailPanelContent}
        </BottomSheet>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--bg-surface)",
            borderTop: "1.5px solid var(--mb-black)",
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            gap: 4,
            paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
          }}
        >
          {(["mine", "open", "resolved"] as NavSection[]).map((section) => {
            const active = navSection === section;
            return (
              <button
                key={section}
                onClick={() => { setNavSection(section); setPanelOpen(false); }}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  borderRadius: 8,
                  border: "none",
                  background: active ? "var(--accent-subtle)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {section === "mine" ? "🧑" : section === "open" ? "📋" : "✅"}
                </span>
                {navLabels[section]}
                {counts[section] > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      background: active ? "var(--accent)" : "var(--border)",
                      color: active ? "#fff" : "var(--text-muted)",
                      borderRadius: 999,
                      padding: "0 5px",
                      lineHeight: "16px",
                      minWidth: 16,
                      textAlign: "center",
                    }}
                  >
                    {counts[section]}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "2px solid var(--mb-black)",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 0 0 var(--mb-black)",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            +
          </button>
        </div>
      )}

      {showNewModal && currentUser && (
        <NewRequestModal
          submittedBy={currentUser}
          isMobile={isMobile}
          onClose={() => setShowNewModal(false)}
          onSubmit={async (data) => {
            const res = await fetch("/api/items", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (res.ok) {
              await fetchItems();
              setShowNewModal(false);
              addToast("Request submitted successfully.");
            } else {
              addToast("Failed to submit request.", "error");
            }
          }}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function UserPicker({ onSelect }: { onSelect: (u: TeamMember) => void }) {
  const members: TeamMember[] = ["jake", "arsh", "ioana"];
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        gap: 36,
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <span className="eyebrow" style={{ marginBottom: 22 }}>Sign in</span>
        <h1 className="display" style={{ fontSize: 56, color: "var(--text-primary)", marginTop: 22, marginBottom: 8 }}>
          Who are you?
        </h1>
        <div style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Pick your name to continue.
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {members.map((m) => (
          <button
            key={m}
            onClick={() => onSelect(m)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "20px 26px",
              background: "var(--bg-surface)",
              border: "2px solid var(--mb-black)",
              borderRadius: 14,
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 0 0 var(--mb-black)",
              minWidth: 130,
              transition: "transform 100ms ease, box-shadow 100ms ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "translateY(-2px)";
              el.style.boxShadow = "0 6px 0 0 var(--mb-black)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "0 4px 0 0 var(--mb-black)";
            }}
          >
            <Avatar name={m} size={48} ring />
            {capitalize(m)}
          </button>
        ))}
      </div>
    </div>
  );
}

function parseIncluded(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function TeamDetailPanel({
  item,
  currentUser,
  onClose,
  onCloseItem,
  onReopenItem,
  onDelete,
  onReassign,
  onDelegate,
  onRemoveDelegate,
  onUpdateInclusion,
}: {
  item: Item;
  currentUser: TeamMember | null;
  onClose: () => void;
  onCloseItem: () => void;
  onReopenItem: () => void;
  onDelete: () => void;
  onReassign: (manager: Manager) => Promise<void>;
  onDelegate: (to: Person) => Promise<void>;
  onRemoveDelegate: () => Promise<void>;
  onUpdateInclusion: (people: string[]) => Promise<void>;
}) {
  const isClosed = item.status === "closed";
  const [showDelegatePicker, setShowDelegatePicker] = useState(false);
  const [showIncludePicker, setShowIncludePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [includedDraft, setIncludedDraft] = useState<string[]>(() => parseIncluded(item.includedPeople));

  useEffect(() => {
    setIncludedDraft(parseIncluded(item.includedPeople));
  }, [item.id, item.includedPeople]);

  const included = parseIncluded(item.includedPeople);

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
            lineHeight: 1,
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
          <PriorityIcon priority={item.priority} />
        </MetaField>
        <MetaField label="Submitted by">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Avatar name={item.submittedBy} size={20} />
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {capitalize(item.submittedBy)}
            </span>
          </span>
        </MetaField>
        <MetaField label="Submitted at">
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            {formatDateTime(item.submittedAt)}
          </span>
        </MetaField>
        {item.closedAt && (
          <MetaField label="Closed at">
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {formatDateTime(item.closedAt)}
            </span>
          </MetaField>
        )}
      </div>

      {/* Delegation / inclusion banners */}
      {item.delegatedTo && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 12px", background: "rgba(117,109,243,0.08)", border: "1px solid rgba(117,109,243,0.25)", borderRadius: 8 }}>
          <span style={{ fontSize: 14 }}>↪</span>
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Delegated to {capitalize(item.delegatedTo)}</span>
          {item.delegatedBy && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>by {capitalize(item.delegatedBy)}</span>}
        </div>
      )}
      {included.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap", padding: "8px 12px", background: "rgba(255,203,125,0.12)", border: "1px solid rgba(255,203,125,0.4)", borderRadius: 8 }}>
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

      {/* Manager assignment toggle */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
          Send to
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {MANAGERS.map((m) => {
            const active = (item.assignedManager ?? "lorena") === m;
            return (
              <button
                key={m}
                onClick={() => !active && onReassign(m)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px",
                  border: `2px solid ${active ? "var(--mb-black)" : "var(--border)"}`,
                  borderRadius: 10,
                  background: active ? "var(--bg-surface)" : "transparent",
                  boxShadow: active ? "0 3px 0 0 var(--mb-black)" : "none",
                  cursor: active ? "default" : "pointer",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "all 80ms ease",
                }}
              >
                <Avatar name={m} size={20} />
                {capitalize(m)}
                {active && <span style={{ fontSize: 10, color: "var(--accent)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <Section label="Context">{item.context}</Section>
      {item.additionalInfo && <Section label="Additional Info">{item.additionalInfo}</Section>}

      {item.attachmentUrl && (
        <div style={{ marginTop: 16, marginBottom: 4 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Attachment
          </div>
          <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
            <img
              src={item.attachmentUrl}
              alt={item.attachmentName ?? "Attachment"}
              style={{
                maxWidth: "100%",
                maxHeight: 320,
                objectFit: "contain",
                borderRadius: 10,
                border: "1.5px solid var(--mb-black)",
                boxShadow: "0 2px 0 0 var(--mb-black)",
                display: "block",
              }}
            />
          </a>
          {item.attachmentName && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{item.attachmentName}</p>
          )}
        </div>
      )}

      {item.managerResponse && (
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
              Lorena&rsquo;s Response
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

      <SecondOpinionsList opinions={parseOpinions(item.secondOpinions)} />

      <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {isClosed ? (
          <button onClick={onReopenItem} className="btn">Reopen</button>
        ) : (
          <button onClick={onCloseItem} className="btn">Close item</button>
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

      {!isClosed && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
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
                  exclude={currentUser ? [currentUser] : []}
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

function EmptyState({ section }: { section: NavSection }) {
  const msgs = {
    mine: "You haven't submitted any requests yet.",
    open: "No open items right now.",
    resolved: "No resolved items yet.",
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

type NewRequestFormData = {
  title: string;
  type: ItemType;
  priority: Priority;
  context: string;
  additionalInfo: string;
  submittedBy: TeamMember;
  attachmentUrl?: string;
  attachmentName?: string;
  assignedManager: Manager;
};

function NewRequestModal({
  submittedBy,
  isMobile,
  onClose,
  onSubmit,
}: {
  submittedBy: TeamMember;
  isMobile: boolean;
  onClose: () => void;
  onSubmit: (data: NewRequestFormData) => void;
}) {
  const [form, setForm] = useState<NewRequestFormData>({
    title: "",
    type: "question",
    priority: "normal",
    context: "",
    additionalInfo: "",
    submittedBy,
    assignedManager: "lorena",
  });
  const [submitting, setSubmitting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPendingFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.context.trim()) return;
    setSubmitting(true);

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    if (pendingFile) {
      const fd = new FormData();
      fd.append("file", pendingFile);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        attachmentUrl = data.url;
        attachmentName = data.name;
      }
    }

    await onSubmit({ ...form, attachmentUrl, attachmentName });
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: isMobile ? "var(--bg-surface)" : "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        zIndex: 100,
        padding: isMobile ? 0 : 20,
      }}
      onClick={(e) => {
        if (!isMobile && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: isMobile ? "none" : "2px solid var(--mb-black)",
          borderRadius: isMobile ? 0 : 14,
          padding: isMobile ? "16px 16px 40px" : 28,
          width: "100%",
          maxWidth: isMobile ? "100%" : 560,
          height: isMobile ? "100%" : "auto",
          maxHeight: isMobile ? "100%" : "90vh",
          overflowY: "auto",
          boxShadow: isMobile ? "none" : "0 6px 0 0 var(--mb-black)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h3 className="display" style={{ fontSize: 24, color: "var(--text-primary)" }}>
            New request
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 22,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Title *">
            <input
              required
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief, descriptive title"
              style={inputStyle}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ItemType })}
                style={inputStyle}
              >
                <option value="approval">Approval</option>
                <option value="question">Question</option>
                <option value="design">Design</option>
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                style={inputStyle}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </Field>
          </div>

          <Field label="Send to">
            <div style={{ display: "flex", gap: 8 }}>
              {MANAGERS.map((m) => {
                const active = form.assignedManager === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, assignedManager: m })}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 14px",
                      border: `2px solid ${active ? "var(--mb-black)" : "var(--border)"}`,
                      borderRadius: 10,
                      background: active ? "var(--bg-surface)" : "transparent",
                      boxShadow: active ? "0 3px 0 0 var(--mb-black)" : "none",
                      cursor: "pointer",
                      fontWeight: active ? 700 : 500,
                      fontSize: 13,
                      color: active ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    <Avatar name={m} size={20} />
                    {capitalize(m)}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Context *">
            <textarea
              required
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
              placeholder="What's the situation? Include any relevant background, deadlines, or constraints."
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field label="Additional Info">
            <textarea
              value={form.additionalInfo}
              onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
              placeholder="Links, supporting data, or anything else Lorena should know."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <Field label="Attachment">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                background: "var(--bg-tint)",
                border: "1.5px dashed var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                color: "var(--text-secondary)",
                transition: "border-color 150ms",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLLabelElement).style.borderColor = "var(--mb-black)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLLabelElement).style.borderColor = "var(--border)")
              }
            >
              <span style={{ fontSize: 18 }}>📎</span>
              {pendingFile ? pendingFile.name : "Attach an image…"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
            {previewUrl && (
              <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 200,
                    objectFit: "contain",
                    borderRadius: 8,
                    border: "1.5px solid var(--mb-black)",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  onClick={() => { setPendingFile(null); setPreviewUrl(null); }}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "var(--mb-black)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    fontSize: 14,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-muted)",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--bg-surface)",
  border: "1.5px solid var(--mb-black)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13.5,
  outline: "none",
  fontFamily: "inherit",
  boxShadow: "0 2px 0 0 var(--mb-black)",
};

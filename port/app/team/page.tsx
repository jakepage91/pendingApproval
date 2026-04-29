"use client";

import { useEffect, useState, useCallback } from "react";
import { Item, TeamMember, ItemType, Priority } from "@/lib/types";
import { ItemRow } from "@/components/ItemRow";
import { PriorityDot, TypeBadge, StatusBadge } from "@/components/Badges";
import { Toast, useToast } from "@/components/Toast";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";

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
    fetch("/api/seed", { method: "POST" }).then(() => fetchItems());
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
      setPanelOpen(false);
      addToast("Item closed.");
    }
  };

  if (showUserPicker) {
    return <UserPicker onSelect={selectUser} />;
  }

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
            const labels = {
              mine: "My Requests",
              open: "All Open",
              resolved: "Resolved",
            };
            const active = navSection === section;
            return (
              <button
                key={section}
                onClick={() => {
                  setNavSection(section);
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
                {labels[section]}
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
          <div
            style={{
              textAlign: "center",
              marginTop: 8,
              fontSize: "11px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            ⌘N
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 0", minWidth: 0 }}>
          <div style={{ padding: "0 28px 16px", display: "flex", alignItems: "baseline", gap: 14 }}>
            <h2 className="display" style={{ fontSize: 28, color: "var(--text-primary)" }}>
              {navSection === "mine" ? "My Requests" : navSection === "open" ? "All Open" : "Resolved"}
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
          {selectedItem && (
            <TeamDetailPanel
              item={selectedItem}
              currentUser={currentUser}
              onClose={() => setPanelOpen(false)}
              onCloseItem={closeItem}
            />
          )}
        </div>
      </main>

      {showNewModal && currentUser && (
        <NewRequestModal
          submittedBy={currentUser}
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

function TeamDetailPanel({
  item,
  currentUser,
  onClose,
  onCloseItem,
}: {
  item: Item;
  currentUser: TeamMember | null;
  onClose: () => void;
  onCloseItem: () => void;
}) {
  const canClose = item.submittedBy === currentUser && item.status !== "closed";

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

      <Section label="Context">{item.context}</Section>
      {item.additionalInfo && <Section label="Additional Info">{item.additionalInfo}</Section>}

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

      {canClose && (
        <div style={{ marginTop: 24 }}>
          <button onClick={onCloseItem} className="btn">
            Close item
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
};

function NewRequestModal({
  submittedBy,
  onClose,
  onSubmit,
}: {
  submittedBy: TeamMember;
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
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.context.trim()) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "2px solid var(--mb-black)",
          borderRadius: 14,
          padding: 28,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 6px 0 0 var(--mb-black)",
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

import { Priority, ItemType, Status } from "@/lib/types";

export function PriorityDot({ priority }: { priority: Priority }) {
  const colors: Record<Priority, string> = {
    urgent: "var(--priority-urgent)",
    high: "var(--priority-high)",
    normal: "var(--priority-normal)",
    low: "var(--priority-low)",
  };
  return (
    <span
      title={priority}
      style={{
        display: "inline-block",
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: colors[priority],
        border: "1.2px solid var(--mb-black)",
        flexShrink: 0,
      }}
    />
  );
}

export function TypeBadge({ type }: { type: ItemType }) {
  const colors: Record<ItemType, string> = {
    approval: "var(--type-approval)",
    question: "var(--type-question)",
    design: "var(--type-design)",
  };
  const labels: Record<ItemType, string> = {
    approval: "Approval",
    question: "Question",
    design: "Design",
  };
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: colors[type],
        background: `color-mix(in oklab, ${colors[type]} 14%, transparent)`,
        border: `1px solid color-mix(in oklab, ${colors[type]} 40%, transparent)`,
        borderRadius: "999px",
        padding: "2px 9px",
        lineHeight: "16px",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {labels[type]}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const colors: Record<Status, string> = {
    open: "var(--status-open)",
    inprogress: "var(--status-inprogress)",
    decided: "var(--status-decided)",
    closed: "var(--status-closed)",
  };
  const labels: Record<Status, string> = {
    open: "Open",
    inprogress: "In Progress",
    decided: "Decided",
    closed: "Closed",
  };
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: colors[status],
        background: `color-mix(in oklab, ${colors[status]} 14%, transparent)`,
        border: `1px solid color-mix(in oklab, ${colors[status]} 40%, transparent)`,
        borderRadius: "999px",
        padding: "2px 9px",
        lineHeight: "16px",
      }}
    >
      {labels[status]}
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: Priority }) {
  const labels: Record<Priority, string> = {
    urgent: "Urgent",
    high: "High",
    normal: "Normal",
    low: "Low",
  };
  const colors: Record<Priority, string> = {
    urgent: "var(--priority-urgent)",
    high: "var(--priority-high)",
    normal: "var(--priority-normal)",
    low: "var(--priority-low)",
  };
  return (
    <span style={{ color: colors[priority], fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em" }}>
      {labels[priority]}
    </span>
  );
}

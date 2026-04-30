import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#f36869",
  high: "#ff8c42",
  normal: "#756df3",
  low: "#aaa",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const TYPE_LABEL: Record<string, string> = {
  approval: "Approval",
  question: "Question",
  design: "Design",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Item = Awaited<ReturnType<typeof getTopItems>>[number];

async function getTopItems(person: string) {
  const items = await prisma.item.findMany({
    where: {
      submittedBy: person,
      status: { in: ["open", "inprogress"] },
    },
    orderBy: { submittedAt: "asc" },
  });
  return items
    .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9))
    .slice(0, 8);
}

function groupByPriority(items: Item[]): [string, Item[]][] {
  const groups: Record<string, Item[]> = {};
  for (const item of items) {
    if (!groups[item.priority]) groups[item.priority] = [];
    groups[item.priority].push(item);
  }
  return (["urgent", "high", "normal", "low"] as const)
    .filter((p) => groups[p]?.length)
    .map((p) => [p, groups[p]]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ person: string }>;
}): Promise<Metadata> {
  const { person } = await params;
  const name = capitalize(person);
  const items = await getTopItems(person);
  const count = items.length;

  const title = count > 0
    ? `${name} is waiting for your decision on ${count} topic${count === 1 ? "" : "s"}`
    : `${name} has no pending requests`;

  // Group by priority for the description
  const groups = groupByPriority(items);
  const description = groups
    .map(([priority, group]) =>
      `${PRIORITY_LABEL[priority]}:\n${group.map((i) => `• ${i.title}`).join("\n")}`
    )
    .join("\n\n");

  const appUrl = process.env.AUTH_URL ?? "https://approvalpending.vercel.app";
  const imageUrl = `${appUrl}/portraits/${person}.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: imageUrl, width: 400, height: 400 }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person } = await params;
  const name = capitalize(person);
  const items = await getTopItems(person);
  const groups = groupByPriority(items);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              marginBottom: 14,
            }}
          >
            ApprovalPending
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 5vw, 40px)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: 10,
            }}
          >
            {items.length > 0
              ? <>{name} is waiting on <span style={{ color: "var(--accent)" }}>your decision</span></>
              : <>{name} has no pending requests</>}
          </h1>
          {items.length > 0 && (
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.5 }}>
              {items.length} open request{items.length === 1 ? "" : "s"} · Sign in to respond.
            </p>
          )}
        </div>

        {/* Grouped by priority */}
        {groups.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {groups.map(([priority, group]) => (
              <div key={priority}>
                {/* Priority section header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    paddingBottom: 8,
                    borderBottom: `2px solid ${PRIORITY_COLOR[priority]}`,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: PRIORITY_COLOR[priority],
                      flexShrink: 0,
                      border: "1.5px solid var(--mb-black)",
                      boxShadow: `0 0 0 3px ${PRIORITY_COLOR[priority]}33`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: PRIORITY_COLOR[priority],
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {PRIORITY_LABEL[priority]}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: PRIORITY_COLOR[priority],
                      background: `${PRIORITY_COLOR[priority]}1a`,
                      border: `1px solid ${PRIORITY_COLOR[priority]}44`,
                      borderRadius: 999,
                      padding: "1px 8px",
                      fontWeight: 600,
                    }}
                  >
                    {group.length}
                  </span>
                </div>

                {/* Items under this priority */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "var(--bg-surface)",
                        border: "2px solid var(--mb-black)",
                        borderLeft: `4px solid ${PRIORITY_COLOR[item.priority]}`,
                        borderRadius: 10,
                        padding: "12px 16px",
                        boxShadow: "0 3px 0 0 var(--mb-black)",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.3 }}>
                        {item.title}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: item.context ? 6 : 0 }}>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {TYPE_LABEL[item.type] ?? item.type}
                        </span>
                      </div>
                      {item.context && (
                        <p
                          style={{
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            lineHeight: 1.55,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            margin: 0,
                          }}
                        >
                          {item.context}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--text-muted)",
              fontSize: 15,
              border: "2px dashed var(--border)",
              borderRadius: 14,
            }}
          >
            All caught up 🎉
          </div>
        )}

        <p
          style={{
            textAlign: "center",
            marginTop: 32,
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Read-only preview · Sign in at{" "}
          <a href="/login" style={{ color: "var(--accent)" }}>
            ApprovalPending
          </a>{" "}
          to respond
        </p>
      </div>
    </div>
  );
}

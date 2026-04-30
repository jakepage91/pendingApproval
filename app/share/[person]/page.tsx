import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#f36869",
  high: "#ff8c42",
  normal: "#756df3",
  low: "#aaa",
};

const TYPE_LABEL: Record<string, string> = {
  approval: "Approval",
  question: "Question",
  design: "Design",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
    .slice(0, 5);
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

  const description = items.map((i, idx) => `${idx + 1}. ${i.title}`).join("\n");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
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
              Top {items.length} open request{items.length === 1 ? "" : "s"}, sorted by priority.
              <br />
              Sign in to respond.
            </p>
          )}
        </div>

        {/* Items list */}
        {items.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "2px solid var(--mb-black)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 4px 0 0 var(--mb-black)",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: PRIORITY_COLOR[item.priority] ?? "var(--accent)",
                    border: "2px solid var(--mb-black)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 13,
                    color: "#fff",
                    marginTop: 2,
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.3 }}>
                    {item.title}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: PRIORITY_COLOR[item.priority],
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {item.priority}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {TYPE_LABEL[item.type] ?? item.type}
                    </span>
                  </div>
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      lineHeight: 1.55,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.context}
                  </p>
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
            marginTop: 28,
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

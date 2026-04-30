"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOut } from "next-auth/react";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 28px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-surface)",
        }}
      >
        <Logo size={18} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
            }}
          >
            pendingApproval
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              border: "1.5px solid var(--mb-black)",
              background: "var(--bg-surface)",
              boxShadow: "0 2px 0 0 var(--mb-black)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "transform 80ms ease, box-shadow 80ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 3px 0 0 var(--mb-black)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 0 0 var(--mb-black)";
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          gap: 40,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 720 }}>
          <span className="eyebrow" style={{ marginBottom: 24 }}>
            Internal · MetalBear
          </span>
          <h1
            className="display"
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              color: "var(--text-primary)",
              marginTop: 24,
              marginBottom: 16,
            }}
          >
            Where are you headed?
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 16,
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Submit decisions, approvals, and questions on the team side — or
            triage what&rsquo;s waiting on the manager board.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            width: "100%",
            maxWidth: 760,
          }}
        >
          <PortalCard
            href="/team"
            kicker="Team Portal"
            title="Submit a request"
            body="Approvals, questions, design decisions — for Jake, Arsh, or Ioana."
            cta="Enter as a teammate"
            tone="purple"
          />
          <PortalCard
            href="/manager"
            kicker="Manager"
            title="Manager board"
            body="Triage incoming work, respond, and move items through the pipeline."
            cta="Open manager view"
            tone="yellow"
          />
        </div>
      </main>

      <footer
        style={{
          padding: "16px 28px",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: 11,
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
        }}
      >
        © MetalBear — internal tool
      </footer>
    </div>
  );
}

function PortalCard({
  href,
  kicker,
  title,
  body,
  cta,
  tone,
}: {
  href: string;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  tone: "purple" | "yellow";
}) {
  const accentColor = tone === "purple" ? "var(--mb-purple)" : "var(--mb-yellow)";
  const accentInk = tone === "purple" ? "#fff" : "#000";

  return (
    <Link
      href={href}
      style={{
        display: "block",
        background: "var(--bg-surface)",
        border: "2px solid var(--mb-black)",
        borderRadius: 14,
        padding: 24,
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 4px 0 0 var(--mb-black)",
        transition: "transform 120ms ease, box-shadow 120ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 6px 0 0 var(--mb-black)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 4px 0 0 var(--mb-black)";
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: accentColor,
          color: accentInk,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "4px 10px",
          borderRadius: 999,
          border: "1.5px solid var(--mb-black)",
          marginBottom: 18,
        }}
      >
        {kicker}
      </div>
      <h2
        className="display"
        style={{
          fontSize: 28,
          color: "var(--text-primary)",
          marginBottom: 8,
          lineHeight: 1.1,
        }}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 14,
          lineHeight: 1.55,
          marginBottom: 18,
        }}
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-primary)",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {cta} <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

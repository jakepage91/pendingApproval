"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Left panel — branding */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 48px",
          position: "relative",
        }}
      >
        {/* Background accent blob */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-10%",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(117,109,243,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-5%",
            left: "-5%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,203,125,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* App name */}
        <div style={{ textAlign: "center", maxWidth: 520, position: "relative" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              marginBottom: 20,
            }}
          >
            MetalBear Internal
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(52px, 8vw, 88px)",
              fontWeight: 800,
              lineHeight: 0.95,
              color: "var(--text-primary)",
              marginBottom: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Approval
            <br />
            <span style={{ color: "var(--accent)" }}>Pending</span>
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: 380,
              margin: "0 auto 48px",
            }}
          >
            Submit decisions, questions, and approvals to your managers — and get
            clarity fast.
          </p>

          {/* Sign-in box */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "2px solid var(--mb-black)",
              borderRadius: 16,
              padding: "28px 32px",
              boxShadow: "0 6px 0 0 var(--mb-black)",
              maxWidth: 380,
              margin: "0 auto",
            }}
          >
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  background: "rgba(243,104,105,0.1)",
                  border: "1px solid rgba(243,104,105,0.4)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--mb-blush)",
                  fontWeight: 600,
                }}
              >
                {error === "AccessDenied"
                  ? "Only @metalbear.com accounts can sign in."
                  : "Something went wrong. Please try again."}
              </div>
            )}

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                marginBottom: 16,
                textAlign: "left",
              }}
            >
              Sign in to continue
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "13px 20px",
                background: "var(--bg-base)",
                border: "1.5px solid var(--mb-black)",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
                cursor: "pointer",
                boxShadow: "0 3px 0 0 var(--mb-black)",
                transition: "transform 80ms ease, box-shadow 80ms ease",
                fontFamily: "var(--font-sans)",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget;
                b.style.transform = "translateY(-1px)";
                b.style.boxShadow = "0 4px 0 0 var(--mb-black)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget;
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "0 3px 0 0 var(--mb-black)";
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p
              style={{
                marginTop: 14,
                fontSize: 11,
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              @metalbear.com accounts only
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — team portraits */}
      <div
        style={{
          width: "38%",
          minWidth: 300,
          background: "var(--bg-surface)",
          borderLeft: "2px solid var(--mb-black)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: 40,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            alignSelf: "flex-start",
          }}
        >
          Your managers
        </div>

        <ManagerCard
          name="Lorena"
          title="Engineering Manager"
          imageSrc="/portraits/lorena.png"
          accent="var(--accent)"
        />
        <ManagerCard
          name="Eyal"
          title="Engineering Manager"
          imageSrc="/portraits/eyal.png"
          accent="var(--mb-yellow)"
        />

        {/* Decorative yellow blob */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,203,125,0.22)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

function ManagerCard({
  name,
  title,
  imageSrc,
  accent,
}: {
  name: string;
  title: string;
  imageSrc: string;
  accent: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 260,
        background: "var(--bg-base)",
        border: "2px solid var(--mb-black)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 5px 0 0 var(--mb-black)",
      }}
    >
      <div
        style={{
          height: 200,
          background: `linear-gradient(135deg, ${accent}22 0%, ${accent}44 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
          }}
          onError={(e) => {
            // Fallback to initials if image not yet uploaded
            const el = e.currentTarget;
            el.style.display = "none";
            const parent = el.parentElement;
            if (parent) {
              const fallback = parent.querySelector(".fallback") as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }
          }}
        />
        <div
          className="fallback"
          style={{
            display: "none",
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontSize: 64,
            fontWeight: 800,
            color: accent,
          }}
        >
          {name[0]}
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginTop: 2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

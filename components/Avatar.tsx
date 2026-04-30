import { TeamMember } from "@/lib/types";

const PORTRAITS: Record<string, string> = {
  jake:   "/portraits/jake.png",
  arsh:   "/portraits/arsh.png",
  ioana:  "/portraits/ioana.png",
  lorena: "/portraits/lorena.png",
  eyal:   "/portraits/eyal.png",
};

const AVATAR_GRADIENTS: Record<string, { from: string; to: string; ink: string }> = {
  jake:   { from: "#756DF3", to: "#E4E3FD", ink: "#fff" },
  arsh:   { from: "#FFCB7D", to: "#F36869", ink: "#000" },
  ioana:  { from: "#232141", to: "#756DF3", ink: "#fff" },
  lorena: { from: "#E4E3FD", to: "#FFCB7D", ink: "#000" },
  eyal:   { from: "#F36869", to: "#FFCB7D", ink: "#000" },
};

type AvatarProps = {
  name: TeamMember | "lorena" | "eyal" | string | null | undefined;
  size?: number;
  ring?: boolean;
};

export function Avatar({ name, size = 24, ring = false }: AvatarProps) {
  const key = (name || "").toLowerCase();
  const g = AVATAR_GRADIENTS[key] || AVATAR_GRADIENTS.jake;
  const initial = (name || "?").charAt(0).toUpperCase();
  const portrait = PORTRAITS[key];

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: ring ? "1.5px solid var(--mb-black)" : "1px solid rgba(0,0,0,0.18)",
    boxShadow: ring ? "0 1px 0 0 var(--mb-black)" : "none",
    overflow: "hidden",
    background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
  };

  if (portrait) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <span style={containerStyle} title={(name || "").charAt(0).toUpperCase() + (name || "").slice(1)}>
        <img
          src={portrait}
          alt={name ?? ""}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
        />
      </span>
    );
  }

  return (
    <span
      title={(name || "").charAt(0).toUpperCase() + (name || "").slice(1)}
      style={{
        ...containerStyle,
        color: g.ink,
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        fontFamily: "var(--font-sans)",
      }}
    >
      {initial}
    </span>
  );
}

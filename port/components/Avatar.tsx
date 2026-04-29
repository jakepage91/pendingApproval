import { TeamMember } from "@/lib/types";

/**
 * Avatar gradients use the MetalBear palette directly so they harmonize
 * with the rest of the UI rather than feeling arbitrary.
 */
const AVATAR_GRADIENTS: Record<TeamMember | "lorena", { from: string; to: string; ink: string }> = {
  jake: { from: "#756DF3", to: "#E4E3FD", ink: "#fff" },     // Main → Medium purple
  arsh: { from: "#FFCB7D", to: "#F36869", ink: "#000" },     // Yellow → Blush
  ioana: { from: "#232141", to: "#756DF3", ink: "#fff" },    // Dark purple → Main
  lorena: { from: "#E4E3FD", to: "#FFCB7D", ink: "#000" },   // Medium purple → Yellow
};

type AvatarProps = {
  name: TeamMember | "lorena" | string | null | undefined;
  size?: number;
  ring?: boolean;
};

export function Avatar({ name, size = 24, ring = false }: AvatarProps) {
  const key = (name || "").toLowerCase() as keyof typeof AVATAR_GRADIENTS;
  const g = AVATAR_GRADIENTS[key] || AVATAR_GRADIENTS.jake;
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span
      title={(name || "").charAt(0).toUpperCase() + (name || "").slice(1)}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
        color: g.ink,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.42),
        flexShrink: 0,
        border: ring ? "1.5px solid var(--mb-black)" : "1px solid rgba(0,0,0,0.18)",
        boxShadow: ring ? "0 1px 0 0 var(--mb-black)" : "none",
        fontFamily: "var(--font-sans)",
      }}
    >
      {initial}
    </span>
  );
}

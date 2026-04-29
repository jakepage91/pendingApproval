import Image from "next/image";

type LogoProps = {
  /** 'dark' = ink-on-light bg, 'light' = white-on-dark bg */
  variant?: "dark" | "light";
  /** Approximate height in px; preserves aspect. */
  size?: number;
  showText?: boolean;
};

export function Logo({ variant = "dark", size = 18, showText = true }: LogoProps) {
  const src = showText
    ? variant === "light"
      ? "/brand/metalbear-logo-white.png"
      : "/brand/metalbear-logo.png"
    : variant === "light"
    ? "/brand/metalbear-mark-white.png"
    : "/brand/metalbear-mark.png";

  // wordmark aspect 432:117 ≈ 3.69; mark is square (117:117)
  const height = showText ? Math.round(size * 1.7) : size + 10;
  const width = showText ? Math.round(height * (432 / 117)) : height;

  return (
    <Image
      src={src}
      alt="MetalBear"
      width={width}
      height={height}
      style={{ height, width: "auto", display: "inline-block", verticalAlign: "middle" }}
      priority
    />
  );
}

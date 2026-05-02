import { type HTMLAttributes } from "react";

/* ── Heading ─────────────────────────────────────── */

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
}

const headingSizes: Record<HeadingLevel, string> = {
  h1: "text-3xl font-semibold tracking-tight",
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-xl font-medium",
  h4: "text-lg font-medium",
};

export function Heading({
  as: Tag = "h1",
  className = "",
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={`text-text ${headingSizes[Tag]} ${className}`}
      {...props}
    />
  );
}

/* ── Text ────────────────────────────────────────── */

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "base" | "lg";
}

const textColors = {
  primary: "text-text",
  secondary: "text-text-secondary",
};

const textSizes = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

export function Text({
  variant = "primary",
  size = "base",
  className = "",
  ...props
}: TextProps) {
  return (
    <p
      className={`${textColors[variant]} ${textSizes[size]} ${className}`}
      {...props}
    />
  );
}

"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { Magnetic } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/utilities/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: cn(
    "relative overflow-hidden border border-glow/45 bg-gradient-to-b from-ice to-glow",
    "text-midnight shadow-[0_0_0_0_rgba(0,245,212,0)] ",
    "hover:shadow-[0_10px_40px_-12px_rgba(0,245,212,0.55)]",
    "active:translate-y-px",
  ),
  secondary: cn(
    "border border-hull-line bg-hull/35 text-frost backdrop-blur-md",
    "hover:border-glow/60 hover:bg-hull/60 hover:text-frost",
    "active:translate-y-px",
  ),
  ghost: cn(
    "border border-transparent bg-transparent text-silver",
    "hover:text-frost active:translate-y-px",
  ),
  danger: cn(
    "border border-alert/45 bg-alert/12 text-alert",
    "hover:border-alert/70 hover:bg-alert/20",
  ),
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.625rem] gap-2",
  md: "h-12 px-6 text-[0.6875rem] gap-2.5",
  lg: "h-14 px-8 text-xs gap-3",
};

const BASE = cn(
  "group/cta relative inline-flex select-none items-center justify-center",
  "font-mono font-medium uppercase tracking-[0.18em] whitespace-nowrap",
  "rounded-[2px] transition-[color,background-color,border-color,box-shadow,transform]",
  "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
  "disabled:pointer-events-none disabled:opacity-45",
);

/** Light sweep that crosses the primary CTA on hover (§32 frost shimmer). */
function Sheen({ variant }: { variant: Variant }) {
  if (variant !== "primary") return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-opacity duration-300 group-hover/cta:opacity-100 group-hover/cta:animate-sweep"
      style={{
        background:
          "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)",
      }}
    />
  );
}

function Arrow({ variant, icon }: { variant: Variant; icon?: "right" | "upRight" }) {
  const Icon = icon === "upRight" ? ArrowUpRight : ArrowRight;
  return (
    <Icon
      size={variant === "ghost" ? 15 : 14}
      strokeWidth={2}
      aria-hidden
      className="shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:translate-x-1"
    />
  );
}

interface CtaProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  /** Magnetic attraction only makes sense on pointer devices with room to move. */
  magnetic?: boolean;
  arrow?: boolean | "right" | "upRight";
  className?: string;
  external?: boolean;
  onClick?: () => void;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * The single call-to-action component (§14, §32).
 * Renders as a `<button>` or a Next `<Link>` from the same API so spacing,
 * type and motion stay identical wherever it appears.
 */
export function Cta({
  children,
  variant = "primary",
  size = "md",
  href,
  magnetic = variant === "primary",
  arrow = variant !== "ghost",
  className,
  external = false,
  onClick,
  type = "button",
  disabled = false,
  ariaLabel,
}: CtaProps) {
  const [pressed, setPressed] = useState(false);
  const arrowKind = arrow === true ? "right" : arrow || undefined;

  const content = (
    <>
      <Sheen variant={variant} />
      <span className="relative z-10">{children}</span>
      {arrowKind ? (
        <span className="relative z-10">
          <Arrow variant={variant} icon={arrowKind} />
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    pressed && "scale-[0.985]",
    className,
  );

  const shell = (inner: ReactNode) =>
    magnetic && !disabled ? (
      <Magnetic className="inline-flex">{inner}</Magnetic>
    ) : (
      inner
    );

  if (href) {
    const linkProps = {
      className: classes,
      onClick: () => {
        setPressed(true);
        window.setTimeout(() => setPressed(false), 180);
        onClick?.();
      },
      "aria-label": ariaLabel,
    };

    return shell(
      external ? (
        <a href={href} target="_blank" rel="noreferrer noopener" {...linkProps}>
          {content}
        </a>
      ) : (
        <Link href={href} prefetch={false} {...linkProps}>
          {content}
        </Link>
      ),
    );
  }

  return shell(
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={() => {
        setPressed(true);
        window.setTimeout(() => setPressed(false), 180);
        onClick?.();
      }}
    >
      {content}
    </button>,
  );
}

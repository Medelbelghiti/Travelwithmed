import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "accent" | "white";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/30 hover:shadow-md",
  secondary: "bg-brand-light text-white hover:bg-brand/40",
  outline: "border border-line bg-card text-ink hover:border-brand hover:text-brand",
  ghost: "text-ink-soft hover:text-brand hover:bg-brand-light",
  accent: "bg-accent text-white hover:bg-accent-dark shadow-sm shadow-accent/20",
  white: "bg-white text-brand-dark hover:bg-sand shadow-md",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-4 py-2",
  md: "text-sm px-6 py-3",
  lg: "text-base px-8 py-4",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);
  if (props.href !== undefined && "href" in props) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...(props as ButtonAsButton)}>
      {children}
    </button>
  );
}
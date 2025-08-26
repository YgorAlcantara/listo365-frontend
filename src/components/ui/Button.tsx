import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style */
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  /** Visual size */
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and disables interactions */
  loading?: boolean;
  /** Full width */
  block?: boolean;
};

const base =
  "inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
  secondary:
    "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900",
  outline:
    "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-400",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
  ghost: "text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-400",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "outline",
      size = "md",
      loading = false,
      disabled,
      block = false,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          block && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span
            className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

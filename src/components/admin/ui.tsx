import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  const variants = {
    primary: "bg-accent text-cream hover:bg-accent-dark",
    secondary: "border border-line bg-white hover:bg-sand",
    danger: "text-red-700 hover:bg-red-50",
  };
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>;
}

// src/components/ui/Badge.tsx
import { clsx } from "clsx";
export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700", className)}>
      {children}
    </span>
  );
}
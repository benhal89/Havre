// src/components/ui/Card.tsx
import { clsx } from "clsx";
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("rounded-2xl border bg-white shadow-sm", className)}>{children}</div>;
}
export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}
export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
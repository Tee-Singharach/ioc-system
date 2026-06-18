import type { ReactNode } from "react";

type CardVariant = "default" | "muted";

export function Card({
  children,
  className = "",
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}) {
  return (
    <div className={`ioc-card ${variant === "muted" ? "ioc-card-muted" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ioc-card-header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ioc-card-body ${className}`}>{children}</div>;
}

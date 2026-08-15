import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Inbox,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Card, EmptyState, MetricCard } from "@/components/ui";

export function ModuleSurface({
  children,
  count,
  description,
  title,
}: Readonly<{
  children: ReactNode;
  count?: number;
  description: string;
  title: string;
}>) {
  return (
    <Card className="ops-surface">
      <header className="ops-surface__header">
        <div>
          <p className="ops-kicker">Vue opérationnelle</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {typeof count === "number" ? <Badge>{count}</Badge> : null}
      </header>
      {children}
    </Card>
  );
}

export function RecordGrid({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="ops-record-grid">{children}</div>;
}

export function RecordCard({
  description,
  meta,
  status,
  title,
}: Readonly<{
  title: string;
  description?: string | null;
  meta?: string | null;
  status: string;
}>) {
  const tone =
    status === "connected" ||
    status === "passed" ||
    status === "confirmed" ||
    status === "won"
      ? "success"
      : status === "failed" || status === "disconnected" || status === "lost"
        ? "danger"
        : status === "warning" || status === "degraded" || status === "pending"
          ? "warning"
          : "neutral";
  return (
    <article className="ops-record">
      <div className="ops-record__top">
        <h3>{title}</h3>
        <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>
      </div>
      {description ? <p>{description}</p> : null}
      {meta ? <span className="ops-record__meta">{meta}</span> : null}
    </article>
  );
}

export function OperationsEmpty({
  description,
  kind = "default",
  title,
}: Readonly<{
  description: string;
  kind?: "default" | "inbox" | "calendar" | "shield";
  title: string;
}>) {
  const icons = {
    default: <PlugZap aria-hidden size={21} />,
    inbox: <Inbox aria-hidden size={21} />,
    calendar: <CalendarDays aria-hidden size={21} />,
    shield: <ShieldCheck aria-hidden size={21} />,
  };
  return (
    <div className="ops-empty">
      <EmptyState description={description} icon={icons[kind]} title={title} />
    </div>
  );
}

export function MetricStrip({
  metrics,
}: Readonly<{
  metrics: readonly Readonly<{
    label: string;
    value: string;
    detail: string;
  }>[];
}>) {
  return (
    <div className="ops-metrics">
      {metrics.map((metric) => (
        <MetricCard
          detail={metric.detail}
          key={metric.label}
          label={metric.label}
          value={metric.value}
        />
      ))}
    </div>
  );
}

export function ReadinessNotice({
  ready,
  text,
}: Readonly<{ ready: boolean; text: string }>) {
  return (
    <div className={`ops-notice ${ready ? "ops-notice--ready" : ""}`}>
      {ready ? (
        <CheckCircle2 aria-hidden size={18} />
      ) : (
        <AlertTriangle aria-hidden size={18} />
      )}
      <span>{text}</span>
    </div>
  );
}

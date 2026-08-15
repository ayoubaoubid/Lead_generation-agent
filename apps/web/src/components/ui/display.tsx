import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
};
export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn("ui-badge", `ui-badge--${tone}`, className)}
      {...props}
    />
  );
}

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  status?: "online" | "away" | "offline";
};
export function Avatar({
  className,
  name,
  size = "md",
  src,
  status,
  ...props
}: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-label={status ? `${name}, ${status}` : name}
      className={cn("ui-avatar", `ui-avatar--${size}`, className)}
      role="img"
      {...props}
    >
      {src ? (
        <span
          aria-hidden
          className="ui-avatar-image"
          style={{ backgroundImage: `url(${src})` }}
        />
      ) : (
        initials
      )}
      {status ? (
        <span
          aria-hidden
          className={cn("ui-avatar-status", `ui-status-dot--${status}`)}
        />
      ) : null}
    </span>
  );
}

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};
export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "ui-card",
        interactive && "ui-card--interactive",
        className,
      )}
      {...props}
    />
  );
}

export type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  detail?: string;
  icon?: ReactNode;
};
export function MetricCard({
  change,
  detail,
  icon,
  label,
  trend = "neutral",
  value,
}: MetricCardProps) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="ui-metric-card">
      <div className="ui-metric-top">
        <span>{label}</span>
        {icon ? <span className="ui-icon-tile">{icon}</span> : null}
      </div>
      <strong className="ui-metric-value">{value}</strong>
      {change || detail ? (
        <div className="ui-metric-foot">
          {change ? (
            <span className={cn("ui-trend", `ui-trend--${trend}`)}>
              {trend !== "neutral" ? <TrendIcon aria-hidden size={13} /> : null}
              {change}
            </span>
          ) : null}
          {detail ? <span>{detail}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}

export type StatusIndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  status: "active" | "pending" | "paused" | "error" | "offline";
  label: string;
};
export function StatusIndicator({
  className,
  label,
  status,
  ...props
}: StatusIndicatorProps) {
  return (
    <span className={cn("ui-status", className)} {...props}>
      <span
        aria-hidden
        className={cn("ui-status-dot", `ui-status-dot--${status}`)}
      />
      {label}
    </span>
  );
}

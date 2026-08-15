"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { Button } from "./button";

export type TabItem = {
  value: string;
  label: string;
  content: React.ReactNode;
  badge?: string;
};
export function Tabs({
  defaultValue,
  items,
}: {
  defaultValue?: string;
  items: TabItem[];
}) {
  return (
    <TabsPrimitive.Root
      className="ui-tabs"
      {...((defaultValue ?? items[0]?.value)
        ? { defaultValue: defaultValue ?? items[0]?.value ?? "" }
        : {})}
    >
      <TabsPrimitive.List
        aria-label="Sections"
        className="ui-tabs-list"
        tabIndex={0}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            className="ui-tab"
            key={item.value}
            value={item.value}
          >
            {item.label}
            {item.badge ? <span>{item.badge}</span> : null}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          className="ui-tab-content"
          key={item.value}
          value={item.value}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
};
export function Pagination({
  onPageChange,
  page,
  totalPages,
}: PaginationProps) {
  const pages = Array.from(
    { length: Math.min(totalPages, 5) },
    (_, index) => index + 1,
  );
  return (
    <nav aria-label="Pagination" className="ui-pagination">
      <Button
        aria-label="Page précédente"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        size="icon"
        variant="secondary"
      >
        <ChevronLeft aria-hidden size={16} />
      </Button>
      <div className="ui-pagination-pages">
        {pages.map((item) => (
          <button
            aria-current={item === page ? "page" : undefined}
            className="ui-page-button"
            key={item}
            onClick={() => onPageChange?.(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <Button
        aria-label="Page suivante"
        disabled={page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
        size="icon"
        variant="secondary"
      >
        <ChevronRight aria-hidden size={16} />
      </Button>
    </nav>
  );
}

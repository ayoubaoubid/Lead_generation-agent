"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";

import { cn } from "@/lib/ui/cn";

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="ui-table-wrap">
      <table className={cn("ui-table", className)} {...props} />
    </div>
  );
}
export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}
export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}
export function TableRow(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props} />;
}
export function TableHeaderCell(
  props: React.ThHTMLAttributes<HTMLTableCellElement>,
) {
  return <th {...props} />;
}
export function TableCell(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} />;
}

export type DataTableColumn<T> = {
  key: keyof T & string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "left" | "right";
};
export type DataTableProps<T extends { id: string }> = {
  columns: DataTableColumn<T>[];
  data: T[];
  caption: string;
  empty?: ReactNode;
};

export function DataTable<T extends { id: string }>({
  caption,
  columns,
  data,
  empty,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{
    key: keyof T & string;
    direction: "asc" | "desc";
  } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return data;
    return [...data].sort(
      (a, b) =>
        String(a[sort.key]).localeCompare(String(b[sort.key])) *
        (sort.direction === "asc" ? 1 : -1),
    );
  }, [data, sort]);
  const toggleSort = (key: keyof T & string) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  return (
    <Table>
      <caption className="sr-only">{caption}</caption>
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableHeaderCell
              className={
                column.align === "right" ? "ui-align-right" : undefined
              }
              key={column.key}
            >
              {column.sortable ? (
                <button
                  className="ui-sort-button"
                  onClick={() => toggleSort(column.key)}
                  type="button"
                >
                  {column.header}
                  {sort?.key === column.key ? (
                    sort.direction === "asc" ? (
                      <ArrowUp aria-hidden size={13} />
                    ) : (
                      <ArrowDown aria-hidden size={13} />
                    )
                  ) : (
                    <ChevronsUpDown aria-hidden size={13} />
                  )}
                </button>
              ) : (
                column.header
              )}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.length ? (
          sorted.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell
                  className={
                    column.align === "right" ? "ui-align-right" : undefined
                  }
                  key={column.key}
                >
                  {column.render ? column.render(row) : String(row[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length}>
              {empty ?? "Aucune donnée"}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

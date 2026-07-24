"use client";

import { Check, ChevronRight, X } from "lucide-react";
import {
  Dialog as DialogPrimitive,
  DropdownMenu,
  Tooltip as TooltipPrimitive,
} from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/ui/cn";
import { Button } from "./button";

export function Tooltip({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content className="ui-tooltip" sideOffset={7}>
            {content}
            <TooltipPrimitive.Arrow className="ui-tooltip-arrow" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export type DropdownItem =
  | {
      label: string;
      icon?: ReactNode;
      shortcut?: string;
      disabled?: boolean;
      danger?: boolean;
      onSelect?: () => void;
    }
  | { separator: true };
export function Dropdown({
  align = "end",
  items,
  trigger,
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "center" | "end";
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          className="ui-popover ui-dropdown"
          sideOffset={6}
        >
          {items.map((item, index) =>
            "separator" in item ? (
              <DropdownMenu.Separator
                className="ui-menu-separator"
                key={`separator-${index}`}
              />
            ) : (
              <DropdownMenu.Item
                className={cn(
                  "ui-menu-item",
                  item.danger && "ui-menu-item--danger",
                )}
                {...(item.disabled === undefined
                  ? {}
                  : { disabled: item.disabled })}
                key={item.label}
                {...(item.onSelect ? { onSelect: item.onSelect } : {})}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
              </DropdownMenu.Item>
            ),
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

type DialogShellProps = {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};
export function Dialog({
  children,
  description,
  footer,
  title,
  trigger,
}: DialogShellProps) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-overlay" />
        <DialogPrimitive.Content className="ui-dialog">
          <DialogHeader
            title={title}
            {...(description ? { description } : {})}
          />
          <div className="ui-dialog-body">{children}</div>
          {footer ? <div className="ui-dialog-footer">{footer}</div> : null}
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Fermer"
              className="ui-dialog-close"
              size="icon"
              variant="ghost"
            >
              <X aria-hidden size={18} />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Drawer({
  children,
  description,
  footer,
  side = "right",
  title,
  trigger,
}: DialogShellProps & { side?: "left" | "right" }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-overlay" />
        <DialogPrimitive.Content
          className={cn("ui-drawer", `ui-drawer--${side}`)}
        >
          <DialogHeader
            title={title}
            {...(description ? { description } : {})}
          />
          <div className="ui-dialog-body">{children}</div>
          {footer ? <div className="ui-dialog-footer">{footer}</div> : null}
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Fermer"
              className="ui-dialog-close"
              size="icon"
              variant="ghost"
            >
              <X aria-hidden size={18} />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function DialogHeader({
  description,
  title,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="ui-dialog-header">
      <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description>{description}</DialogPrimitive.Description>
      ) : null}
    </div>
  );
}

export function DropdownSubmenuExample() {
  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className="ui-menu-item">
        Statut
        <ChevronRight aria-hidden size={15} />
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent className="ui-popover ui-dropdown">
          <DropdownMenu.Item className="ui-menu-item">
            <Check aria-hidden size={15} />
            Actif
          </DropdownMenu.Item>
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

export type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
export const DialogClose = DialogPrimitive.Close;

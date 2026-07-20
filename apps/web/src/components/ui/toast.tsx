"use client";

import { CheckCircle2, X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = () => (
  <ToastPrimitive.Viewport className="ui-toast-viewport" />
);

export type ToastProps = ComponentProps<typeof ToastPrimitive.Root> & {
  title: string;
  description?: string;
  action?: ReactNode;
};
export function Toast({ action, description, title, ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root className="ui-toast" {...props}>
      <CheckCircle2 aria-hidden className="ui-toast-icon" size={19} />
      <div>
        <ToastPrimitive.Title className="ui-toast-title">
          {title}
        </ToastPrimitive.Title>
        {description ? (
          <ToastPrimitive.Description className="ui-toast-description">
            {description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      {action}
      <ToastPrimitive.Close
        aria-label="Fermer la notification"
        className="ui-toast-close"
      >
        <X aria-hidden size={16} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

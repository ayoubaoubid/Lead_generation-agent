"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Checkbox as CheckboxPrimitive,
  RadioGroup as RadioPrimitive,
  Select as SelectPrimitive,
  Switch as SwitchPrimitive,
} from "radix-ui";
import {
  forwardRef,
  useId,
  type ComponentProps,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/ui/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn("ui-input", className)}
      ref={ref}
      {...props}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        aria-invalid={invalid || undefined}
        className={cn("ui-input ui-textarea", className)}
        ref={ref}
        {...props}
      />
    );
  },
);

export type SelectOption = { label: string; value: string; disabled?: boolean };

export type SelectProps = ComponentProps<typeof SelectPrimitive.Root> & {
  options: SelectOption[];
  placeholder?: string;
  ariaLabel: string;
  invalid?: boolean;
};

export function Select({
  ariaLabel,
  invalid,
  options,
  placeholder = "Sélectionner",
  ...props
}: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        className="ui-input ui-select-trigger"
      >
        <SelectPrimitive.Value key="value" placeholder={placeholder} />
        <SelectPrimitive.Icon key="icon">
          <ChevronDown aria-hidden size={16} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="ui-popover ui-select-content"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="ui-menu-item ui-select-item"
                {...(option.disabled === undefined
                  ? {}
                  : { disabled: option.disabled })}
                key={option.value}
                value={option.value}
              >
                <SelectPrimitive.ItemText key="label">
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator key="indicator">
                  <Check aria-hidden size={15} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & {
  label: string;
  description?: string;
};

export function Checkbox({
  className,
  description,
  id: providedId,
  label,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return (
    <div className="ui-choice-row">
      <CheckboxPrimitive.Root
        className={cn("ui-checkbox", className)}
        id={id}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check aria-hidden size={14} strokeWidth={2.5} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div>
        <label className="ui-choice-label" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className="ui-choice-description">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export type RadioOption = {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
};
export type RadioGroupProps = ComponentProps<typeof RadioPrimitive.Root> & {
  label: string;
  options: RadioOption[];
};

export function RadioGroup({ label, options, ...props }: RadioGroupProps) {
  const id = useId();
  return (
    <fieldset className="ui-fieldset">
      <legend className="ui-label">{label}</legend>
      <RadioPrimitive.Root className="ui-radio-group" {...props}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <div className="ui-choice-row" key={option.value}>
              <RadioPrimitive.Item
                className="ui-radio"
                disabled={option.disabled}
                id={optionId}
                value={option.value}
              >
                <RadioPrimitive.Indicator className="ui-radio-indicator" />
              </RadioPrimitive.Item>
              <div>
                <label className="ui-choice-label" htmlFor={optionId}>
                  {option.label}
                </label>
                {option.description ? (
                  <p className="ui-choice-description">{option.description}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </RadioPrimitive.Root>
    </fieldset>
  );
}

export type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> & {
  label: string;
  description?: string;
};

export function Switch({
  description,
  id: providedId,
  label,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return (
    <div className="ui-switch-row">
      <div>
        <label className="ui-choice-label" htmlFor={id}>
          {label}
        </label>
        {description ? (
          <p className="ui-choice-description">{description}</p>
        ) : null}
      </div>
      <SwitchPrimitive.Root className="ui-switch" id={id} {...props}>
        <SwitchPrimitive.Thumb className="ui-switch-thumb" />
      </SwitchPrimitive.Root>
    </div>
  );
}

export type FormFieldProps = {
  label: string;
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function FormField({
  children,
  error,
  hint,
  htmlFor,
  label,
  optional,
}: FormFieldProps) {
  return (
    <div className="ui-form-field">
      <div className="ui-label-row">
        <label className="ui-label" htmlFor={htmlFor}>
          {label}
        </label>
        {optional ? <span className="ui-optional">Optionnel</span> : null}
      </div>
      {children}
      {error ? (
        <p className="ui-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

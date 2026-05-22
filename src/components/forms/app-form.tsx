import { createFormHook, createFormHookContexts } from "@tanstack/react-form-start";
import * as React from "react";

import { Button } from "#/components/ui/button";
import { cn } from "@/lib/utils";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

function FieldError({ errors }: { errors: unknown[] }) {
  if (!errors?.length) return null;

  return <p className="text-xs text-rose-600">{String(errors[0])}</p>;
}

function TextField({
  label,
  placeholder,
  className,
}: {
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const field = useFieldContext<string>();

  return (
    <label className={cn("space-y-1", className)}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={field.state.value ?? ""}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      <FieldError errors={field.state.meta.errors} />
    </label>
  );
}

function NumberField({
  label,
  step = "0.01",
  className,
}: {
  label: string;
  step?: string;
  className?: string;
}) {
  const field = useFieldContext<number>();

  return (
    <label className={cn("space-y-1", className)}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type="number"
        step={step}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={Number.isFinite(field.state.value) ? field.state.value : 0}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(Number(event.target.value))}
      />
      <FieldError errors={field.state.meta.errors} />
    </label>
  );
}

function SubmitButton({ children }: { children?: React.ReactNode }) {
  const form = useFormContext();

  return (
    <Button type="submit" disabled={form.state.isSubmitting}>
      {children ?? (form.state.isSubmitting ? "Saving..." : "Save changes")}
    </Button>
  );
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    NumberField,
  },
  formComponents: {
    SubmitButton,
  },
});

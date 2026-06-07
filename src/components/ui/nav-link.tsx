import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

const baseStyle =
  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition";
const activeStyle = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25";
const inactiveStyle = "text-slate-700 hover:bg-white hover:text-slate-900";

const navLinkVariants = cva(baseStyle, {
  variants: {
    variant: {
      inactive: inactiveStyle,
      active: activeStyle,
    },
  },
  defaultVariants: {
    variant: "inactive",
  },
});

function NavLink({
  className,
  variant = "inactive",
  asChild = true,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof navLinkVariants> & {
    asChild?: boolean;
  }) {
  return (
    <Slot.Root
      data-variant={variant}
      className={cn(navLinkVariants({ variant, className }))}
      {...props}
    />
  );
}

export { NavLink, navLinkVariants };

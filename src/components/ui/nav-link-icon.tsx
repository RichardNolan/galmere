import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

const baseStyle = "size-4 transition";
const activeStyle = "text-white";
const inactiveStyle = "text-emerald-700";

const navLinkIconVariants = cva(baseStyle, {
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

function NavLinkIcon({
  className,
  variant = "inactive",
  asChild = true,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof navLinkIconVariants> & {
    asChild?: boolean;
  }) {
  return (
    <Slot.Root
      data-variant={variant}
      className={cn(navLinkIconVariants({ variant, className }))}
      {...props}
    />
  );
}

export { NavLinkIcon, navLinkIconVariants };

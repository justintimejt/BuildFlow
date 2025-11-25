import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonGroupVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

export interface ButtonGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(buttonGroupVariants({ orientation }), className)}
        {...props}
      />
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

const buttonGroupSeparatorVariants = cva(
  "bg-border",
  {
    variants: {
      orientation: {
        horizontal: "w-px h-full",
        vertical: "h-px w-full",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

export interface ButtonGroupSeparatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupSeparatorVariants> {}

const ButtonGroupSeparator = React.forwardRef<
  HTMLDivElement,
  ButtonGroupSeparatorProps
>(({ className, orientation, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(buttonGroupSeparatorVariants({ orientation }), className)}
      {...props}
    />
  )
})
ButtonGroupSeparator.displayName = "ButtonGroupSeparator"

export interface ButtonGroupTextProps
  extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const ButtonGroupText = React.forwardRef<HTMLDivElement, ButtonGroupTextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    if (asChild) {
      return <div ref={ref} className={cn(className)} {...props} />
    }
    return (
      <div
        ref={ref}
        className={cn("px-3 py-2 text-sm", className)}
        {...props}
      />
    )
  }
)
ButtonGroupText.displayName = "ButtonGroupText"

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText }





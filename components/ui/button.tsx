import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-500/40 hover:bg-blue-500/50 text-white dark:bg-blue-600/30 dark:hover:bg-blue-600/40 border border-blue-400/30 dark:border-blue-500/30 backdrop-blur-sm",
        destructive: "bg-red-500/40 hover:bg-red-500/50 text-white dark:bg-red-600/30 dark:hover:bg-red-600/40 border border-red-400/30 dark:border-red-500/30 backdrop-blur-sm",
        outline: "border border-gray-300/30 dark:border-gray-700/30 bg-white/10 dark:bg-white/5 hover:bg-white/15 dark:hover:bg-white/10 backdrop-blur-sm",
        secondary: "bg-gray-400/20 text-gray-900 dark:bg-gray-700/30 dark:text-gray-50 hover:bg-gray-400/30 dark:hover:bg-gray-700/40 border border-gray-300/30 dark:border-gray-600/30 backdrop-blur-sm",
        ghost: "hover:bg-gray-400/20 dark:hover:bg-gray-700/30 hover:text-gray-900 dark:hover:text-gray-50 backdrop-blur-sm",
        link: "text-blue-500 underline-offset-4 hover:underline dark:text-blue-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

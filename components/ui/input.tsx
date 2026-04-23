import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 backdrop-blur-sm px-3 py-2 text-sm ring-offset-white/10 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:bg-white/15 dark:focus-visible:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-500/50 text-gray-900 dark:text-gray-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", onInput, ...props }, ref) => {
    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      if (type === "number") {
        const el = e.currentTarget;
        const original = el.value;
        const sign = original.startsWith("-") ? "-" : "";
        let rest = sign ? original.slice(1) : original;
        if (rest.startsWith("0")) {
          if (rest.length === 1) {
            // keep "0"
          } else if (rest[1] === ".") {
            // keep "0.xxx"
          } else {
            // strip leading zeros but leave at least one digit
            const stripped = rest.replace(/^0+/, "");
            rest = stripped === "" ? "0" : stripped;
            el.value = sign + rest;
          }
        }
      }
      onInput?.(e);
    };
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        onInput={handleInput}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";



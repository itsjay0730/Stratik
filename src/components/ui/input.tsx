import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  transform?: "uppercase" | "lowercase" | "none";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", transform = "none", onChange, ...props },
    ref
  ) => {
    const [value, setValue] = React.useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      if (transform === "uppercase") {
        newValue = newValue.toUpperCase();
      } else if (transform === "lowercase") {
        newValue = newValue.toLowerCase();
      }

      setValue(newValue);

      if (onChange) {
        onChange({
          ...e,
          target: { ...e.target, value: newValue },
        });
      }
    };

    return (
      <input
        type={type}
        value={value}
        onChange={handleChange}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

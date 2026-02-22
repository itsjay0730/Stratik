import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

const TooltipProvider = ({
  delayDuration = 200,
  children,
}: {
  delayDuration?: number;
  children: React.ReactNode;
}) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration}>
    {children}
  </TooltipPrimitive.Provider>
);

const Tooltip = ({
  children,
  open,
  onOpenChange,
  disabled = false,
}: TooltipProps) => {
  if (disabled) return <>{children}</>;

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </TooltipPrimitive.Root>
  );
};

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    side?: "top" | "bottom" | "left" | "right";
  }
>(({ className, sideOffset = 6, side = "top", ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    side={side}
    sideOffset={sideOffset}
    className={cn(
      "z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",
      "animate-in fade-in-0 zoom-in-95",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));

TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

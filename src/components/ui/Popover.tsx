import * as RadixPopover from "@radix-ui/react-popover";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export default function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 4,
}: Props) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>
        {trigger}
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="z-50 glass-card rounded-2xl shadow-elevated p-2.5 min-w-[180px] animate-scale-in focus:outline-none"
          collisionPadding={8}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

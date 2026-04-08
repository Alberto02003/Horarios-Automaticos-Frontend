import * as RadixTooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

interface Props {
  content: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>;
}

export default function Tooltip({ content, children, side = "top" }: Props) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>
        {children}
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={4}
          className="z-50 bg-warm-dark text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg animate-fade-in"
        >
          {content}
          <RadixTooltip.Arrow className="fill-warm-dark" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

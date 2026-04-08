import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export default function Select({ value, onValueChange, options, placeholder = "Seleccionar..." }: Props) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger className="input-pastel inline-flex items-center justify-between gap-2 min-w-[160px] text-left">
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown size={14} className="text-text-tertiary" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-50 bg-surface-card rounded-xl border border-[#F0EDF3] shadow-lg p-1.5 overflow-hidden animate-scale-in"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport>
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-primary outline-none cursor-pointer data-[highlighted]:bg-p-lavender-light/50 transition-colors"
              >
                <RadixSelect.ItemIndicator className="absolute left-1">
                  <Check size={12} className="text-p-pink-deep" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

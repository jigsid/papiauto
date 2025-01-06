import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  trigger: JSX.Element;
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const PopOver = ({
  children,
  trigger,
  className,
  open,
  onOpenChange,
}: Props) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div onClick={(e) => e.stopPropagation()}>{trigger}</div>
      </PopoverTrigger>
      <PopoverContent
        className={cn("bg-[#1D1D1D] shadow-lg rounded-xl", className)}
        align="end"
        side="bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default PopOver;

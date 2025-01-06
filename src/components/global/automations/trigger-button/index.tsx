import React, { useState } from "react";
import PopOver from "../../popover";
import { BlueAddIcon } from "@/icons";

type Props = {
  children: React.ReactNode;
  label: string;
  className?: string;
};

const TriggerButton = ({ children, label, className }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <PopOver
      className={className || "w-[400px]"}
      open={isOpen}
      onOpenChange={handleOpenChange}
      trigger={
        <div
          className="border-2 border-dashed w-full border-[#3352cc] hover:opacity-80 cursor-pointer transition duration-100 rounded-xl flex gap-x-2 justify-center items-center p-5 mt-4"
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
        >
          <BlueAddIcon />
          <p className="text-[#768BDD] font-bold">{label}</p>
        </div>
      }
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </PopOver>
  );
};

export default TriggerButton;

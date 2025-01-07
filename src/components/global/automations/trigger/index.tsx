"use client";
import { useQueryAutomation } from "@/hooks/user-queries";
import React from "react";
import ActiveTrigger from "./active";
import { Separator } from "@/components/ui/separator";
import ThenAction from "../then/then-action";
import TriggerButton from "../trigger-button";
import { AUTOMATION_TRIGGERS } from "@/constants/automation";
import { useTriggers } from "@/hooks/use-automations";
import { cn } from "@/lib/utils";
import Keywords from "./keywords";
import { Button } from "@/components/ui/button";
import Loader from "../../loader";

type Props = {
  id: string;
};

const Trigger = ({ id }: Props) => {
  const { types, onSetTrigger, onSaveTrigger, isPending } = useTriggers(id);
  const { data } = useQueryAutomation(id);

  if (data?.data && data?.data?.trigger.length > 0) {
    return (
      <div className="flex flex-col gap-y-2 w-full max-w-md mx-auto">
        <ActiveTrigger
          type={data.data.trigger[0].type}
          keywords={data.data.keywords}
        />

        {data?.data?.trigger.length > 1 && (
          <>
            <div className="relative w-full md:w-6/12 my-2 mx-auto">
              <p className="absolute transform px-2 -translate-y-1/2 top-1/2 left-1/2 -translate-x-1/2 bg-background z-10 text-sm">
                or
              </p>
              <Separator
                orientation="horizontal"
                className="border-muted border-[1px]"
              />
            </div>
            <ActiveTrigger
              type={data.data.trigger[1].type}
              keywords={data.data.keywords}
            />
          </>
        )}

        {!data.data.listener && <ThenAction id={id} />}
      </div>
    );
  }
  return (
    <div className="w-full max-w-md mx-auto px-2">
      <TriggerButton label="Add Trigger">
        <div className="flex flex-col gap-y-2 p-1">
          {AUTOMATION_TRIGGERS.map((trigger) => (
            <div
              key={trigger.id}
              onClick={() => onSetTrigger(trigger.type)}
              className={cn(
                "hover:opacity-80 text-white rounded-lg flex cursor-pointer flex-col p-2 gap-y-1 transition-all duration-200",
                !types?.find((t) => t === trigger.type)
                  ? "bg-background-80"
                  : "bg-gradient-to-br from-[#3352CC] font-medium to-[#1C2D70]"
              )}
            >
              <div className="flex gap-x-2 items-center">
                {trigger.icon}
                <p className="font-medium text-xs md:text-sm">
                  {trigger.label}
                </p>
              </div>
              <p className="text-[11px] md:text-xs font-light">
                {trigger.description}
              </p>
            </div>
          ))}
          <div className="mt-1">
            <Keywords id={id} />
          </div>
          <Button
            onClick={onSaveTrigger}
            disabled={types?.length === 0}
            size="sm"
            className="bg-gradient-to-br from-[#3352CC] font-medium text-white to-[#1C2D70] w-full mt-1 text-xs"
          >
            <Loader state={isPending}>Create Trigger</Loader>
          </Button>
        </div>
      </TriggerButton>
    </div>
  );
};

export default Trigger;

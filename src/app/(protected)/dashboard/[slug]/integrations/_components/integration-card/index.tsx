"use client";
import { onOAuthInstagram } from "@/actions/integrations";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
};

const IntegrationCard = ({ description, icon, strategy, title }: Props) => {
  const queryClient = useQueryClient();

  const onInstaOAuth = async () => {
    if (strategy === "INSTAGRAM") {
      const url = await onOAuthInstagram(strategy);
      if (url) {
        window.open(url, "_blank");
      }
    }
  };

  // Force an immediate refetch when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
  }, [queryClient]);

  // Listen for focus events to refresh connection status
  useEffect(() => {
    const onFocus = () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [queryClient]);

  const { data, refetch } = useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
    // Refresh every 5 seconds while window is focused
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // More robust integration check
  const integrated = data?.data?.integrations?.some(
    (integration) => integration?.name === strategy
  );

  return (
    <div className="border-2 border-[#3352CC] rounded-2xl gap-x-5 p-5 flex items-center justify-between">
      {icon}
      <div className="flex flex-col flex-1">
        <h3 className="text-xl"> {title}</h3>
        <p className="text-[#9D9D9D] text-base ">{description}</p>
      </div>
      <Button
        onClick={integrated ? () => refetch() : onInstaOAuth}
        disabled={integrated}
        className="bg-gradient-to-br text-white rounded-full text-lg from-[#3352CC] font-medium to-[#1C2D70] hover:opacity-70 transition duration-100"
      >
        {integrated ? "Connected" : "Connect"}
      </Button>
    </div>
  );
};

export default IntegrationCard;

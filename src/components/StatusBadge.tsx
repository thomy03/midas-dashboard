"use client";

import { BotStatus } from "@/types";

interface StatusBadgeProps {
  status: BotStatus | null;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const isRunning = status?.running ?? false;
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${
        isRunning
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isRunning ? "bg-emerald-400 animate-pulse" : "bg-red-400"
        }`}
      />
      {isRunning ? "Running" : "Stopped"}
    </span>
  );
}

"use client";

import { LogEntry } from "@/types";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface LogEntryItemProps {
  entry: LogEntry;
}

export function LogEntryItem({ entry }: LogEntryItemProps) {
  const levelConfig = {
    info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
    warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  };

  const typeColors = {
    analysis: "text-purple-400",
    trade: "text-cyan-400",
    signal: "text-amber-400",
    system: "text-zinc-400",
  };

  const config = levelConfig[entry.level];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border border-zinc-700/30 rounded-lg p-3`}>
      <div className="flex items-start gap-3">
        <Icon className={`${config.color} mt-0.5 flex-shrink-0`} size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${typeColors[entry.type]}`}>
              {entry.type.toUpperCase()}
            </span>
            <span className="text-xs text-zinc-500">
              {format(new Date(entry.timestamp), "HH:mm:ss")}
            </span>
          </div>
          <p className="text-sm text-zinc-300 break-words">{entry.message}</p>
          {entry.data && (
            <pre className="mt-2 text-xs text-zinc-500 bg-zinc-900/50 rounded p-2 overflow-x-auto">
              {JSON.stringify(entry.data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

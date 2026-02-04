"use client";

import { useEffect, useState } from "react";
import { LogEntryItem } from "@/components";
import { LogEntry } from "@/types";
import { RefreshCw, Filter, Trash2, Loader2 } from "lucide-react";

type FilterType = "all" | "analysis" | "trade" | "signal" | "system";

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/logs?type=${filter}&limit=50`);
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm("Clear all logs? This will also restart the agent.")) return;
    
    setClearing(true);
    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        // Wait for agent to restart
        setTimeout(fetchLogs, 5000);
      }
    } catch (error) {
      console.error("Failed to clear logs:", error);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "analysis", label: "Analysis" },
    { key: "trade", label: "Trade" },
    { key: "signal", label: "Signal" },
    { key: "system", label: "System" },
  ];

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            disabled={clearing}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50"
            title="Clear all logs"
          >
            {clearing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Trash2 size={20} />
            )}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              autoRefresh
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {autoRefresh ? "Auto" : "Manual"}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={20}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <Filter size={16} className="text-zinc-500 flex-shrink-0" />
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-blue-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-zinc-500" size={32} />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No logs to display</p>
            <p className="text-sm mt-1">Activity will appear here when the bot runs</p>
          </div>
        ) : (
          logs.map((log) => <LogEntryItem key={log.id} entry={log} />)
        )}
      </div>

      {/* Footer info */}
      {!loading && logs.length > 0 && (
        <p className="text-center text-xs text-zinc-500">
          Auto-refreshing every 15 seconds
        </p>
      )}
    </div>
  );
}

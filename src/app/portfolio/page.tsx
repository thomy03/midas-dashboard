"use client";

import { useEffect, useState, useCallback } from "react";
import { PortfolioChart, PositionCard } from "@/components";
import { PortfolioData, PortfolioSnapshot } from "@/types";
import { RefreshCw, TrendingUp, TrendingDown, Wallet } from "lucide-react";

type Period = "24h" | "7d" | "30d";

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [chartData, setChartData] = useState<PortfolioSnapshot[]>([]);
  const [period, setPeriod] = useState<Period>("24h");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchChartData = useCallback(async (p: Period) => {
    try {
      const res = await fetch(`/api/portfolio/history?period=${p}`);
      const json = await res.json();
      setChartData(json.history || []);
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchChartData(period);
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchChartData, period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchChartData(period);
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    fetchChartData(newPeriod);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 skeleton rounded-xl" />
        <div className="h-48 skeleton rounded-xl" />
        <div className="h-24 skeleton rounded-xl" />
        <div className="h-24 skeleton rounded-xl" />
      </div>
    );
  }

  const isProfit = (data?.totalPnl || 0) >= 0;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
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

      {/* Total Value Card */}
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-zinc-400 mb-1">
          <Wallet size={18} />
          <span className="text-sm">Total Value</span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">
          ${data?.totalValue?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}
        </div>
        <div className={`flex items-center gap-2 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
          {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span className="font-semibold">
            {isProfit ? "+" : ""}${data?.totalPnl?.toFixed(2) || "0.00"}
          </span>
          <span className="text-sm opacity-80">
            ({isProfit ? "+" : ""}{data?.totalPnlPercent?.toFixed(2) || "0.00"}%)
          </span>
        </div>
      </div>

      {/* Chart with Period Selector */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Performance</h2>
        <PortfolioChart 
          data={chartData.length > 0 ? chartData : (data?.history || [])} 
          period={period}
          onPeriodChange={handlePeriodChange}
          showPeriodSelector={true}
        />
      </div>

      {/* Positions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Open Positions ({data?.positions?.length || 0})
        </h2>
        {data?.positions?.length ? (
          <div className="space-y-3">
            {data.positions.map((position, idx) => (
              <PositionCard key={idx} position={position} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            No open positions
          </div>
        )}
      </div>
    </div>
  );
}

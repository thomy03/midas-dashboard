"use client";

import { useEffect, useState, useCallback } from "react";
import { PortfolioChart, PositionCard } from "@/components";
import { AllocationPieChart } from "@/components/AllocationPieChart";
import { PositionChart } from "@/components/PositionChart";
import { PortfolioData, PortfolioSnapshot } from "@/types";
import { RefreshCw, TrendingUp, TrendingDown, Wallet, PieChart, Banknote } from "lucide-react";

type Period = "24h" | "7d" | "30d";

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [chartData, setChartData] = useState<PortfolioSnapshot[]>([]);
  const [chartMessage, setChartMessage] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("24h");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{symbol: string, entryPrice: number} | null>(null);
  const [showAllocation, setShowAllocation] = useState(true);

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
      setChartMessage(json.message || null);
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
      </div>
    );
  }

  const isProfit = (data?.totalPnl || 0) >= 0;
  
  // Calculate proper totals
  const positionsValue = data?.positions?.reduce((sum, p) => sum + (p.positionValue || (p.size * p.currentPrice) || 0), 0) || 0;
  const cashBalance = data?.cashBalance || data?.totalValue || 0;
  const totalPortfolioValue = positionsValue + cashBalance;

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
          <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Total Value Card - Now shows REAL total */}
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 text-zinc-400 mb-1">
          <Wallet size={18} />
          <span className="text-sm">Valeur Totale (Positions + Liquidités)</span>
        </div>
        <div className="text-3xl font-bold text-white mb-2">
          ${totalPortfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div className={"flex items-center gap-2 " + (isProfit ? "text-emerald-400" : "text-red-400")}>
          {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span className="font-semibold">
            {isProfit ? "+" : ""}${data?.totalPnl?.toFixed(2) || "0.00"}
          </span>
          <span className="text-sm opacity-80">
            ({isProfit ? "+" : ""}{data?.totalPnlPercent?.toFixed(2) || "0.00"}%)
          </span>
        </div>
        
        {/* Breakdown */}
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-purple-400" />
            <span className="text-zinc-400">Positions:</span>
            <span className="text-white font-medium">${positionsValue.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote size={14} className="text-green-400" />
            <span className="text-zinc-400">Liquidités:</span>
            <span className="text-white font-medium">${cashBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Allocation Pie Chart */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-purple-400" />
            <h2 className="text-sm font-medium text-zinc-400">Répartition</h2>
          </div>
          <button
            onClick={() => setShowAllocation(!showAllocation)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {showAllocation ? "Masquer" : "Afficher"}
          </button>
        </div>
        {showAllocation && (
          <AllocationPieChart
            positions={data?.positions?.map(p => ({
              symbol: p.symbol,
              currentValue: p.positionValue || (p.size * p.currentPrice) || 0,
              pnl: p.pnl || 0
            })) || []}
            cashBalance={cashBalance}
          />
        )}
      </div>

      {/* Performance Chart */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Performance</h2>
        {chartMessage && chartData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
            {chartMessage}
          </div>
        ) : (
          <PortfolioChart 
            data={chartData.length > 0 ? chartData : (data?.history || [])} 
            period={period}
            onPeriodChange={handlePeriodChange}
            showPeriodSelector={true}
          />
        )}
      </div>

      {/* Positions - Now clickable */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Positions Ouvertes ({data?.positions?.length || 0})
        </h2>
        {data?.positions?.length ? (
          <div className="space-y-3">
            {data.positions.map((position, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedPosition({
                  symbol: position.symbol,
                  entryPrice: position.entryPrice || 0
                })}
                className="cursor-pointer hover:scale-[1.01] transition-transform"
              >
                <PositionCard position={position} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            Aucune position ouverte
          </div>
        )}
        <p className="text-xs text-zinc-600 mt-2 text-center">
          Cliquez sur une position pour voir son évolution
        </p>
      </div>

      {/* Position Detail Modal */}
      {selectedPosition && (
        <PositionChart
          symbol={selectedPosition.symbol}
          entryPrice={selectedPosition.entryPrice}
          onClose={() => setSelectedPosition(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Calendar,
  Search,
  X
} from "lucide-react";

interface ClosedTrade {
  id: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  entryTime: string;
  exitTime: string;
  reason?: string;
}

export default function HistoryPage() {
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await fetch("/api/trades/history");
      const json = await res.json();
      setTrades(json.trades || []);
    } catch (error) {
      console.error("Failed to fetch trade history:", error);
      // Mock data for demo
      setTrades(generateMockTrades());
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = useMemo(() => {
    let result = [...trades];
    
    // Symbol filter
    if (symbolFilter) {
      result = result.filter(t => 
        t.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
      );
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter(t => new Date(t.exitTime).getTime() > cutoff);
    }
    
    return result.sort((a, b) => 
      new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime()
    );
  }, [trades, symbolFilter, dateFilter]);

  const stats = useMemo(() => {
    const wins = filteredTrades.filter(t => t.pnl > 0);
    const losses = filteredTrades.filter(t => t.pnl < 0);
    const totalPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    return {
      total: filteredTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: filteredTrades.length > 0 
        ? ((wins.length / filteredTrades.length) * 100).toFixed(1) 
        : "0",
      totalPnl,
    };
  }, [filteredTrades]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-12 skeleton rounded-lg" />
        <div className="h-24 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold">Trade History</h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg transition-colors ${
            showFilters ? "bg-blue-500 text-white" : "bg-zinc-800 hover:bg-zinc-700"
          }`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3">
          {/* Symbol Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            {symbolFilter && (
              <button
                onClick={() => setSymbolFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Date Filter */}
          <div className="flex gap-2">
            <Calendar size={16} className="text-zinc-500 mt-2" />
            {(["all", "7d", "30d", "90d"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  dateFilter === period
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {period === "all" ? "All" : period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-zinc-500">Total Trades</div>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.winRate}%</div>
          <div className="text-xs text-zinc-500">Win Rate</div>
        </div>
        <div className={`bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-center`}>
          <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
          </div>
          <div className="text-xs text-zinc-500">Total P&L</div>
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-3">
        {filteredTrades.length > 0 ? (
          filteredTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} />
          ))
        ) : (
          <div className="text-center py-12 text-zinc-500">
            <History size={48} className="mx-auto mb-3 opacity-50" />
            <p>No closed trades found</p>
            {(symbolFilter || dateFilter !== "all") && (
              <button
                onClick={() => { setSymbolFilter(""); setDateFilter("all"); }}
                className="mt-2 text-blue-400 text-sm hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TradeCard({ trade }: { trade: ClosedTrade }) {
  const isProfit = trade.pnl >= 0;
  
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{trade.symbol}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              trade.side === "long" 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-red-500/20 text-red-400"
            }`}>
              {trade.side.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {format(new Date(trade.exitTime), "MMM dd, yyyy HH:mm")}
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="font-semibold">
              {isProfit ? "+" : ""}${trade.pnl.toFixed(2)}
            </span>
          </div>
          <div className={`text-xs ${isProfit ? "text-emerald-400/70" : "text-red-400/70"}`}>
            {isProfit ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-zinc-500">Entry:</span>
          <span className="ml-2 text-zinc-300">${trade.entryPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-zinc-500">Exit:</span>
          <span className="ml-2 text-zinc-300">${trade.exitPrice.toFixed(2)}</span>
        </div>
      </div>
      
      {trade.reason && (
        <div className="mt-2 text-xs text-zinc-500 italic">
          {trade.reason}
        </div>
      )}
    </div>
  );
}

function generateMockTrades(): ClosedTrade[] {
  const symbols = ["AAPL", "GOOGL", "MSFT", "NVDA", "TSLA", "AMD", "META"];
  const now = Date.now();
  
  return Array.from({ length: 15 }, (_, i) => {
    const entryPrice = 100 + Math.random() * 200;
    const pnlPercent = (Math.random() - 0.4) * 10; // Slight positive bias
    const exitPrice = entryPrice * (1 + pnlPercent / 100);
    const size = Math.floor(10 + Math.random() * 90);
    
    return {
      id: `trade-${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side: Math.random() > 0.3 ? "long" : "short",
      entryPrice,
      exitPrice,
      size,
      pnl: (exitPrice - entryPrice) * size,
      pnlPercent,
      entryTime: new Date(now - (i + 1) * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
      exitTime: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
      reason: i % 3 === 0 ? "Take profit hit" : i % 3 === 1 ? "Stop loss triggered" : undefined,
    };
  });
}

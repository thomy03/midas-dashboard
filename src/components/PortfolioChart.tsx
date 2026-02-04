"use client";

import { useState } from "react";
import { PortfolioSnapshot } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

type Period = "24h" | "7d" | "30d";

interface PortfolioChartProps {
  data: PortfolioSnapshot[];
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  showPeriodSelector?: boolean;
}

export function PortfolioChart({ 
  data, 
  period = "24h", 
  onPeriodChange,
  showPeriodSelector = true 
}: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(period);

  const handlePeriodChange = (newPeriod: Period) => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  if (!data || data.length === 0) {
    return (
      <div className="space-y-3">
        {showPeriodSelector && (
          <PeriodSelector selected={selectedPeriod} onChange={handlePeriodChange} />
        )}
        <div className="h-48 flex items-center justify-center text-zinc-500">
          No data available for this period
        </div>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    time: selectedPeriod === "24h" 
      ? format(new Date(item.timestamp), "HH:mm")
      : format(new Date(item.timestamp), "MMM dd"),
    fullDate: format(new Date(item.timestamp), "MMM dd, HH:mm"),
  }));

  const isProfit = data[data.length - 1]?.pnl >= 0;
  const minValue = Math.min(...data.map(d => d.totalValue)) * 0.995;
  const maxValue = Math.max(...data.map(d => d.totalValue)) * 1.005;

  return (
    <div className="space-y-3">
      {showPeriodSelector && (
        <PeriodSelector selected={selectedPeriod} onChange={handlePeriodChange} />
      )}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isProfit ? "#10b981" : "#ef4444"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isProfit ? "#10b981" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={[minValue, maxValue]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#fff",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ""}
              formatter={(value: number | undefined) => 
                value !== undefined ? [`$${value.toFixed(2)}`, "Value"] : ["-", "Value"]
              }
            />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke={isProfit ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PeriodSelector({ 
  selected, 
  onChange 
}: { 
  selected: Period; 
  onChange: (p: Period) => void;
}) {
  const periods: { value: Period; label: string }[] = [
    { value: "24h", label: "24H" },
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
  ];

  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            selected === p.value
              ? "bg-blue-500 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

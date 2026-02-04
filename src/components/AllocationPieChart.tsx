"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Position {
  symbol: string;
  currentValue: number;
  pnl: number;
}

interface AllocationPieChartProps {
  positions: Position[];
  cashBalance: number;
}

const COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444",
  "#ec4899", "#6366f1", "#14b8a6", "#84cc16", "#f97316"
];

export function AllocationPieChart({ positions, cashBalance }: AllocationPieChartProps) {
  const data = [
    ...positions.map((p, i) => ({
      name: p.symbol,
      value: p.currentValue,
      color: COLORS[i % COLORS.length],
    })),
    {
      name: "Liquidités",
      value: cashBalance,
      color: "#6b7280",
    },
  ].filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        Aucune donnée de répartition
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Valeur"]}
            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

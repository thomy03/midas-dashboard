"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";

interface PositionCardChartProps {
  symbol: string;
  entryPrice: number;
}

export function PositionCardChart({ symbol, entryPrice }: PositionCardChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/position/history?symbol=${symbol}`);
        const json = await res.json();
        setData(json.history || []);
      } catch (e) {
        console.error(e);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [symbol]);

  const safeEntryPrice = Number(entryPrice) || 0;

  if (loading) {
    return (
      <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
        Chargement du graphique...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">
        📊 Historique non disponible (position récente)
      </div>
    );
  }

  return (
    <div className="h-40 mt-3" style={{ minHeight: '120px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="time" 
            tick={{ fill: "#9ca3af", fontSize: 9 }}
            tickFormatter={(v) => {
              try {
                return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
              } catch {
                return '';
              }
            }}
          />
          <YAxis 
            domain={["auto", "auto"]}
            tick={{ fill: "#9ca3af", fontSize: 9 }}
            tickFormatter={(v) => `$${Number(v || 0).toFixed(0)}`}
            width={45}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", fontSize: "12px" }}
            formatter={(v: any) => [`$${Number(v || 0).toFixed(2)}`, "Prix"]}
            labelFormatter={(label) => {
              try {
                return new Date(label).toLocaleDateString('fr-FR');
              } catch {
                return label;
              }
            }}
          />
          <ReferenceLine 
            y={safeEntryPrice} 
            stroke="#6b7280" 
            strokeDasharray="5 5"
            label={{ value: 'Entrée', fill: '#9ca3af', fontSize: 10 }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8b5cf6" 
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

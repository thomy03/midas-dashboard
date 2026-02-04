"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { X } from "lucide-react";

interface PositionChartProps {
  symbol: string;
  entryPrice: number;
  onClose: () => void;
}

export function PositionChart({ symbol, entryPrice, onClose }: PositionChartProps) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">📈 {symbol}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="text-sm text-gray-400 mb-4">
          Prix d'entrée: <span className="text-white">${safeEntryPrice.toFixed(2)}</span>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-500">
            Chargement...
          </div>
        ) : data.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-500">
            Historique non disponible (position récente)
          </div>
        ) : (
          <div className="h-48" style={{ minHeight: '150px', minWidth: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickFormatter={(v) => {
                    try {
                      return new Date(v).toLocaleDateString();
                    } catch {
                      return '';
                    }
                  }}
                />
                <YAxis 
                  domain={["auto", "auto"]}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                  tickFormatter={(v) => `$${Number(v || 0).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
                  formatter={(v: any) => [`$${Number(v || 0).toFixed(2)}`, "Prix"]}
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
        )}
      </div>
    </div>
  );
}

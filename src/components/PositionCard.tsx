"use client";

import { useState } from "react";
import { Position } from "@/types";
import { TrendingUp, TrendingDown, Clock, ChevronDown, ChevronUp, Target, Shield, Brain, Building2, DollarSign } from "lucide-react";

interface PositionCardProps {
  position: Position;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
}

function PillarBar({ name, score, color }: { name: string; score: number; color: string }) {
  const normalizedScore = Math.min(100, Math.max(0, (score + 100) / 2));
  
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{name}</span>
        <span className={score >= 0 ? "text-emerald-400" : "text-red-400"}>
          {score >= 0 ? "+" : ""}{score.toFixed(1)}
        </span>
      </div>
      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color}`}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
    </div>
  );
}

export function PositionCard({ position }: PositionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isProfit = position.pnl >= 0;
  const hasAnalysis = position.pillarTechnical !== undefined || position.reasoning;
  const posValue = position.positionValue || (position.entryPrice * position.size);

  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-800/70 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{position.symbol}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              position.side === "long"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {position.side.toUpperCase()}
          </span>
          {position.scoreAtEntry && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
              Score: {position.scoreAtEntry.toFixed(0)}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
          {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span className="font-semibold">
            {isProfit ? "+" : ""}{position.pnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Company info */}
      {(position.companyName || position.sector) && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
          <Building2 size={12} />
          <span>{position.companyName}</span>
          {position.sector && (
            <span className="text-zinc-500">• {position.sector}</span>
          )}
        </div>
      )}

      {position.openedAt && (
        <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
          <Clock size={12} />
          <span>Ouvert le {formatDate(position.openedAt)}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="text-zinc-500">Qté</span>
          <p className="text-white font-medium">{position.size}</p>
        </div>
        <div>
          <span className="text-zinc-500">Investi</span>
          <p className="text-white font-medium flex items-center gap-1">
            <DollarSign size={12} className="text-zinc-500" />
            {posValue.toFixed(2)}
          </p>
        </div>
        <div>
          <span className="text-zinc-500">Entry</span>
          <p className="text-white font-medium">${position.entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-zinc-500">Current</span>
          <p className="text-white font-medium">${position.currentPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* P&L row */}
      <div className="flex items-center justify-between py-2 border-t border-zinc-700/50 mb-2">
        <span className="text-zinc-500 text-sm">P&L</span>
        <p className={`font-semibold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
          {isProfit ? "+" : ""}${position.pnl.toFixed(2)}
        </p>
      </div>

      {/* Stop Loss / Take Profit */}
      {(position.stopLoss || position.takeProfit) && (
        <div className="flex justify-between text-xs py-2 border-t border-zinc-700/50">
          {position.stopLoss ? (
            <div className="flex items-center gap-1 text-red-400">
              <Shield size={12} />
              <span>SL: ${position.stopLoss.toFixed(2)}</span>
            </div>
          ) : <div />}
          {position.takeProfit ? (
            <div className="flex items-center gap-1 text-emerald-400">
              <Target size={12} />
              <span>TP: ${position.takeProfit.toFixed(2)}</span>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Expand button for analysis */}
      {hasAnalysis && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-zinc-400 hover:text-white py-2 border-t border-zinc-700/50 mt-2 transition-colors"
        >
          <Brain size={14} />
          <span>Voir analyse</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}

      {/* Expanded analysis */}
      {expanded && hasAnalysis && (
        <div className="mt-3 pt-3 border-t border-zinc-700/50">
          {(position.pillarTechnical !== undefined || 
            position.pillarFundamental !== undefined ||
            position.pillarSentiment !== undefined ||
            position.pillarNews !== undefined) && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-zinc-300 mb-3">Analyse 4 Piliers</h4>
              {position.pillarTechnical !== undefined && (
                <PillarBar name="Technical" score={position.pillarTechnical} color="bg-blue-500" />
              )}
              {position.pillarFundamental !== undefined && (
                <PillarBar name="Fundamental" score={position.pillarFundamental} color="bg-purple-500" />
              )}
              {position.pillarSentiment !== undefined && (
                <PillarBar name="Sentiment" score={position.pillarSentiment} color="bg-amber-500" />
              )}
              {position.pillarNews !== undefined && (
                <PillarBar name="News" score={position.pillarNews} color="bg-emerald-500" />
              )}
            </div>
          )}

          {position.reasoning && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-300 mb-2">Raisonnement</h4>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {position.reasoning}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

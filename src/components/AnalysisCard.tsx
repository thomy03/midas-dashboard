"use client";

import { Analysis } from "@/types";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Copy, Share2, Check } from "lucide-react";
import { useState } from "react";

interface AnalysisCardProps {
  analysis: Analysis;
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const decisionColors = {
    STRONG_BUY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    BUY: "bg-green-500/20 text-green-400 border-green-500/30",
    HOLD: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    SELL: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    STRONG_SELL: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  // Format analysis for copy/export
  const formatAnalysisText = () => {
    let text = `📊 MIDAS ANALYSIS - ${analysis.symbol}\n`;
    text += `═══════════════════════════════\n\n`;
    text += `🎯 Signal: ${analysis.decision.replace("_", " ")}\n`;
    text += `📈 Score: ${analysis.finalScore.toFixed(0)}/100\n`;
    text += `🎲 Confidence: ${(analysis.confidence * 100).toFixed(0)}%\n`;
    text += `📅 Date: ${format(new Date(analysis.timestamp), "dd/MM/yyyy HH:mm")}\n\n`;
    text += `📋 PILLARS BREAKDOWN\n`;
    text += `───────────────────────────────\n`;
    
    analysis.pillars.forEach((pillar) => {
      const emoji = pillar.score >= 70 ? "🟢" : pillar.score >= 50 ? "🟡" : "🔴";
      text += `\n${emoji} ${pillar.name}: ${pillar.score.toFixed(0)}/100 (${(pillar.weight * 100).toFixed(0)}%)\n`;
      text += `   ${pillar.details}\n`;
    });
    
    text += `\n───────────────────────────────\n`;
    text += `💡 ${analysis.summary}\n\n`;
    text += `🤖 Powered by AI Trading Radar\n`;
    
    return text;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(formatAnalysisText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = formatAnalysisText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Midas Analysis - ${analysis.symbol}`,
          text: text,
        });
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copy
      handleCopy(e);
    }
  };

  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-zinc-800/70 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">{analysis.symbol}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${decisionColors[analysis.decision]}`}
            >
              {analysis.decision.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${scoreColor(analysis.finalScore)}`}>
              {analysis.finalScore.toFixed(0)}
            </span>
            {expanded ? (
              <ChevronUp className="text-zinc-400" size={20} />
            ) : (
              <ChevronDown className="text-zinc-400" size={20} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            {format(new Date(analysis.timestamp), "MMM dd, HH:mm")}
          </span>
          <span className="text-zinc-400">
            Confidence: {(analysis.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-700/50 pt-4">
          <p className="text-sm text-zinc-300 mb-4">{analysis.summary}</p>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Pillars
            </h4>
            {analysis.pillars.map((pillar, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">{pillar.name}</span>
                  <span className={scoreColor(pillar.score)}>
                    {pillar.score.toFixed(0)} ({(pillar.weight * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pillar.score >= 70
                        ? "bg-emerald-500"
                        : pillar.score >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500">{pillar.details}</p>
              </div>
            ))}
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copier</span>
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-sm text-purple-300 transition-colors"
            >
              <Share2 size={16} />
              <span>Partager</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

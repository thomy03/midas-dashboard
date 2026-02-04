"use client";

import { useEffect, useState } from "react";
import { Analysis } from "@/types";
import { RefreshCw, Search, Brain, Loader2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, History, Copy, Check, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Levels {
  stopLoss?: number;
  stopLossPercent?: number;
  takeProfit1?: number;
  takeProfit1Percent?: number;
  takeProfit2?: number;
  takeProfit2Percent?: number;
  riskRewardRatio?: string;
  atr?: number;
  support?: number;
  resistance?: number;
  note?: string;
}

interface ExtendedAnalysis extends Analysis {
  id?: string;
  analysis?: string;
  currentPrice?: number;
  change?: number;
  high52w?: number;
  low52w?: number;
  savedAt?: string;
  levels?: Levels;
}

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<ExtendedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [askSymbol, setAskSymbol] = useState("");
  const [asking, setAsking] = useState(false);
  const [askResult, setAskResult] = useState<ExtendedAnalysis | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/analysis?history=true");
      const json = await res.json();
      setAnalyses(json.analyses || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleAskJarvis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askSymbol.trim() || asking) return;

    setAsking(true);
    setAskResult(null);

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: askSymbol.toUpperCase() }),
      });

      if (res.ok) {
        const data = await res.json();
        setAskResult(data);
        // Refresh history to show new analysis
        fetchHistory();
      }
    } catch (error) {
      console.error("Failed to analyze:", error);
    } finally {
      setAsking(false);
    }
  };

  const formatAnalysisText = (analysis: ExtendedAnalysis) => {
    let text = `📊 MIDAS ANALYSIS - ${analysis.symbol}\n`;
    text += `═══════════════════════════════\n\n`;
    text += `🎯 Signal: ${(analysis.decision || "HOLD").replace("_", " ")}\n`;
    text += `📈 Score: ${analysis.finalScore}/100\n`;
    text += `🎲 Confidence: ${analysis.confidence}%\n`;
    text += `📅 Date: ${format(new Date(analysis.timestamp), "dd/MM/yyyy HH:mm", { locale: fr })}\n\n`;
    text += `📋 PILLARS BREAKDOWN\n`;
    text += `───────────────────────────────\n`;
    
    analysis.pillars?.forEach((pillar) => {
      const emoji = pillar.score >= 70 ? "🟢" : pillar.score >= 50 ? "🟡" : "🔴";
      text += `\n${emoji} ${pillar.name}: ${pillar.score}/100 (${pillar.weight}%)\n`;
      if (pillar.details) text += `   ${pillar.details}\n`;
    });
    
    text += `\n───────────────────────────────\n`;
    
    // Full analysis text (no truncation)
    if (analysis.analysis) {
      text += `\n💡 ${analysis.analysis}\n`;
    }
    
    // Add SL/TP levels if available
    if (analysis.levels && analysis.levels.stopLoss) {
      text += `\n🎯 NIVEAUX SUGGÉRÉS\n`;
      text += `───────────────────────────────\n`;
      text += `🛑 Stop Loss: $${analysis.levels.stopLoss} (${analysis.levels.stopLossPercent}%)\n`;
      text += `✅ Take Profit 1: $${analysis.levels.takeProfit1} (+${analysis.levels.takeProfit1Percent}%)\n`;
      if (analysis.levels.takeProfit2) {
        text += `✅ Take Profit 2: $${analysis.levels.takeProfit2} (+${analysis.levels.takeProfit2Percent}%)\n`;
      }
      text += `📊 Support: $${analysis.levels.support} | Résistance: $${analysis.levels.resistance}\n`;
      text += `⚖️ Risk/Reward: ${analysis.levels.riskRewardRatio}\n`;
    }
    
    text += `\n───────────────────────────────\n`;
    text += `🤖 Powered by AI Trading Radar\n`;
    
    return text;
  };

  const handleCopy = async (analysis: ExtendedAnalysis) => {
    try {
      await navigator.clipboard.writeText(formatAnalysisText(analysis));
      setCopiedId(analysis.id || analysis.symbol);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette analyse de l'historique ?")) return;
    try {
      await fetch(`/api/analysis?id=${id}`, { method: "DELETE" });
      fetchHistory();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const getDecisionColor = (decision: string) => {
    if (decision.includes("BUY")) return "text-emerald-400";
    if (decision.includes("SELL")) return "text-red-400";
    return "text-amber-400";
  };

  const getDecisionBg = (decision: string) => {
    if (decision.includes("BUY")) return "bg-emerald-500/20";
    if (decision.includes("SELL")) return "bg-red-500/20";
    return "bg-amber-500/20";
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return "bg-emerald-500";
    if (score <= 40) return "bg-red-500";
    return "bg-amber-500";
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analysis</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Ask Jarvis */}
      <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="text-purple-400" size={20} />
          <h2 className="font-semibold">Ask Jarvis</h2>
        </div>
        <form onSubmit={handleAskJarvis} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              size={18}
            />
            <input
              type="text"
              value={askSymbol}
              onChange={(e) => setAskSymbol(e.target.value)}
              placeholder="Symbol (ex: AAPL, MC.PA, SAP.DE)"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={asking || !askSymbol.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {asking ? <Loader2 className="animate-spin" size={20} /> : "Analyze"}
          </button>
        </form>

        {/* Analysis Result */}
        {asking && (
          <div className="mt-4 flex flex-col items-center justify-center py-8">
            <Loader2 className="animate-spin text-purple-400 mb-3" size={32} />
            <p className="text-zinc-400">Analyse en cours...</p>
            <p className="text-xs text-zinc-500 mt-1">L&apos;IA analyse les 5 piliers</p>
          </div>
        )}

        {askResult && !asking && (
          <div className="mt-4 space-y-4">
            {/* Header with symbol and decision */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{askResult.symbol}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDecisionBg(askResult.decision)} ${getDecisionColor(askResult.decision)}`}>
                    {askResult.decision.replace("_", " ")}
                  </span>
                </div>
                {askResult.currentPrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-semibold">${askResult.currentPrice.toFixed(2)}</span>
                    {askResult.change !== undefined && (
                      <span className={`flex items-center text-sm ${askResult.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {askResult.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {askResult.change >= 0 ? "+" : ""}{askResult.change.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  {format(new Date(askResult.timestamp), "dd/MM/yyyy HH:mm", { locale: fr })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{askResult.finalScore}</div>
                <div className="text-xs text-zinc-500">Score /100</div>
                <div className="text-xs text-zinc-500">Confiance: {askResult.confidence}%</div>
              </div>
            </div>

            {/* Pillars */}
            <div 
              className="bg-zinc-800/50 rounded-lg p-3 cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-400">PILLARS</span>
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {showDetails && (
                <div className="space-y-2">
                  {askResult.pillars?.map((pillar) => (
                    <div key={pillar.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{pillar.name}</span>
                        <span className={pillar.score >= 55 ? "text-emerald-400" : pillar.score <= 45 ? "text-red-400" : "text-amber-400"}>
                          {pillar.score} ({pillar.weight}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${getScoreColor(pillar.score)}`}
                          style={{ width: `${pillar.score}%` }}
                        />
                      </div>
                      {pillar.details && (
                        <p className="text-xs text-zinc-500 mt-1">{pillar.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* SL/TP Levels */}
            {askResult.levels && askResult.levels.stopLoss && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-amber-400">🎯 Niveaux Suggérés</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                    <div className="text-xs text-red-400 mb-1">Stop Loss</div>
                    <div className="text-lg font-bold text-red-400">${askResult.levels.stopLoss}</div>
                    <div className="text-xs text-zinc-500">{askResult.levels.stopLossPercent}%</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <div className="text-xs text-emerald-400 mb-1">Take Profit 1</div>
                    <div className="text-lg font-bold text-emerald-400">${askResult.levels.takeProfit1}</div>
                    <div className="text-xs text-zinc-500">+{askResult.levels.takeProfit1Percent}%</div>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-3">
                    <div className="text-xs text-zinc-400 mb-1">Support</div>
                    <div className="text-sm font-medium">${askResult.levels.support}</div>
                  </div>
                  <div className="bg-zinc-700/50 rounded-lg p-3">
                    <div className="text-xs text-zinc-400 mb-1">Résistance</div>
                    <div className="text-sm font-medium">${askResult.levels.resistance}</div>
                  </div>
                </div>
                {askResult.levels.takeProfit2 && (
                  <div className="mt-3 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/10">
                    <span className="text-xs text-zinc-400">TP2 (agressif): </span>
                    <span className="text-sm font-medium text-emerald-400">${askResult.levels.takeProfit2} (+{askResult.levels.takeProfit2Percent}%)</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-zinc-500">
                  Risk/Reward: {askResult.levels.riskRewardRatio} | ATR: {askResult.levels.atr}
                </div>
              </div>
            )}

            {/* Written Analysis */}
            {askResult.analysis && (
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-purple-400">📊 Analyse Détaillée</h4>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-zinc-300 mb-3 leading-relaxed text-sm">{children}</p>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc list-inside text-zinc-300 mb-3 space-y-1 text-sm">{children}</ul>,
                      li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                    }}
                  >
                    {askResult.analysis}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Export button for current result */}
            <button
              onClick={() => handleCopy(askResult)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              {copiedId === (askResult.id || askResult.symbol) ? (
                <>
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copier l&apos;analyse</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* History Section */}
      <div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-lg font-semibold mb-3 w-full"
        >
          <History size={20} className="text-purple-400" />
          <span>Historique des analyses</span>
          <span className="text-sm text-zinc-500 ml-2">({analyses.length})</span>
          {showHistory ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
        </button>
        
        {showHistory && (
          loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-zinc-500" size={24} />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p>Aucune analyse sauvegardée</p>
              <p className="text-sm mt-1">Utilisez Ask Jarvis pour analyser une valeur</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.filter((a: any) => !a.error && a.decision).map((analysis) => (
                <div key={analysis.id || analysis.symbol + analysis.timestamp} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{analysis.symbol}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getDecisionBg(analysis.decision)} ${getDecisionColor(analysis.decision)}`}>
                          {(analysis.decision || "HOLD").replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {format(new Date(analysis.savedAt || analysis.timestamp), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{analysis.finalScore}</div>
                      <div className="text-xs text-zinc-500">{analysis.confidence}%</div>
                    </div>
                  </div>
                  
                  {/* Quick pillars preview */}
                  <div className="flex gap-1 mt-2">
                    {analysis.pillars?.map((p) => (
                      <div 
                        key={p.name} 
                        className={`flex-1 h-1 rounded-full ${getScoreColor(p.score)}`}
                        title={`${p.name}: ${p.score}`}
                      />
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleCopy(analysis)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 bg-zinc-700/50 hover:bg-zinc-700 rounded text-xs text-zinc-300 transition-colors"
                    >
                      {copiedId === analysis.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedId === analysis.id ? "Copié" : "Copier"}
                    </button>
                    <button
                      onClick={() => analysis.id && handleDelete(analysis.id)}
                      className="flex items-center justify-center gap-1 py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 rounded text-xs text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

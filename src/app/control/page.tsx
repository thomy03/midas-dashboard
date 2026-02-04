"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { StatusBadge } from "@/components";
import { BotStatus } from "@/types";
import {
  Power, PowerOff, RotateCcw, Download, Clock, Activity, TrendingUp,
  Loader2, Radar, Brain, FileText, Terminal, RefreshCw, ChevronDown,
  ChevronUp, Zap, Target, ExternalLink, BarChart3, Settings2, DollarSign,
  Hash, Percent,
} from "lucide-react";

interface Candidate {
  symbol: string;
  name?: string;
  market?: string;
  score: number;
  decision: string;
  confidence: number;
  price: number;
  pillars?: {
    technical: number;
    fundamental: number;
    sentiment: number;
    news: number;
    ml: number;
  };
}

interface PrepareResult {
  status: "idle" | "running" | "success" | "error";
  timestamp?: string;
  candidates?: Candidate[];
  total_scanned?: number;
  all_candidates_count?: number;
  error?: string;
  config?: { maxStocks?: number; maxPrice?: number; minScore?: number };
}

interface Progress {
  current: number;
  total: number;
  percent: number;
  current_symbol?: string;
  candidates_found?: number;
}

export default function ControlPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("");
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState("tradingbot-agent");
  const [prepareResult, setPrepareResult] = useState<PrepareResult>({ status: "idle", candidates: [] });
  const [prepareExpanded, setPrepareExpanded] = useState(true);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0, percent: 0 });
  
  // Config options
  const [showConfig, setShowConfig] = useState(false);
  const [maxStocks, setMaxStocks] = useState<number | "">(100);
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minScore, setMinScore] = useState<number>(70);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/bot");
      setStatus(await res.json());
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/docker-logs?container=${selectedContainer}&lines=100`);
      const json = await res.json();
      setLogs(json.logs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const fetchPrepareResults = async () => {
    try {
      const res = await fetch("/api/prepare");
      const json = await res.json();
      setPrepareResult(json);
      
      // Fetch progress if running
      if (json.status === "running") {
        const progressRes = await fetch("/api/prepare?type=progress");
        setProgress(await progressRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch prepare results:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchPrepareResults();
    const statusInterval = setInterval(fetchStatus, 10000);
    const prepareInterval = setInterval(fetchPrepareResults, 3000);
    return () => {
      clearInterval(statusInterval);
      clearInterval(prepareInterval);
    };
  }, []);

  useEffect(() => {
    if (logsExpanded) {
      fetchLogs();
      const logsInterval = setInterval(fetchLogs, 2000);
      return () => clearInterval(logsInterval);
    }
  }, [logsExpanded, selectedContainer]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setTimeout(fetchStatus, 2000);
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrepare = async () => {
    setActionLoading("prepare");
    try {
      const res = await fetch("/api/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          maxStocks: maxStocks || null, 
          maxPrice: maxPrice || null,
          minScore 
        }),
      });
      if (res.ok) {
        setPrepareResult({ status: "running", candidates: [] });
        setProgress({ current: 0, total: 0, percent: 0 });
      }
    } catch (error) {
      console.error("Failed to start prepare:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 70) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-zinc-400";
  };

  const getDecisionBadge = (decision: string) => {
    if (decision === "STRONG_BUY") return "bg-emerald-500/30 text-emerald-300 border-emerald-500/50";
    if (decision === "BUY") return "bg-green-500/20 text-green-400 border-green-500/30";
    if (decision === "HOLD") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  };

  const getPillarColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  if (loading) {
    return <div className="p-4"><div className="h-40 skeleton rounded-xl" /></div>;
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Control</h1>
        <StatusBadge status={status} size="lg" />
      </div>

      {/* PREPARE TRADES */}
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setPrepareExpanded(!prepareExpanded)}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/30 rounded-lg">
              <Target className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-400">Préparer les Trades</h2>
              <p className="text-xs text-zinc-400">Full universe • Configurable</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {prepareResult.status === "running" && <Loader2 className="text-amber-400 animate-spin" size={20} />}
            {prepareExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {prepareExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Config toggle */}
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Settings2 size={16} />
              <span>Configuration</span>
              <ChevronDown size={14} className={`transition-transform ${showConfig ? "rotate-180" : ""}`} />
            </button>

            {/* Config options */}
            {showConfig && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-black/30 rounded-lg">
                <div>
                  <label className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                    <Hash size={12} /> Max stocks
                  </label>
                  <select 
                    value={maxStocks}
                    onChange={(e) => setMaxStocks(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  >
                    <option value="">All (~3300)</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                    <option value="500">500</option>
                    <option value="1000">1000</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                    <DollarSign size={12} /> Prix max
                  </label>
                  <select
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? parseFloat(e.target.value) : "")}
                    className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  >
                    <option value="">Tous</option>
                    <option value="50">≤ $50</option>
                    <option value="100">≤ $100</option>
                    <option value="200">≤ $200</option>
                    <option value="500">≤ $500</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                    <Percent size={12} /> Score min
                  </label>
                  <select
                    value={minScore}
                    onChange={(e) => setMinScore(parseInt(e.target.value))}
                    className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  >
                    <option value="60">≥ 60 (HOLD+)</option>
                    <option value="70">≥ 70 (BUY+)</option>
                    <option value="75">≥ 75 (STRONG)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Launch Button */}
            <button
              onClick={handlePrepare}
              disabled={actionLoading === "prepare" || prepareResult.status === "running"}
              className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-black hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50"
            >
              {prepareResult.status === "running" ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Zap size={24} />
                  <span>Lancer l&apos;Analyse</span>
                </>
              )}
            </button>

            {/* Progress bar */}
            {prepareResult.status === "running" && progress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">
                    {progress.current}/{progress.total} • {progress.current_symbol}
                  </span>
                  <span className="text-amber-400">{progress.candidates_found || 0} trouvés</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {prepareResult.status === "success" && prepareResult.candidates && prepareResult.candidates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    {prepareResult.all_candidates_count || prepareResult.candidates.length} candidats (score ≥ {prepareResult.config?.minScore || 60})
                  </span>
                  <span className="text-xs text-zinc-500">{prepareResult.total_scanned} analysés</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {prepareResult.candidates.map((c, i) => (
                    <div key={c.symbol} className="bg-black/30 rounded-lg border border-zinc-700/50 overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50"
                        onClick={() => setExpandedCandidate(expandedCandidate === c.symbol ? null : c.symbol)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 w-5">#{i + 1}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{c.symbol}</span>
                              {c.market && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${c.market === "EU" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                                  {c.market}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-500">{c.name} • ${c.price?.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${getScoreColor(c.score)}`}>{c.score}</span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getDecisionBadge(c.decision)}`}>
                            {c.decision === "STRONG_BUY" ? "🔥 BUY" : c.decision}
                          </span>
                          <ChevronDown size={16} className={`text-zinc-500 transition-transform ${expandedCandidate === c.symbol ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                      
                      {expandedCandidate === c.symbol && c.pillars && (
                        <div className="px-3 pb-3 pt-1 border-t border-zinc-700/50 space-y-3">
                          <div className="space-y-2">
                            {[
                              { name: "Technical", value: c.pillars.technical, weight: "30%" },
                              { name: "Fundamental", value: c.pillars.fundamental, weight: "25%" },
                              { name: "ML Adaptive", value: c.pillars.ml, weight: "20%" },
                              { name: "Sentiment", value: c.pillars.sentiment, weight: "15%" },
                              { name: "News", value: c.pillars.news, weight: "10%" },
                            ].map((p) => (
                              <div key={p.name} className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 w-24">{p.name}</span>
                                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${getPillarColor(p.value)}`} style={{ width: `${p.value}%` }} />
                                </div>
                                <span className={`text-xs font-mono w-8 ${getScoreColor(p.value)}`}>{p.value.toFixed(0)}</span>
                                <span className="text-xs text-zinc-600 w-8">{p.weight}</span>
                              </div>
                            ))}
                          </div>
                          <Link
                            href={`/analysis?symbol=${c.symbol}`}
                            className="flex items-center justify-center gap-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm hover:bg-blue-500/30"
                          >
                            <BarChart3 size={16} /> Analyse détaillée <ExternalLink size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prepareResult.status === "success" && (!prepareResult.candidates || prepareResult.candidates.length === 0) && (
              <div className="text-center py-4 text-zinc-500">Aucun candidat trouvé avec les critères sélectionnés</div>
            )}

            {prepareResult.status === "error" && (
              <div className="text-center py-4 text-red-400">Erreur: {prepareResult.error}</div>
            )}
          </div>
        )}
      </div>

      {/* Bot Status */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Bot Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Clock className="text-blue-400" size={20} /></div>
            <div><p className="text-xs text-zinc-500">Uptime</p><p className="font-medium">{status?.running ? formatUptime(status.uptime || 0) : "—"}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg"><Activity className="text-purple-400" size={20} /></div>
            <div><p className="text-xs text-zinc-500">Trades</p><p className="font-medium">{status?.totalTrades || 0}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg"><TrendingUp className="text-emerald-400" size={20} /></div>
            <div><p className="text-xs text-zinc-500">Today P&L</p><p className={`font-medium ${(status?.todayPnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{(status?.todayPnl || 0) >= 0 ? "+" : ""}${status?.todayPnl?.toFixed(2) || "0.00"}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg"><Clock className="text-amber-400" size={20} /></div>
            <div><p className="text-xs text-zinc-500">Version</p><p className="font-medium">{status?.version || "4.0.0"}</p></div>
          </div>
        </div>
      </div>

      {/* Bot Control */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Bot Control</h2>
        <div className="grid grid-cols-3 gap-3">
          {status?.running ? (
            <button onClick={() => handleAction("stop")} disabled={!!actionLoading} className="flex flex-col items-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 disabled:opacity-50">
              {actionLoading === "stop" ? <Loader2 className="text-red-400 animate-spin" size={24} /> : <PowerOff className="text-red-400" size={24} />}
              <span className="text-sm font-medium text-red-400">Stop</span>
            </button>
          ) : (
            <button onClick={() => handleAction("start")} disabled={!!actionLoading} className="flex flex-col items-center gap-2 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 disabled:opacity-50">
              {actionLoading === "start" ? <Loader2 className="text-emerald-400 animate-spin" size={24} /> : <Power className="text-emerald-400" size={24} />}
              <span className="text-sm font-medium text-emerald-400">Start</span>
            </button>
          )}
          <button onClick={() => handleAction("restart")} disabled={!!actionLoading} className="flex flex-col items-center gap-2 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 disabled:opacity-50">
            {actionLoading === "restart" ? <Loader2 className="text-amber-400 animate-spin" size={24} /> : <RotateCcw className="text-amber-400" size={24} />}
            <span className="text-sm font-medium text-amber-400">Restart</span>
          </button>
          <div className="flex flex-col items-center gap-2 p-4 bg-zinc-700/30 border border-zinc-600/30 rounded-xl">
            <div className={`w-3 h-3 rounded-full ${status?.running ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-xs text-zinc-400">{status?.running ? "Active" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Scan & Learn */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Analysis & Learning</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleAction("scan")} disabled={!!actionLoading} className="flex flex-col items-center gap-2 p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/30 disabled:opacity-50">
            {actionLoading === "scan" ? <Loader2 className="text-cyan-400 animate-spin" size={24} /> : <Radar className="text-cyan-400" size={24} />}
            <span className="text-sm font-medium text-cyan-400">Full Scan</span>
          </button>
          <button onClick={() => handleAction("feedback")} disabled={!!actionLoading} className="flex flex-col items-center gap-2 p-4 bg-pink-500/20 border border-pink-500/30 rounded-xl hover:bg-pink-500/30 disabled:opacity-50">
            {actionLoading === "feedback" ? <Loader2 className="text-pink-400 animate-spin" size={24} /> : <Brain className="text-pink-400" size={24} />}
            <span className="text-sm font-medium text-pink-400">Learn</span>
          </button>
        </div>
      </div>

      {/* Docker Logs */}
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-700/30" onClick={() => setLogsExpanded(!logsExpanded)}>
          <div className="flex items-center gap-3">
            <Terminal className="text-cyan-400" size={20} />
            <h2 className="text-lg font-semibold">Logs Temps Réel</h2>
          </div>
          {logsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {logsExpanded && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 mb-3">
              {["tradingbot-agent", "tradingbot"].map((c) => (
                <button key={c} onClick={() => setSelectedContainer(c)} className={`px-3 py-1 text-xs rounded-full ${selectedContainer === c ? "bg-cyan-500 text-white" : "bg-zinc-700 text-zinc-400"}`}>
                  {c.replace("tradingbot-", "")}
                </button>
              ))}
            </div>
            <div className="bg-black/50 rounded-lg p-3 font-mono text-xs max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-zinc-300">{logs || "Loading..."}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Report & Export */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/report" className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-700/50 flex items-center gap-3">
          <FileText className="text-purple-400" size={24} />
          <div><span className="font-medium text-purple-400">Rapport</span><p className="text-xs text-zinc-500">Analyse complète</p></div>
        </Link>
        <button onClick={() => window.location.href = "/api/export?type=analyses"} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-700/50 flex items-center gap-3">
          <Download className="text-blue-400" size={24} />
          <div className="text-left"><span className="font-medium text-blue-400">Export CSV</span><p className="text-xs text-zinc-500">Télécharger</p></div>
        </button>
      </div>
    </div>
  );
}

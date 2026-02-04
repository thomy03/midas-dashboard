// Types pour le TradingBot

export interface Position {
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
  stopLoss?: number;
  takeProfit?: number;
  scoreAtEntry?: number;
  pillarTechnical?: number;
  pillarFundamental?: number;
  pillarSentiment?: number;
  pillarNews?: number;
  reasoning?: string;
  positionValue?: number;
  companyName?: string;
  sector?: string;
  industry?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  pnl?: number;
  timestamp: string;
  reason?: string;
}

export interface AnalysisPillar {
  name: string;
  score: number;
  weight: number;
  details: string;
}

export interface Analysis {
  symbol: string;
  timestamp: string;
  finalScore: number;
  decision: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  pillars: AnalysisPillar[];
  summary: string;
  confidence: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  type: "analysis" | "trade" | "signal" | "system";
  message: string;
  data?: Record<string, unknown>;
}

export interface BotStatus {
  running: boolean;
  uptime?: number;
  lastActivity?: string;
  totalTrades: number;
  todayPnl: number;
  version?: string;
}

export interface PortfolioSnapshot {
  timestamp: string;
  totalValue: number;
  pnl: number;
}

export interface PortfolioData {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: Position[];
  history: PortfolioSnapshot[];
}

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

// ===========================================
// SECURITY: Input validation
// ===========================================
const SYMBOL_REGEX = /^[A-Z0-9.]{1,10}$/;

function isValidSymbol(symbol: string): boolean {
  return SYMBOL_REGEX.test(symbol);
}

function sanitizeSymbol(input: string): string | null {
  const sanitized = (input || "").toUpperCase().trim();
  return isValidSymbol(sanitized) ? sanitized : null;
}

// ===========================================
// SECURITY: Basic rate limiting (in-memory)
// ===========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;  // 20 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || request.headers.get("x-real-ip") 
    || "unknown";
}

// Path to store analysis history
const HISTORY_FILE = "/root/tradingbot-app/data/analysis_history.json";

// Ensure data directory exists
async function ensureDataDir() {
  const dir = path.dirname(HISTORY_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
}

// Load history
async function loadHistory() {
  try {
    const data = await fs.readFile(HISTORY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { analyses: [] };
  }
}

// Save analysis to history
async function saveToHistory(analysis: any) {
  await ensureDataDir();
  const history = await loadHistory();
  
  // Add unique ID and ensure timestamp
  const entry = {
    id: `${analysis.symbol}_${Date.now()}`,
    ...analysis,
    savedAt: new Date().toISOString()
  };
  
  // Add to beginning of array (most recent first)
  history.analyses.unshift(entry);
  
  // Keep only last 100 analyses
  if (history.analyses.length > 100) {
    history.analyses = history.analyses.slice(0, 100);
  }
  
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
  return entry;
}

export async function GET(request: NextRequest) {
  // Rate limit check
  const clientIP = getClientIP(request);
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  const symbolParam = request.nextUrl.searchParams.get("symbol");
  const history = request.nextUrl.searchParams.get("history");
  
  // Return history if requested
  if (history === "true") {
    const data = await loadHistory();
    return NextResponse.json(data);
  }
  
  if (!symbolParam) {
    // Return recent analyses from history
    const data = await loadHistory();
    return NextResponse.json({ analyses: data.analyses.slice(0, 20) });
  }
  
  // Validate symbol
  const symbol = sanitizeSymbol(symbolParam);
  if (!symbol) {
    return NextResponse.json(
      { error: "Invalid symbol format. Must be 1-10 alphanumeric characters." },
      { status: 400 }
    );
  }
  
  return analyzeSymbol(symbol);
}

export async function POST(request: NextRequest) {
  // Rate limit check
  const clientIP = getClientIP(request);
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const symbol = sanitizeSymbol(body.symbol);
    
    if (!symbol) {
      return NextResponse.json(
        { error: "Invalid symbol format. Must be 1-10 alphanumeric characters." },
        { status: 400 }
      );
    }
    
    return analyzeSymbol(symbol, true); // true = save to history
  } catch (error) {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

async function analyzeSymbol(symbol: string, saveHistory: boolean = false) {
  try {
    console.log(`[API] Detailed analysis for ${symbol}...`);
    
    // SECURITY: symbol is already validated by sanitizeSymbol()
    const { stdout } = await execAsync(
      `docker exec tradingbot-agent python /app/detailed_analyze.py ${symbol}`,
      { timeout: 120000 }
    );
    
    let result = JSON.parse(stdout.trim());
    console.log(`[API] Analysis complete: ${symbol} = ${result.finalScore}`);
    
    // Save to history if requested
    if (saveHistory) {
      result = await saveToHistory(result);
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error(`[API] Analysis failed:`, error.message?.slice(0, 200));
    const fallbackResult = {
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      finalScore: 50,
      decision: "HOLD",
      confidence: 50,
      analysis: "Analyse temporairement indisponible. Veuillez réessayer.",
      pillars: [
        { name: "Technical", score: 50, weight: 30, details: "Indisponible" },
        { name: "Fundamental", score: 50, weight: 25, details: "Indisponible" },
        { name: "Sentiment", score: 50, weight: 20, details: "Indisponible" },
        { name: "News", score: 50, weight: 10, details: "Indisponible" },
        { name: "ML Adaptive", score: 50, weight: 15, details: "Indisponible" }
      ],
      currentPrice: 0,
      fallback: true
    };
    return NextResponse.json(fallbackResult);
  }
}

// DELETE endpoint to clear history or delete specific analysis
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  
  const history = await loadHistory();
  
  if (id) {
    // Delete specific analysis
    history.analyses = history.analyses.filter((a: any) => a.id !== id);
  } else {
    // Clear all history
    history.analyses = [];
  }
  
  await ensureDataDir();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
  
  return NextResponse.json({ ok: true });
}

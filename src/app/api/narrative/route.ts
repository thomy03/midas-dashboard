import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

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
const RATE_LIMIT_MAX_REQUESTS = 10;  // 10 requests per minute (narrative is expensive)

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
  
  if (!symbolParam) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }
  
  // Validate symbol
  const symbol = sanitizeSymbol(symbolParam);
  if (!symbol) {
    return NextResponse.json(
      { error: "Invalid symbol format. Must be 1-10 alphanumeric characters." },
      { status: 400 }
    );
  }
  
  try {
    // SECURITY: symbol is already validated by sanitizeSymbol()
    const { stdout } = await execAsync(
      `docker exec tradingbot-agent python /app/generate_narrative.py ${symbol}`,
      { timeout: 90000 }
    );
    
    const report = JSON.parse(stdout.trim());
    return NextResponse.json(report);
    
  } catch (error: any) {
    console.error("Narrative generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate narrative" },
      { status: 500 }
    );
  }
}

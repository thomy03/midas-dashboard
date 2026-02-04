import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";

const execAsync = promisify(exec);

const PREPARE_FILE = "/tmp/midas-prepare-results.json";
const PROGRESS_FILE = "/tmp/midas-prepare-progress.json";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  
  if (type === "progress") {
    try {
      const data = await fs.readFile(PROGRESS_FILE, "utf-8");
      return NextResponse.json(JSON.parse(data));
    } catch {
      return NextResponse.json({ current: 0, total: 0, percent: 0 });
    }
  }
  
  try {
    const data = await fs.readFile(PREPARE_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch {
    return NextResponse.json({ status: "idle", candidates: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const maxStocks = body.maxStocks || null;
    const maxPrice = body.maxPrice || null;
    const minScore = body.minScore || 60;
    
    let cmd = "python /app/prepare_trades.py";
    if (maxStocks) cmd += ` --max-stocks ${maxStocks}`;
    if (maxPrice) cmd += ` --max-price ${maxPrice}`;
    if (minScore) cmd += ` --min-score ${minScore}`;
    
    await fs.writeFile(PREPARE_FILE, JSON.stringify({ 
      status: "running", 
      timestamp: new Date().toISOString(),
      candidates: [],
      config: { maxStocks, maxPrice, minScore }
    }));
    
    // Run command - stderr goes to docker logs, stdout captured for results
    execAsync(
      `docker exec tradingbot-agent ${cmd}`,
      { timeout: 1800000 }
    ).then(async ({ stdout, stderr }) => {
      if (stdout.trim()) {
        await fs.writeFile(PREPARE_FILE, stdout.trim());
      }
    }).catch(async (err) => {
      await fs.writeFile(PREPARE_FILE, JSON.stringify({ 
        status: "error", 
        error: err.message?.substring(0, 200) || "Unknown error",
        timestamp: new Date().toISOString()
      }));
    });

    return NextResponse.json({ 
      success: true, 
      message: "Preparation started",
      config: { maxStocks, maxPrice, minScore }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

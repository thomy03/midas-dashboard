import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  type: "analysis" | "trade" | "signal" | "system";
  message: string;
}

function parseLogLine(line: string, index: number): LogEntry | null {
  if (!line.trim() || line.length < 10) return null;

  let timestamp = new Date().toISOString();
  let level: LogEntry["level"] = "info";
  let type: LogEntry["type"] = "system";
  let message = line.trim();

  // Parse format: "HH:MM:SS | LEVEL | module | message"
  const match = line.match(/^(\d{2}:\d{2}:\d{2})\s*\|\s*(\w+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/);
  
  if (match) {
    const [, time, logLevel, module, msg] = match;
    const now = new Date();
    const [h, m, s] = time.split(":").map(Number);
    now.setHours(h, m, s);
    timestamp = now.toISOString();
    message = msg.trim();

    if (logLevel.toLowerCase() === "error") level = "error";
    else if (logLevel.toLowerCase().includes("warn")) level = "warning";
    else if (msg.includes("✅") || msg.toLowerCase().includes("success")) level = "success";

    const moduleLower = module.toLowerCase();
    const msgLower = msg.toLowerCase();
    
    if (moduleLower.includes("reasoning") || moduleLower.includes("pillar") || msgLower.includes("score") || msgLower.includes("analysis")) {
      type = "analysis";
    } else if (msgLower.includes("buy") || msgLower.includes("sell") || msgLower.includes("trade") || msgLower.includes("order")) {
      type = "trade";
    } else if (msgLower.includes("signal") || msgLower.includes("alert") || moduleLower.includes("grok") || msgLower.includes("sentiment")) {
      type = "signal";
    }
  } else {
    // Fallback parsing
    const lineLower = line.toLowerCase();
    if (lineLower.includes("error")) level = "error";
    else if (lineLower.includes("warn")) level = "warning";
    else if (lineLower.includes("✅")) level = "success";

    if (lineLower.includes("grok") || lineLower.includes("sentiment") || lineLower.includes("bullish") || lineLower.includes("bearish")) type = "signal";
    else if (lineLower.includes("score") || lineLower.includes("analysis") || lineLower.includes("pillar")) type = "analysis";
    else if (lineLower.includes("trade") || lineLower.includes("buy") || lineLower.includes("sell")) type = "trade";
  }

  return {
    id: `log-${Date.now()}-${index}`,
    timestamp,
    level,
    type,
    message,
  };
}

export async function GET(request: NextRequest) {
  const typeFilter = request.nextUrl.searchParams.get("type");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100");

  try {
    // Get logs from Docker stdout (not file)
    const { stdout } = await execAsync(
      `docker logs tradingbot-agent --tail ${limit * 2} 2>&1`,
      { timeout: 10000 }
    );

    const lines = stdout.split("\n").filter(Boolean);
    let logs: LogEntry[] = lines
      .map((line, index) => parseLogLine(line, index))
      .filter((log): log is LogEntry => log !== null);

    // Filter by type if specified
    if (typeFilter && typeFilter !== "all") {
      logs = logs.filter((log) => log.type === typeFilter);
    }

    // Return most recent first, limited
    return NextResponse.json({
      logs: logs.slice(-limit).reverse(),
    });
  } catch (error) {
    console.error("Logs API error:", error);
    return NextResponse.json({ logs: [], error: "Failed to fetch logs" });
  }
}

export async function DELETE() {
  try {
    // Restart agent to clear logs
    await execAsync("docker restart tradingbot-agent");
    return NextResponse.json({ success: true, message: "Logs cleared" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to clear logs" }, { status: 500 });
  }
}

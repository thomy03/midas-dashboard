import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ===========================================
// SECURITY: Basic rate limiting (in-memory)
// ===========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;  // 30 requests per minute

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

// ===========================================
// SECURITY: Allowed actions whitelist
// ===========================================
const ALLOWED_ACTIONS = ["start", "stop", "restart", "scan", "feedback"] as const;
type AllowedAction = typeof ALLOWED_ACTIONS[number];

function isValidAction(action: unknown): action is AllowedAction {
  return typeof action === "string" && ALLOWED_ACTIONS.includes(action as AllowedAction);
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

  try {
    // Check if tradingbot container is running
    const { stdout: runningOutput } = await execAsync(
      "docker inspect -f '{{.State.Running}}' tradingbot-agent 2>/dev/null || echo 'false'"
    );
    const isRunning = runningOutput.trim() === "true";

    let uptime = 0;
    let capital = 1500;
    let openPositions = 0;

    if (isRunning) {
      try {
        // Get uptime
        const { stdout: startedAt } = await execAsync(
          "docker inspect -f '{{.State.StartedAt}}' tradingbot-agent"
        );
        const startTime = new Date(startedAt.trim());
        uptime = Math.floor((Date.now() - startTime.getTime()) / 1000);

        // Try to get agent state for real capital
        const { stdout: agentState } = await execAsync(
          "docker exec tradingbot-agent cat /app/data/agent_state.json 2>/dev/null || echo '{}'"
        );
        const state = JSON.parse(agentState || "{}");
        capital = state.current_capital || state.initial_capital || 1500;
        openPositions = state.open_positions?.length || 0;
      } catch (e) {
        // Ignore errors getting details
      }
    }

    return NextResponse.json({
      running: isRunning,
      uptime,
      lastActivity: new Date().toISOString(),
      totalTrades: 0,
      todayPnl: 0,
      capital,
      openPositions,
      version: "4.0.0",
    });
  } catch (error) {
    console.error("Bot status error:", error);
    return NextResponse.json({
      running: false,
      uptime: 0,
      lastActivity: null,
      totalTrades: 0,
      todayPnl: 0,
      capital: 1500,
      openPositions: 0,
    });
  }
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
    const { action } = body;

    // SECURITY: Validate action against whitelist
    if (!isValidAction(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (action === "start") {
      // Start the container
      await execAsync("docker start tradingbot-agent");
      return NextResponse.json({ success: true, message: "Container started" });
    } else if (action === "stop") {
      // Stop the container completely
      await execAsync("docker stop tradingbot-agent");
      return NextResponse.json({ success: true, message: "Container stopped" });
    } else if (action === "restart") {
      await execAsync("docker restart tradingbot-agent");
      return NextResponse.json({ success: true, message: "Container restarted" });
    } else if (action === "scan") {
      // Trigger full discovery scan
      await execAsync(
        "docker exec -d tradingbot-agent bash -c 'cd /app && python -c \"import asyncio; from src.agents.orchestrator import MarketAgent; agent = MarketAgent(); asyncio.run(agent.run_discovery_phase())\" > /app/logs/scan.log 2>&1 &'"
      );
      return NextResponse.json({ success: true, message: "Full scan started" });
    } else if (action === "feedback") {
      // Trigger feedback loop learning
      await execAsync(
        "docker exec -d tradingbot-agent bash -c 'cd /app && python -c \"import asyncio; from src.learning.feedback_loop import get_feedback_loop; from src.learning.market_learner import get_market_learner; fl = get_feedback_loop(); ml = get_market_learner(); results = asyncio.run(fl.run_daily_feedback()); ml.learn_from_feedback(results); print(ml.get_learning_summary())\" > /app/logs/feedback.log 2>&1 &'"
      );
      return NextResponse.json({ success: true, message: "Feedback loop started" });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Bot control error:", error);
    return NextResponse.json(
      { error: "Failed to control bot" },
      { status: 500 }
    );
  }
}

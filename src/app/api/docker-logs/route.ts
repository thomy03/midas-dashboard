import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lines = searchParams.get("lines") || "30";
  const container = searchParams.get("container") || "tradingbot";
  
  // Only allow specific containers for security
  const allowedContainers = ["tradingbot", "tradingbot-agent", "tradingbot-api", "tradingbot-dashboard"];
  if (!allowedContainers.includes(container)) {
    return NextResponse.json({ error: "Invalid container" }, { status: 400 });
  }

  try {
    // Get container status
    const { stdout: statusOutput } = await execAsync(
      `docker inspect -f '{{.State.Status}} ({{.State.Health.Status}})' ${container} 2>/dev/null || echo 'not found'`
    );
    
    // Get logs
    const { stdout: logs, stderr } = await execAsync(
      `docker logs ${container} --tail ${lines} 2>&1`
    );
    
    return NextResponse.json({
      container,
      status: statusOutput.trim(),
      logs: logs || stderr || "No logs available",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Docker logs error:", error);
    return NextResponse.json({
      container,
      status: "error",
      logs: "Failed to fetch logs",
      timestamp: new Date().toISOString()
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  // Get latest report
  try {
    const { stdout } = await execAsync(
      "docker exec tradingbot-agent bash -c 'ls -t /app/data/reports/*.json 2>/dev/null | head -1 | xargs cat 2>/dev/null || echo {}'",
      { timeout: 10000 }
    );
    const report = JSON.parse(stdout.trim() || "{}");
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "No report available" });
  }
}

export async function POST() {
  // Generate new report
  try {
    console.log("[REPORT] Generating new report...");
    
    const { stdout, stderr } = await execAsync(
      "docker exec tradingbot-agent python /app/report_generator.py",
      { timeout: 180000 } // 3 minutes timeout
    );
    
    const result = JSON.parse(stdout.trim());
    console.log("[REPORT] Report generated successfully");
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[REPORT] Generation failed:", error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Report generation failed" 
    }, { status: 500 });
  }
}

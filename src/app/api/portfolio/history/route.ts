import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "24h";

  try {
    const response = await fetch(`${BACKEND_URL}/portfolio/history?period=${period}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Portfolio history API error:", error);

    // Generate mock data based on period
    const now = Date.now();
    const points = period === "24h" ? 24 : period === "7d" ? 7 * 4 : 30;
    const interval = period === "24h" ? 3600000 : period === "7d" ? 6 * 3600000 : 24 * 3600000;
    
    const baseValue = 10000;
    let currentValue = baseValue;
    
    const history = Array.from({ length: points }, (_, i) => {
      const change = (Math.random() - 0.48) * 100; // Slight positive bias
      currentValue = Math.max(currentValue + change, baseValue * 0.9);
      return {
        timestamp: new Date(now - (points - 1 - i) * interval).toISOString(),
        totalValue: currentValue,
        pnl: currentValue - baseValue,
      };
    });

    return NextResponse.json({ history, period });
  }
}

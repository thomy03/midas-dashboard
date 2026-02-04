import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/trades`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Trades API error:", error);

    // Return mock data
    return NextResponse.json({
      trades: [
        {
          id: "1",
          symbol: "BTC/USDT",
          side: "buy",
          size: 0.1,
          price: 42000,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          reason: "Strong bullish signal",
        },
        {
          id: "2",
          symbol: "ETH/USDT",
          side: "buy",
          size: 1.5,
          price: 2200,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          reason: "Multi-pillar analysis positive",
        },
      ],
    });
  }
}

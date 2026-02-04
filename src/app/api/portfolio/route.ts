import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const API_KEY = process.env.API_KEY || "midas-dev-key-2024";

// Fetch current price from backend
async function fetchPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/stock/${symbol}/price`,
      { 
        cache: "no-store",
        headers: { "X-API-Key": API_KEY }
      }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    return data.price || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Fetch portfolio summary
    const summaryRes = await fetch(`${BACKEND_URL}/api/v1/portfolio/summary`, {
      cache: "no-store",
      headers: { "X-API-Key": API_KEY },
    });

    const summaryData = summaryRes.ok ? await summaryRes.json() : {};

    // Fetch open positions
    let positions: any[] = [];
    let totalUnrealizedPnl = 0;
    let totalInvested = 0;
    
    try {
      const positionsRes = await fetch(`${BACKEND_URL}/api/v1/trades?status=open`, {
        cache: "no-store",
        headers: { "X-API-Key": API_KEY },
      });
      
      if (positionsRes.ok) {
        const positionsData = await positionsRes.json();
        
        // Fetch current prices in parallel
        const pricePromises = positionsData.map((p: any) => fetchPrice(p.symbol));
        const prices = await Promise.all(pricePromises);
        
        // Transform with real prices
        positions = positionsData.map((p: any, idx: number) => {
          const currentPrice = prices[idx] || p.entry_price;
          const invested = p.entry_price * p.shares;
          const pnl = (currentPrice - p.entry_price) * p.shares;
          const pnlPercent = ((currentPrice - p.entry_price) / p.entry_price) * 100;
          
          totalUnrealizedPnl += pnl;
          totalInvested += invested;
          
          return {
            symbol: p.symbol,
            side: "long" as const,
            size: p.shares,
            entryPrice: p.entry_price,
            currentPrice: currentPrice,
            pnl: pnl,
            pnlPercent: pnlPercent,
            openedAt: p.entry_date,
            stopLoss: p.stop_loss,
            takeProfit: p.take_profit,
            scoreAtEntry: p.score_at_entry,
            pillarTechnical: p.pillar_technical,
            pillarFundamental: p.pillar_fundamental,
            pillarSentiment: p.pillar_sentiment,
            pillarNews: p.pillar_news,
            reasoning: p.reasoning,
            positionValue: p.position_value || (p.entry_price * p.shares),
            companyName: p.company_name,
            sector: p.sector,
            industry: p.industry,
          };
        });
      }
    } catch (posErr) {
      console.error("[PORTFOLIO] Positions fetch error:", posErr);
    }

    // Calculate total value
    const cash = summaryData.available_capital || 0;
    const currentValue = positions.reduce((sum, p) => sum + (p.currentPrice * p.size), 0);
    const totalValue = cash + currentValue;

    return NextResponse.json({
      totalValue: totalValue,
      availableCapital: cash,
      investedCapital: totalInvested,
      totalPnl: totalUnrealizedPnl,
      totalPnlPercent: totalInvested > 0 
        ? (totalUnrealizedPnl / totalInvested) * 100 
        : 0,
      positions: positions,
      openPositions: positions.length,
      history: [],
    });
  } catch (error) {
    console.error("[PORTFOLIO] API error:", error);
    
    return NextResponse.json({
      totalValue: 15000,
      availableCapital: 15000,
      investedCapital: 0,
      totalPnl: 0,
      totalPnlPercent: 0,
      positions: [],
      openPositions: 0,
      history: [],
      error: "Backend unavailable",
    });
  }
}

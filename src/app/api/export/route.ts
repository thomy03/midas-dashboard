import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "trades";

  try {
    const endpoint = type === "trades" ? "/trades" : "/analysis/latest";
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      cache: "no-store",
    });

    const data = await response.json();
    let csv = "";

    if (type === "trades") {
      const trades = data.trades || [];
      csv = "ID,Symbol,Side,Size,Price,Timestamp,Reason\n";
      csv += trades
        .map(
          (t: Record<string, unknown>) =>
            `${t.id},${t.symbol},${t.side},${t.size},${t.price},${t.timestamp},"${t.reason || ""}"`
        )
        .join("\n");
    } else {
      const analyses = data.analyses || [];
      csv = "Symbol,Score,Decision,Confidence,Timestamp,Summary\n";
      csv += analyses
        .map(
          (a: Record<string, unknown>) => {
            const summary = String(a.summary || "").replace(/"/g, '""');
            return `${a.symbol},${a.finalScore},${a.decision},${a.confidence},${a.timestamp},"${summary}"`;
          }
        )
        .join("\n");
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

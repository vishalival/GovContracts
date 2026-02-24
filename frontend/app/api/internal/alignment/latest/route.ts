import { NextResponse } from "next/server";
import { loadAlignmentReport } from "../../../../../lib/server/data";

export async function GET() {
  const report = loadAlignmentReport();
  if (!report) {
    return NextResponse.json(
      { detail: "No alignment report found. Run POST /internal/alignment/run first." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    summary: report.summary,
    generated_at: report.generated_at,
    report,
  });
}

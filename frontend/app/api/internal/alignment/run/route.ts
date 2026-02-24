import { NextResponse } from "next/server";
import { runAlignmentCheck } from "../../../../../lib/server/data";

export async function POST() {
  try {
    const report = runAlignmentCheck();
    const summary = report.summary as Record<string, unknown>;
    return NextResponse.json({
      status: "ok",
      summary,
      generated_at: report.generated_at,
      files_written: {
        json: "backend/data/alignment_report.json",
        markdown_report: "docs/ALIGNMENT_REPORT.md",
        markdown_proposal: "docs/ALIGNMENT_PROPOSAL.md",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Failed to run alignment check" },
      { status: 500 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { getBudgets } from "../../../../../lib/server/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const agency = searchParams.get("agency");
  const fiscalYear = parseInt(searchParams.get("fiscal_year") ?? "2026", 10);

  if (!agency || agency.length < 2 || agency.length > 10) {
    return NextResponse.json({ detail: "agency is required (2-10 chars)" }, { status: 400 });
  }

  const normalizedAgency = agency.toUpperCase();
  const budgets = getBudgets();

  for (const budget of budgets) {
    if (budget.agency === normalizedAgency && budget.fiscal_year === fiscalYear) {
      const totalBudget = budget.total_budget;
      const obligatedAmount = budget.obligated_amount;
      return NextResponse.json({
        agency: normalizedAgency,
        fiscal_year: fiscalYear,
        total_budget: totalBudget,
        obligated_amount: obligatedAmount,
        remaining_budget: totalBudget - obligatedAmount,
        breakdown_by_category: budget.breakdown_by_category,
      });
    }
  }

  return NextResponse.json({ detail: "Budget summary not found" }, { status: 404 });
}

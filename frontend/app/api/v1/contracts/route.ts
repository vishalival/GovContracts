import { type NextRequest, NextResponse } from "next/server";
import { getContracts, getEnrichedContract } from "../../../../lib/server/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const agencyParam = searchParams.get("agency");
  const status = searchParams.get("status") ?? "All";
  const fiscalYear = parseInt(searchParams.get("fiscal_year") ?? "2026", 10);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "25", 10), 1), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);
  const sortBy = searchParams.get("sort_by") ?? "award_date";
  const sortDir = searchParams.get("sort_dir") ?? "desc";

  const allowedStatuses = new Set(["All", "Active", "Closed"]);
  if (!allowedStatuses.has(status)) {
    return NextResponse.json({ detail: "status must be one of All, Active, Closed" }, { status: 400 });
  }
  const allowedSortBy = new Set(["award_date", "obligated_amount"]);
  if (!allowedSortBy.has(sortBy)) {
    return NextResponse.json({ detail: "sort_by must be one of award_date, obligated_amount" }, { status: 400 });
  }
  const allowedSortDir = new Set(["asc", "desc"]);
  if (!allowedSortDir.has(sortDir)) {
    return NextResponse.json({ detail: "sort_dir must be one of asc, desc" }, { status: 400 });
  }

  const contracts = getContracts();

  // Normalize agency
  let normalizedAgency: string | null = null;
  if (agencyParam && agencyParam.toUpperCase() !== "ALL") {
    normalizedAgency = agencyParam.toUpperCase();
  }

  // Filter
  let filtered = contracts.filter((c) => c.fiscal_year === fiscalYear);
  if (normalizedAgency) {
    filtered = filtered.filter((c) => c.agency === normalizedAgency);
  }
  if (status !== "All") {
    filtered = filtered.filter((c) => c.status === status);
  }

  // Sort
  filtered.sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    if (sortBy === "obligated_amount") {
      aVal = a.obligated_amount;
      bVal = b.obligated_amount;
    } else {
      aVal = a.award_date;
      bVal = b.award_date;
    }
    if (aVal < bVal) return sortDir === "desc" ? 1 : -1;
    if (aVal > bVal) return sortDir === "desc" ? -1 : 1;
    return 0;
  });

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    total,
    limit,
    offset,
    items: paginated.map((c) => getEnrichedContract(c)),
  });
}

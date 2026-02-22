import { type NextRequest, NextResponse } from "next/server";
import { getContracts, getVendorMap } from "../../../../../lib/server/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vendor_id: string }> }
) {
  const { vendor_id } = await params;
  const vendorMap = getVendorMap();
  const vendor = vendorMap[vendor_id];

  if (!vendor) {
    return NextResponse.json({ detail: "Vendor not found" }, { status: 404 });
  }

  const contracts = getContracts();
  const vendorContracts = contracts.filter((c) => c.vendor_id === vendor_id);

  const agencyTotals: Record<string, number> = {};
  const categoryTotals: Record<string, number> = {};

  for (const contract of vendorContracts) {
    agencyTotals[contract.agency] = (agencyTotals[contract.agency] ?? 0) + contract.obligated_amount;
    categoryTotals[contract.category] = (categoryTotals[contract.category] ?? 0) + contract.obligated_amount;
  }

  const topAgencies = Object.entries(agencyTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([agency, amount]) => ({ agency, obligated_amount: amount }));

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => ({ category, obligated_amount: amount }));

  return NextResponse.json({
    vendor_id: vendor.vendor_id,
    name: vendor.name,
    uei: vendor.uei,
    duns: vendor.duns ?? null,
    small_business: !!vendor.small_business,
    total_awards: vendor.total_awards,
    active_contracts: vendor.active_contracts,
    contracts_count: vendorContracts.length,
    top_agencies: topAgencies,
    top_categories: topCategories,
  });
}

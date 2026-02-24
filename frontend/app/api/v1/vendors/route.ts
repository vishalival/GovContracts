import { type NextRequest, NextResponse } from "next/server";
import { getVendorMap } from "../../../../lib/server/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const queryText = (searchParams.get("query") ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1), 100);

  const vendorMap = getVendorMap();
  let items = Object.values(vendorMap);

  if (queryText) {
    items = items.filter(
      (v) => v.name.toLowerCase().includes(queryText) || v.uei.toLowerCase().includes(queryText)
    );
  }

  return NextResponse.json({ items: items.slice(0, limit) });
}

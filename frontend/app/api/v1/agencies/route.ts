import { NextResponse } from "next/server";
import { getAgencies } from "../../../../lib/server/data";

export async function GET() {
  return NextResponse.json({ items: getAgencies() });
}

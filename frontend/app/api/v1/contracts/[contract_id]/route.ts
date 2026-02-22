import { type NextRequest, NextResponse } from "next/server";
import { getContracts, getEnrichedContract } from "../../../../../lib/server/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contract_id: string }> }
) {
  const { contract_id } = await params;
  const contracts = getContracts();
  const contract = contracts.find((c) => c.contract_id === contract_id);

  if (!contract) {
    return NextResponse.json({ detail: "Contract not found" }, { status: 404 });
  }

  return NextResponse.json({ item: getEnrichedContract(contract) });
}

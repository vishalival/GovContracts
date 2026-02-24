import { type NextRequest, NextResponse } from "next/server";
import { getContracts, getVendorMap } from "../../../../../../lib/server/data";

/**
 * Adjudication thresholds — mirror the COBOL WORKING-STORAGE values
 * and the Python constants in backend/adjudication.py.
 * All monetary values are integers (whole dollars), matching COBOL PIC 9 fields.
 */
const OBLIGATED_AMOUNT_MIN = 1_000_000;
const HIGH_DOLLAR_THRESHOLD = 120_000_000;
const VENDOR_ACTIVE_CONTRACTS_MAX = 5;
const VENDOR_TOTAL_AWARDS_THRESHOLD = 500_000_000;

type AdjudicationResult = {
  decision: "APPROVE" | "REVIEW" | "REJECT";
  reason: string;
};

function adjudicate(
  contractStatus: string,
  obligatedAmount: number,
  vendorActiveContracts: number,
  vendorTotalAwards: number,
): AdjudicationResult {
  // Rule 1: status gate
  if (contractStatus !== "Active") {
    return { decision: "REJECT", reason: "CONTRACT STATUS NOT ACTIVE" };
  }
  // Rule 2: obligated-amount floor
  if (obligatedAmount < OBLIGATED_AMOUNT_MIN) {
    return { decision: "REJECT", reason: "OBLIGATED AMOUNT BELOW THRESHOLD" };
  }
  // Rule 3: high-dollar ceiling
  if (obligatedAmount >= HIGH_DOLLAR_THRESHOLD) {
    return { decision: "REVIEW", reason: "HIGH DOLLAR AWARD REQUIRES REVIEW" };
  }
  // Rule 4: vendor workload
  if (vendorActiveContracts >= VENDOR_ACTIVE_CONTRACTS_MAX) {
    return { decision: "REVIEW", reason: "VENDOR WORKLOAD CONCENTRATION" };
  }
  // Rule 5: cumulative award watch
  if (vendorTotalAwards >= VENDOR_TOTAL_AWARDS_THRESHOLD) {
    return { decision: "REVIEW", reason: "CUMULATIVE AWARD WATCH THRESHOLD" };
  }
  // Rule 6: all checks passed
  return { decision: "APPROVE", reason: "ALL AUTOMATED CHECKS PASSED" };
}

const REASON_MAP: Record<string, string> = {
  "CONTRACT STATUS NOT ACTIVE":
    "Contract is not active and requires no further award action.",
  "OBLIGATED AMOUNT BELOW THRESHOLD":
    "Obligated amount is below the modernization threshold.",
  "HIGH DOLLAR AWARD REQUIRES REVIEW":
    "High dollar amount requires additional federal review controls.",
  "VENDOR WORKLOAD CONCENTRATION":
    "Vendor has high active workload concentration.",
  "CUMULATIVE AWARD WATCH THRESHOLD":
    "Vendor cumulative awards exceed policy watch threshold.",
  "ALL AUTOMATED CHECKS PASSED":
    "Contract and vendor profile satisfy automated legacy award checks.",
};

export async function GET(request: NextRequest) {
  const contractId = request.nextUrl.searchParams.get("contract_id");
  if (!contractId || contractId.length < 5 || contractId.length > 40) {
    return NextResponse.json(
      { detail: "contract_id query parameter is required (5-40 chars)" },
      { status: 400 },
    );
  }

  const contracts = getContracts();
  const contract = contracts.find((c) => c.contract_id === contractId);
  if (!contract) {
    return NextResponse.json({ detail: "Contract not found" }, { status: 404 });
  }

  const vendorMap = getVendorMap();
  const vendor = vendorMap[contract.vendor_id];
  if (!vendor) {
    return NextResponse.json(
      { detail: "Vendor not found for contract" },
      { status: 404 },
    );
  }

  const obligatedAmount = contract.obligated_amount;
  const vendorActiveContracts = vendor.active_contracts;
  const vendorTotalAwards = vendor.total_awards;

  const result = adjudicate(
    contract.status,
    obligatedAmount,
    vendorActiveContracts,
    vendorTotalAwards,
  );

  const friendlyReason = REASON_MAP[result.reason] ?? result.reason;

  return NextResponse.json({
    program_name: "CONTRACT_AWARD_ADJUDICATION",
    contract_id: contract.contract_id,
    vendor_id: vendor.vendor_id,
    decision: result.decision,
    reasons: [friendlyReason],
    inputs: {
      contract_status: contract.status,
      obligated_amount: obligatedAmount,
      vendor_active_contracts: vendorActiveContracts,
      vendor_total_awards: vendorTotalAwards,
    },
  });
}

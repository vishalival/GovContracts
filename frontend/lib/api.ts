import type {
  Agency,
  BudgetSummary,
  CobolAdjudication,
  ModernizationTriggerResponse,
  Contract,
  ContractsResponse,
  Vendor,
  VendorDetail
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { cache: "no-store", ...init });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API ${response.status}: ${message || "Request failed"}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchAgencies(): Promise<Agency[]> {
  const data = await request<{ items: Agency[] }>("/v1/agencies");
  return data.items;
}

export async function fetchBudgetSummary(params: {
  agency: string;
  fiscalYear?: number;
}): Promise<BudgetSummary> {
  const fiscalYear = params.fiscalYear ?? 2026;
  const query = new URLSearchParams({
    agency: params.agency,
    fiscal_year: String(fiscalYear)
  });
  return request<BudgetSummary>(`/v1/budget/summary?${query.toString()}`);
}

export async function fetchContracts(params: {
  agency?: string;
  status?: "All" | "Active" | "Closed";
  fiscalYear?: number;
  limit?: number;
  offset?: number;
  sortBy?: "award_date" | "obligated_amount";
  sortDir?: "asc" | "desc";
}): Promise<ContractsResponse> {
  const query = new URLSearchParams({
    fiscal_year: String(params.fiscalYear ?? 2026),
    status: params.status ?? "All",
    limit: String(params.limit ?? 25),
    offset: String(params.offset ?? 0),
    sort_by: params.sortBy ?? "award_date",
    sort_dir: params.sortDir ?? "desc"
  });
  if (params.agency && params.agency !== "All") {
    query.set("agency", params.agency);
  }
  return request<ContractsResponse>(`/v1/contracts?${query.toString()}`);
}

export async function fetchContractDetail(contractId: string): Promise<Contract> {
  const data = await request<{ item: Contract }>(`/v1/contracts/${contractId}`);
  return data.item;
}

export async function fetchVendors(queryText = "", limit = 20): Promise<Vendor[]> {
  const query = new URLSearchParams({
    query: queryText,
    limit: String(limit)
  });
  const data = await request<{ items: Vendor[] }>(`/v1/vendors?${query.toString()}`);
  return data.items;
}

export async function fetchVendorDetail(vendorId: string): Promise<VendorDetail> {
  return request<VendorDetail>(`/v1/vendors/${vendorId}`);
}

export async function fetchApiDocsMarkdown(): Promise<string> {
  const data = await request<{ content: string }>("/v1/docs/api");
  return data.content;
}

export async function fetchCobolAdjudication(contractId: string): Promise<CobolAdjudication> {
  const query = new URLSearchParams({ contract_id: contractId });
  return request<CobolAdjudication>(`/v1/legacy/cobol/adjudication?${query.toString()}`);
}

export async function triggerDevinModernization(params: {
  contractId: string;
  cobolPath?: string;
  targetStack?: string;
  baseBranch?: string;
}): Promise<ModernizationTriggerResponse> {
  return request<ModernizationTriggerResponse>("/v1/modernization/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contract_id: params.contractId,
      cobol_path: params.cobolPath ?? "backend/legacy_cobol/CONTRACT_AWARD_ADJUDICATION.cbl",
      target_stack: params.targetStack ?? "python-fastapi",
      base_branch: params.baseBranch ?? "main"
    })
  });
}

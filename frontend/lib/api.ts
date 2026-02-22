import type { Agency, BudgetSummary, Contract, ContractsResponse, Vendor, VendorDetail } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
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
}): Promise<ContractsResponse> {
  const query = new URLSearchParams({
    fiscal_year: String(params.fiscalYear ?? 2026),
    status: params.status ?? "All",
    limit: String(params.limit ?? 25),
    offset: String(params.offset ?? 0)
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

/**
 * Server-side data loader for Next.js API routes.
 * Mirrors the FastAPI backend logic so the app works on Vercel without a separate backend.
 */

import fs from "fs";
import path from "path";

export type ContractRecord = {
  contract_id: string;
  agency: string;
  fiscal_year: number;
  vendor_id: string;
  vendor_name: string;
  vendor_uei: string;
  obligated_amount: number;
  total_value: number;
  award_date: string;
  period_end: string;
  psc: string;
  naics: string;
  description: string;
  status: string;
  category: string;
  program_office: string;
  place_of_performance: string;
};

export type AgencyRecord = { code: string; name: string };
export type BudgetRecord = {
  agency: string;
  fiscal_year: number;
  total_budget: number;
  obligated_amount: number;
  breakdown_by_category: { category: string; amount: number }[];
};
export type VendorRecord = {
  vendor_id: string;
  name: string;
  uei: string;
  duns?: string;
  small_business: boolean;
  total_awards?: number;
  active_contracts?: number;
};

function resolveDataPath(filename: string): string {
  // In production (Vercel), process.cwd() is the frontend root.
  // Data files are in the backend/data directory relative to the repo root.
  // We store a copy in frontend/data for Vercel deployments.
  const localDataDir = path.join(process.cwd(), "data");
  if (fs.existsSync(path.join(localDataDir, filename))) {
    return path.join(localDataDir, filename);
  }
  // Fallback: try backend/data (local dev when cwd is frontend/)
  const backendDataDir = path.join(process.cwd(), "..", "backend", "data");
  if (fs.existsSync(path.join(backendDataDir, filename))) {
    return path.join(backendDataDir, filename);
  }
  throw new Error(`Data file not found: ${filename}`);
}

function resolveCodeTablePath(filename: string): string {
  const localDir = path.join(process.cwd(), "code_tables");
  if (fs.existsSync(path.join(localDir, filename))) {
    return path.join(localDir, filename);
  }
  const repoDir = path.join(process.cwd(), "..", "code_tables");
  if (fs.existsSync(path.join(repoDir, filename))) {
    return path.join(repoDir, filename);
  }
  throw new Error(`Code table file not found: ${filename}`);
}

function resolveDocsPath(filename: string): string {
  const localDir = path.join(process.cwd(), "docs");
  if (fs.existsSync(path.join(localDir, filename))) {
    return path.join(localDir, filename);
  }
  const repoDir = path.join(process.cwd(), "..", "docs");
  if (fs.existsSync(path.join(repoDir, filename))) {
    return path.join(repoDir, filename);
  }
  throw new Error(`Docs file not found: ${filename}`);
}

function loadJson<T>(filename: string): T {
  const filePath = resolveDataPath(filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function parseCsv(filename: string): Record<string, string> {
  const filePath = resolveCodeTablePath(filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.trim().split("\n");
  const mapping: Record<string, string> = {};
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle quoted CSV values
    const match = line.match(/^([^,]+),\s*"?([^"]*)"?\s*$/);
    if (match) {
      mapping[match[1].trim()] = match[2].trim();
    }
  }
  return mapping;
}

let _agencies: AgencyRecord[] | null = null;
let _budgets: BudgetRecord[] | null = null;
let _vendors: VendorRecord[] | null = null;
let _contracts: ContractRecord[] | null = null;
let _vendorMap: Record<string, VendorRecord & { total_awards: number; active_contracts: number }> | null = null;
let _pscLookup: Record<string, string> | null = null;
let _naicsLookup: Record<string, string> | null = null;

function ensureLoaded(): void {
  if (_agencies !== null) return;

  _agencies = loadJson<AgencyRecord[]>("agencies.json");
  _budgets = loadJson<BudgetRecord[]>("budgets.json");
  _vendors = loadJson<VendorRecord[]>("vendors.json");
  _contracts = loadJson<ContractRecord[]>("contracts.json");
  _pscLookup = parseCsv("psc_codes.csv");
  _naicsLookup = parseCsv("naics_codes.csv");

  // Compute vendor metrics
  const rollups: Record<string, { total_awards: number; active_contracts: number }> = {};
  for (const contract of _contracts) {
    const vid = contract.vendor_id;
    if (!rollups[vid]) {
      rollups[vid] = { total_awards: 0, active_contracts: 0 };
    }
    rollups[vid].total_awards += contract.obligated_amount;
    if (contract.status === "Active") {
      rollups[vid].active_contracts += 1;
    }
  }

  _vendorMap = {};
  for (const vendor of _vendors) {
    const metrics = rollups[vendor.vendor_id] ?? { total_awards: 0, active_contracts: 0 };
    _vendorMap[vendor.vendor_id] = {
      ...vendor,
      total_awards: metrics.total_awards,
      active_contracts: metrics.active_contracts,
    };
  }
}

function enrichContract(contract: ContractRecord): ContractRecord & { psc_description: string; naics_description: string } {
  ensureLoaded();
  return {
    ...contract,
    psc_description: _pscLookup![contract.psc] ?? "Unknown PSC",
    naics_description: _naicsLookup![contract.naics] ?? "Unknown NAICS",
  };
}

export function getAgencies(): AgencyRecord[] {
  ensureLoaded();
  return _agencies!;
}

export function getBudgets(): BudgetRecord[] {
  ensureLoaded();
  return _budgets!;
}

export function getContracts(): ContractRecord[] {
  ensureLoaded();
  return _contracts!;
}

export function getVendorMap(): Record<string, VendorRecord & { total_awards: number; active_contracts: number }> {
  ensureLoaded();
  return _vendorMap!;
}

export function getEnrichedContract(contract: ContractRecord) {
  return enrichContract(contract);
}

export function getApiDocsMarkdown(): string {
  const filePath = resolveDocsPath("api.md");
  return fs.readFileSync(filePath, "utf-8");
}

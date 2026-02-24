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

function resolveExternalSourcePath(filename: string): string {
  const localDir = path.join(process.cwd(), "external_sources");
  if (fs.existsSync(path.join(localDir, filename))) {
    return path.join(localDir, filename);
  }
  const repoDir = path.join(process.cwd(), "..", "external_sources");
  if (fs.existsSync(path.join(repoDir, filename))) {
    return path.join(repoDir, filename);
  }
  throw new Error(`External source file not found: ${filename}`);
}

function parseExternalCsv(filename: string): Record<string, string> {
  const filePath = resolveExternalSourcePath(filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.trim().split("\n");
  const mapping: Record<string, string> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([^,]+),\s*"?([^"]*)"?\s*$/);
    if (match) {
      mapping[match[1].trim()] = match[2].trim();
    }
  }
  return mapping;
}

type AlignmentDiffItem = {
  code: string;
  internal_description?: string;
  official_description?: string;
  contracts_affected: number;
  severity: string;
};

type AlignmentDomainDiff = {
  added: AlignmentDiffItem[];
  removed: AlignmentDiffItem[];
  modified: AlignmentDiffItem[];
};

function classifySeverity(contractsAffected: number, driftType: string): string {
  if (driftType === "removed" && contractsAffected > 0) return "critical";
  if (driftType === "modified" && contractsAffected >= 3) return "high";
  if (driftType === "modified" && contractsAffected > 0) return "medium";
  if (driftType === "added") return "medium";
  return "low";
}

function buildDomainDiff(
  internal: Record<string, string>,
  official: Record<string, string>,
  usageCounts: Record<string, number>,
): AlignmentDomainDiff {
  const added: AlignmentDiffItem[] = [];
  const removed: AlignmentDiffItem[] = [];
  const modified: AlignmentDiffItem[] = [];

  const internalKeys = new Set(Object.keys(internal));
  const officialKeys = new Set(Object.keys(official));

  // Codes in official but not internal
  for (const code of [...officialKeys].filter((k) => !internalKeys.has(k)).sort()) {
    const affected = usageCounts[code] ?? 0;
    added.push({
      code,
      official_description: official[code],
      contracts_affected: affected,
      severity: classifySeverity(affected, "added"),
    });
  }

  // Codes in internal but not official
  for (const code of [...internalKeys].filter((k) => !officialKeys.has(k)).sort()) {
    const affected = usageCounts[code] ?? 0;
    removed.push({
      code,
      internal_description: internal[code],
      contracts_affected: affected,
      severity: classifySeverity(affected, "removed"),
    });
  }

  // Codes in both but with different descriptions
  for (const code of [...internalKeys].filter((k) => officialKeys.has(k)).sort()) {
    if (internal[code] !== official[code]) {
      const affected = usageCounts[code] ?? 0;
      modified.push({
        code,
        internal_description: internal[code],
        official_description: official[code],
        contracts_affected: affected,
        severity: classifySeverity(affected, "modified"),
      });
    }
  }

  return { added, removed, modified };
}

export function loadAlignmentReport(): Record<string, unknown> | null {
  try {
    const filePath = resolveDataPath("alignment_report.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function runAlignmentCheck(): Record<string, unknown> {
  ensureLoaded();

  const internalPsc = parseCsv("psc_codes.csv");
  const internalNaics = parseCsv("naics_codes.csv");
  const officialPsc = parseExternalCsv("official_psc_snapshot.csv");
  const officialNaics = parseExternalCsv("official_naics_snapshot.csv");

  // Build usage counts from contracts
  const pscUsage: Record<string, number> = {};
  const naicsUsage: Record<string, number> = {};
  for (const contract of _contracts!) {
    const psc = contract.psc?.trim();
    if (psc) pscUsage[psc] = (pscUsage[psc] ?? 0) + 1;
    const naics = contract.naics?.trim();
    if (naics) naicsUsage[naics] = (naicsUsage[naics] ?? 0) + 1;
  }

  const pscDiff = buildDomainDiff(internalPsc, officialPsc, pscUsage);
  const naicsDiff = buildDomainDiff(internalNaics, officialNaics, naicsUsage);

  const allItems = [
    ...pscDiff.added, ...pscDiff.removed, ...pscDiff.modified,
    ...naicsDiff.added, ...naicsDiff.removed, ...naicsDiff.modified,
  ];
  const severityCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const item of allItems) {
    severityCounts[item.severity] = (severityCounts[item.severity] ?? 0) + 1;
  }

  return {
    generated_at: new Date().toISOString(),
    psc: pscDiff,
    naics: naicsDiff,
    summary: {
      psc_added: pscDiff.added.length,
      psc_removed: pscDiff.removed.length,
      psc_modified: pscDiff.modified.length,
      naics_added: naicsDiff.added.length,
      naics_removed: naicsDiff.removed.length,
      naics_modified: naicsDiff.modified.length,
      severity_counts: severityCounts,
    },
  };
}

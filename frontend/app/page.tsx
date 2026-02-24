"use client";

import { useEffect, useMemo, useState } from "react";
import ContractDrawer from "../components/ContractDrawer";
import ContractsTable from "../components/ContractsTable";
import FiltersBar from "../components/FiltersBar";
import KpiCard from "../components/KpiCard";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import {
  fetchLatestAlignment,
  fetchAgencies,
  fetchBudgetSummary,
  fetchCobolAdjudication,
  fetchContractDetail,
  fetchContracts,
  fetchVendorDetail,
  runAlignmentCheck
} from "../lib/api";
import type {
  Agency,
  AlignmentDiffAdded,
  AlignmentDiffModified,
  AlignmentDiffRemoved,
  AlignmentLatestResponse,
  AlignmentRunResponse,
  BudgetSummary,
  CobolAdjudication,
  Contract,
  ContractsResponse,
  VendorDetail
} from "../lib/types";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

const PAGE_LIMIT = 10;

function decisionBadgeClass(decision: CobolAdjudication["decision"]): string {
  if (decision === "APPROVE") {
    return "bg-green-100 text-green-800";
  }
  if (decision === "REJECT") {
    return "bg-red-100 text-red-800";
  }
  return "bg-amber-100 text-amber-900";
}

export default function DashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agency, setAgency] = useState<string>("All");
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [status, setStatus] = useState<"All" | "Active" | "Closed">("All");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<"award_date" | "obligated_amount">("award_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [offset, setOffset] = useState<number>(0);

  const [contractsPage, setContractsPage] = useState<ContractsResponse | null>(null);
  const [kpiContracts, setKpiContracts] = useState<Contract[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);

  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [loadingBudget, setLoadingBudget] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<VendorDetail | null>(null);
  const [loadingVendor, setLoadingVendor] = useState<boolean>(false);
  const [adjudicationContractId, setAdjudicationContractId] = useState<string>("");
  const [adjudicationResult, setAdjudicationResult] = useState<CobolAdjudication | null>(null);
  const [loadingAdjudication, setLoadingAdjudication] = useState<boolean>(false);
  const [adjudicationError, setAdjudicationError] = useState<string | null>(null);
  const [alignmentData, setAlignmentData] = useState<AlignmentLatestResponse | null>(null);
  const [loadingAlignment, setLoadingAlignment] = useState<boolean>(false);
  const [runningAlignment, setRunningAlignment] = useState<boolean>(false);
  const [alignmentError, setAlignmentError] = useState<string | null>(null);
  const [alignmentRunMessage, setAlignmentRunMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgencies() {
      try {
        const data = await fetchAgencies();
        setAgencies(data);
      } catch {
        setError("Failed to load agencies.");
      }
    }
    void loadAgencies();
  }, []);

  useEffect(() => {
    setOffset(0);
  }, [agency, fiscalYear, status, search, sortBy, sortDir]);

  useEffect(() => {
    async function loadContracts() {
      setLoadingPage(true);
      setError(null);
      try {
        const [pageData, kpiData] = await Promise.all([
          fetchContracts({ agency, status, fiscalYear, limit: PAGE_LIMIT, offset, sortBy, sortDir }),
          fetchContracts({ agency, status, fiscalYear, limit: 100, offset: 0, sortBy, sortDir })
        ]);
        setContractsPage(pageData);
        setKpiContracts(kpiData.items);
        if (!adjudicationContractId && pageData.items.length > 0) {
          setAdjudicationContractId(pageData.items[0].contract_id);
        }
      } catch {
        setError("Failed to load contracts.");
      } finally {
        setLoadingPage(false);
      }
    }
    void loadContracts();
  }, [agency, fiscalYear, status, offset, sortBy, sortDir]);


  useEffect(() => {
    async function loadBudget() {
      if (agency === "All") {
        setBudgetSummary(null);
        return;
      }
      setLoadingBudget(true);
      try {
        const summary = await fetchBudgetSummary({ agency, fiscalYear });
        setBudgetSummary(summary);
      } catch {
        setBudgetSummary(null);
      } finally {
        setLoadingBudget(false);
      }
    }
    void loadBudget();
  }, [agency, fiscalYear]);

  useEffect(() => {
    async function loadLatestAlignment() {
      setLoadingAlignment(true);
      setAlignmentError(null);
      try {
        const data = await fetchLatestAlignment();
        setAlignmentData(data);
      } catch {
        setAlignmentData(null);
      } finally {
        setLoadingAlignment(false);
      }
    }
    void loadLatestAlignment();
  }, []);

  const filteredPageItems = useMemo(() => {
    const items = contractsPage?.items ?? [];
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter(
      (item) =>
        item.vendor_name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    );
  }, [contractsPage?.items, search]);

  const filteredKpiItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return kpiContracts;
    }
    return kpiContracts.filter(
      (item) =>
        item.vendor_name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    );
  }, [kpiContracts, search]);

  const totalObligated = filteredKpiItems.reduce((sum, item) => sum + item.obligated_amount, 0);
  const activeContractsCount = filteredKpiItems.filter((item) => item.status === "Active").length;

  const topVendorName = useMemo(() => {
    const rollup: Record<string, number> = {};
    for (const item of filteredKpiItems) {
      rollup[item.vendor_name] = (rollup[item.vendor_name] ?? 0) + item.obligated_amount;
    }
    const sorted = Object.entries(rollup).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0][0] : "N/A";
  }, [filteredKpiItems]);

  const largestActiveContract = useMemo(() => {
    const active = filteredKpiItems.filter((item) => item.status === "Active");
    active.sort((a, b) => b.obligated_amount - a.obligated_amount);
    return active[0] ?? null;
  }, [filteredKpiItems]);

  const topAgencyByObligations = useMemo(() => {
    const byAgency: Record<string, number> = {};
    for (const item of filteredKpiItems) {
      byAgency[item.agency] = (byAgency[item.agency] ?? 0) + item.obligated_amount;
    }
    const sorted = Object.entries(byAgency).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? null;
  }, [filteredKpiItems]);

  async function openContract(contract: Contract) {
    setAdjudicationContractId(contract.contract_id);
    setSelectedContract(contract);
    setSelectedVendorDetail(null);
    setDrawerOpen(true);
    setLoadingVendor(true);
    try {
      const fullContract = await fetchContractDetail(contract.contract_id);
      setSelectedContract(fullContract);
      const vendor = await fetchVendorDetail(fullContract.vendor_id);
      setSelectedVendorDetail(vendor);
    } catch {
      setSelectedContract(contract);
      setSelectedVendorDetail(null);
    } finally {
      setLoadingVendor(false);
    }
  }

  async function runAdjudication() {
    const trimmedContractId = adjudicationContractId.trim();
    if (!trimmedContractId) {
      setAdjudicationError("Enter a contract ID to evaluate the legacy award rules.");
      return;
    }

    setLoadingAdjudication(true);
    setAdjudicationError(null);
    try {
      const result = await fetchCobolAdjudication(trimmedContractId);
      setAdjudicationResult(result);
    } catch {
      setAdjudicationResult(null);
      setAdjudicationError("Could not evaluate the contract for this contract ID.");
    } finally {
      setLoadingAdjudication(false);
    }
  }

  async function triggerAlignmentCheck() {
    setRunningAlignment(true);
    setAlignmentRunMessage(null);
    setAlignmentError(null);
    try {
      const runResult: AlignmentRunResponse = await runAlignmentCheck();
      const latest = await fetchLatestAlignment();
      setAlignmentData(latest);
      setAlignmentRunMessage(
        `Alignment check completed (${runResult.summary.naics_added + runResult.summary.naics_removed + runResult.summary.naics_modified} changes detected).`
      );
    } catch {
      setAlignmentError("Could not run alignment check. Please try again.");
    } finally {
      setRunningAlignment(false);
    }
  }

  const topImpactedCodes = useMemo(() => {
    if (!alignmentData) {
      return [];
    }

    type ImpactedCode = { domain: "NAICS"; change: "added" | "removed" | "modified"; code: string; contracts: number };
    const impacted: ImpactedCode[] = [];

    const pushItems = (
      domain: "NAICS",
      change: "added" | "removed" | "modified",
      items: Array<AlignmentDiffAdded | AlignmentDiffRemoved | AlignmentDiffModified>
    ) => {
      for (const item of items) {
        impacted.push({ domain, change, code: item.code, contracts: item.contracts_affected });
      }
    };

    pushItems("NAICS", "added", alignmentData.report.naics.added);
    pushItems("NAICS", "removed", alignmentData.report.naics.removed);
    pushItems("NAICS", "modified", alignmentData.report.naics.modified);

    return impacted.sort((a, b) => b.contracts - a.contracts).slice(0, 3);
  }, [alignmentData]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="space-y-4 p-6">
          {error ? <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">{error}</div> : null}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total Obligated" value={money(totalObligated)} loading={loadingPage} />
            <KpiCard label="Active Contracts" value={String(activeContractsCount)} loading={loadingPage} />
            <KpiCard label="Top Vendor" value={topVendorName} loading={loadingPage} />
            <KpiCard
              label="Remaining Budget"
              value={budgetSummary ? money(budgetSummary.remaining_budget) : "Select Agency"}
              loading={loadingBudget}
            />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
            <div className="mb-2 font-semibold text-gray-900">Insights</div>
            {loadingPage ? (
              <div className="h-12 animate-pulse rounded bg-gray-100" />
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  Largest active contract:{" "}
                  {largestActiveContract
                    ? `${largestActiveContract.contract_id} (${money(largestActiveContract.obligated_amount)})`
                    : "N/A"}
                </div>
                <div>
                  Agency with highest obligations:{" "}
                  {topAgencyByObligations ? `${topAgencyByObligations[0]} (${money(topAgencyByObligations[1])})` : "N/A"}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
            <div className="mb-1 font-semibold text-gray-900">Legacy Award Adjudication</div>
            <div className="mb-3 text-gray-600">
              Evaluate a contract through the legacy award rules engine and return APPROVE, REVIEW, or REJECT.
            </div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={adjudicationContractId}
                onChange={(event) => setAdjudicationContractId(event.target.value)}
                placeholder="e.g. DOT-2026-00041"
                className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm sm:max-w-xs"
              />
              <button
                className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => void runAdjudication()}
                disabled={loadingAdjudication}
              >
                {loadingAdjudication ? "Evaluating..." : "Evaluate contract"}
              </button>
              <button
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                onClick={() =>
                  setAdjudicationContractId(selectedContract?.contract_id ?? adjudicationContractId)
                }
                disabled={!selectedContract}
              >
                Use selected contract
              </button>
            </div>

            {adjudicationError ? (
              <div className="mb-3 rounded bg-red-100 p-2 text-red-800">{adjudicationError}</div>
            ) : null}

            {adjudicationResult ? (
              <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{adjudicationResult.program_name}</span>
                  <span className="text-gray-500">Contract {adjudicationResult.contract_id}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${decisionBadgeClass(adjudicationResult.decision)}`}
                  >
                    {adjudicationResult.decision}
                  </span>
                </div>
                <div className="text-gray-700">Vendor: {adjudicationResult.vendor_id}</div>
                <div className="text-gray-700">Reasons: {adjudicationResult.reasons.join(" ")}</div>
                <div className="text-gray-600">
                  Inputs: status={adjudicationResult.inputs.contract_status}, obligated=
                  {money(adjudicationResult.inputs.obligated_amount)}, active contracts=
                  {adjudicationResult.inputs.vendor_active_contracts}, total awards=
                  {money(adjudicationResult.inputs.vendor_total_awards)}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
            <div className="mb-1 font-semibold text-gray-900">Regulatory Alignment</div>
            <div className="mb-3 text-gray-600">
              Compare internal NAICS tables against official snapshots and summarize impact.
            </div>
            <button
              className="mb-3 rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() => void triggerAlignmentCheck()}
              disabled={runningAlignment}
            >
              {runningAlignment ? "Running..." : "Run Alignment Check"}
            </button>

            {alignmentError ? <div className="mb-3 rounded bg-red-100 p-2 text-red-800">{alignmentError}</div> : null}
            {alignmentRunMessage ? (
              <div className="mb-3 rounded bg-green-100 p-2 text-green-800">{alignmentRunMessage}</div>
            ) : null}

            {loadingAlignment ? (
              <div className="h-12 animate-pulse rounded bg-gray-100" />
            ) : alignmentData ? (
              <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                <div className="text-gray-700">Last run: {new Date(alignmentData.generated_at).toLocaleString()}</div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div>NAICS added: {alignmentData.summary.naics_added}</div>
                  <div>NAICS removed: {alignmentData.summary.naics_removed}</div>
                  <div>NAICS modified: {alignmentData.summary.naics_modified}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-800">Top impacted codes:</span>{" "}
                  {topImpactedCodes.length
                    ? topImpactedCodes
                        .map((item) => `${item.domain} ${item.code} (${item.change}, ${item.contracts} contracts)`)
                        .join(", ")
                    : "None"}
                </div>
              </div>
            ) : (
              <div className="rounded bg-gray-50 p-2 text-gray-600">
                No alignment report found yet. Run an alignment check to generate one.
              </div>
            )}
          </section>

          <FiltersBar
            agencies={agencies}
            agency={agency}
            fiscalYear={fiscalYear}
            status={status}
            search={search}
            sortBy={sortBy}
            sortDir={sortDir}
            onAgencyChange={setAgency}
            onFiscalYearChange={setFiscalYear}
            onStatusChange={setStatus}
            onSearchChange={setSearch}
            onSortByChange={setSortBy}
            onSortDirChange={setSortDir}
          />

          <ContractsTable contracts={filteredPageItems} loading={loadingPage} onSelect={openContract} />

          <section className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {offset + 1}-{Math.min(offset + PAGE_LIMIT, contractsPage?.total ?? 0)} of {contractsPage?.total ?? 0}
            </div>
            <div className="space-x-2">
              <button
                className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-40"
                onClick={() => setOffset((prev) => Math.max(prev - PAGE_LIMIT, 0))}
                disabled={offset === 0 || loadingPage}
              >
                Prev
              </button>
              <button
                className="rounded border border-gray-300 bg-white px-3 py-1 text-sm disabled:opacity-40"
                onClick={() => setOffset((prev) => prev + PAGE_LIMIT)}
                disabled={loadingPage || (contractsPage ? offset + PAGE_LIMIT >= contractsPage.total : true)}
              >
                Next
              </button>
            </div>
          </section>

        </main>
      </div>

      <ContractDrawer
        open={drawerOpen}
        contract={selectedContract}
        vendorDetail={selectedVendorDetail}
        loadingVendor={loadingVendor}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedContract(null);
          setSelectedVendorDetail(null);
        }}
      />
    </div>
  );
}

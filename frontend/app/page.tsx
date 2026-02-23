"use client";

import { useEffect, useMemo, useState } from "react";
import ContractDrawer from "../components/ContractDrawer";
import ContractsTable from "../components/ContractsTable";
import FiltersBar from "../components/FiltersBar";
import KpiCard from "../components/KpiCard";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import {
  fetchAgencies,
  fetchBudgetSummary,
  fetchCobolAdjudication,
  fetchContractDetail,
  fetchContracts,
  fetchVendorDetail,
  triggerDevinModernization
} from "../lib/api";
import type {
  Agency,
  BudgetSummary,
  CobolAdjudication,
  Contract,
  ContractsResponse,
  ModernizationTriggerResponse,
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
  const [cobolContractId, setCobolContractId] = useState<string>("");
  const [cobolResult, setCobolResult] = useState<CobolAdjudication | null>(null);
  const [loadingCobol, setLoadingCobol] = useState<boolean>(false);
  const [cobolError, setCobolError] = useState<string | null>(null);
  const [targetStack, setTargetStack] = useState<"python-fastapi" | "java-spring" | "go-service">("python-fastapi");
  const [modernizationResult, setModernizationResult] = useState<ModernizationTriggerResponse | null>(null);
  const [loadingModernization, setLoadingModernization] = useState<boolean>(false);
  const [modernizationError, setModernizationError] = useState<string | null>(null);

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
        if (!cobolContractId && pageData.items.length > 0) {
          setCobolContractId(pageData.items[0].contract_id);
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
    setCobolContractId(contract.contract_id);
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

  async function runCobolAdjudication() {
    const trimmedContractId = cobolContractId.trim();
    if (!trimmedContractId) {
      setCobolError("Enter a contract ID to evaluate legacy COBOL adjudication.");
      return;
    }

    setLoadingCobol(true);
    setCobolError(null);
    try {
      const result = await fetchCobolAdjudication(trimmedContractId);
      setCobolResult(result);
    } catch {
      setCobolResult(null);
      setCobolError("Could not run COBOL adjudication for this contract ID.");
    } finally {
      setLoadingCobol(false);
    }
  }

  async function runDevinModernizationTrigger() {
    const trimmedContractId = cobolContractId.trim();
    if (!trimmedContractId) {
      setModernizationError("Enter a contract ID before triggering Devin modernization.");
      return;
    }

    setLoadingModernization(true);
    setModernizationError(null);
    try {
      const result = await triggerDevinModernization({
        contractId: trimmedContractId,
        targetStack
      });
      setModernizationResult(result);
    } catch {
      setModernizationResult(null);
      setModernizationError(
        "Could not trigger modernization. Check backend env vars GITHUB_TOKEN and GITHUB_REPOSITORY."
      );
    } finally {
      setLoadingModernization(false);
    }
  }

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
            <div className="mb-1 font-semibold text-gray-900">Legacy COBOL Adjudication</div>
            <div className="mb-3 text-gray-600">
              Evaluate a contract through the legacy award rules engine and return APPROVE, REVIEW, or REJECT.
            </div>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={cobolContractId}
                onChange={(event) => setCobolContractId(event.target.value)}
                placeholder="e.g. DOT-2026-00041"
                className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm sm:max-w-xs"
              />
              <button
                className="rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => void runCobolAdjudication()}
                disabled={loadingCobol}
              >
                {loadingCobol ? "Evaluating..." : "Run COBOL"}
              </button>
              <button
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                onClick={() => setCobolContractId(selectedContract?.contract_id ?? cobolContractId)}
                disabled={!selectedContract}
              >
                Use selected contract
              </button>
            </div>

            {cobolError ? <div className="mb-3 rounded bg-red-100 p-2 text-red-800">{cobolError}</div> : null}

            {cobolResult ? (
              <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{cobolResult.program_name}</span>
                  <span className="text-gray-500">Contract {cobolResult.contract_id}</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${decisionBadgeClass(cobolResult.decision)}`}>
                    {cobolResult.decision}
                  </span>
                </div>
                <div className="text-gray-700">Vendor: {cobolResult.vendor_id}</div>
                <div className="text-gray-700">Reasons: {cobolResult.reasons.join(" ")}</div>
                <div className="text-gray-600">
                  Inputs: status={cobolResult.inputs.contract_status}, obligated={money(cobolResult.inputs.obligated_amount)},
                  active contracts={cobolResult.inputs.vendor_active_contracts}, total awards=
                  {money(cobolResult.inputs.vendor_total_awards)}
                </div>
              </div>
            ) : null}

            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="mb-1 font-semibold text-gray-900">Trigger Devin Modernization</div>
              <div className="mb-3 text-gray-600">
                Queue a GitHub Actions automation that creates a Devin COBOL modernization session.
              </div>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={targetStack}
                  onChange={(event) =>
                    setTargetStack(event.target.value as "python-fastapi" | "java-spring" | "go-service")
                  }
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="python-fastapi">python-fastapi</option>
                  <option value="java-spring">java-spring</option>
                  <option value="go-service">go-service</option>
                </select>
                <button
                  className="rounded bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  onClick={() => void runDevinModernizationTrigger()}
                  disabled={loadingModernization}
                >
                  {loadingModernization ? "Triggering..." : "Trigger Devin Modernization"}
                </button>
              </div>
              {modernizationError ? (
                <div className="mb-3 rounded bg-red-100 p-2 text-red-800">{modernizationError}</div>
              ) : null}
              {modernizationResult ? (
                <div className="rounded border border-blue-200 bg-blue-50 p-3 text-gray-800">
                  <div className="font-medium text-blue-900">{modernizationResult.message}</div>
                  <div className="mt-1 text-sm">
                    Event: {modernizationResult.event_type} | Contract: {modernizationResult.contract_id} | Target:{" "}
                    {modernizationResult.target_stack}
                  </div>
                  <div className="text-sm">
                    Repository: {modernizationResult.repository} | Decision preview:{" "}
                    {modernizationResult.decision_preview}
                  </div>
                </div>
              ) : null}
            </div>
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

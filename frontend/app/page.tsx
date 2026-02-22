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
  fetchContractDetail,
  fetchContracts,
  fetchVendorDetail
} from "../lib/api";
import type { Agency, BudgetSummary, Contract, ContractsResponse, VendorDetail } from "../lib/types";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

const PAGE_LIMIT = 10;

export default function DashboardPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agency, setAgency] = useState<string>("All");
  const [fiscalYear, setFiscalYear] = useState<number>(2026);
  const [status, setStatus] = useState<"All" | "Active" | "Closed">("All");
  const [search, setSearch] = useState<string>("");
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
  }, [agency, fiscalYear, status, search]);

  useEffect(() => {
    async function loadContracts() {
      setLoadingPage(true);
      setError(null);
      try {
        const [pageData, kpiData] = await Promise.all([
          fetchContracts({ agency, status, fiscalYear, limit: PAGE_LIMIT, offset }),
          fetchContracts({ agency, status, fiscalYear, limit: 100, offset: 0 })
        ]);
        setContractsPage(pageData);
        setKpiContracts(kpiData.items);
      } catch {
        setError("Failed to load contracts.");
      } finally {
        setLoadingPage(false);
      }
    }
    void loadContracts();
  }, [agency, fiscalYear, status, offset]);

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

          <FiltersBar
            agencies={agencies}
            agency={agency}
            fiscalYear={fiscalYear}
            status={status}
            search={search}
            onAgencyChange={setAgency}
            onFiscalYearChange={setFiscalYear}
            onStatusChange={setStatus}
            onSearchChange={setSearch}
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

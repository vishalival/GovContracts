import type { Agency } from "../lib/types";

type FiltersBarProps = {
  agencies: Agency[];
  agency: string;
  fiscalYear: number;
  status: "All" | "Active" | "Closed";
  search: string;
  sortBy: "award_date" | "obligated_amount";
  sortDir: "asc" | "desc";
  onAgencyChange: (value: string) => void;
  onFiscalYearChange: (value: number) => void;
  onStatusChange: (value: "All" | "Active" | "Closed") => void;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: "award_date" | "obligated_amount") => void;
  onSortDirChange: (value: "asc" | "desc") => void;
};

export default function FiltersBar(props: FiltersBarProps) {
  const {
    agencies,
    agency,
    fiscalYear,
    status,
    search,
    sortBy,
    sortDir,
    onAgencyChange,
    onFiscalYearChange,
    onStatusChange,
    onSearchChange,
    onSortByChange,
    onSortDirChange
  } = props;

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-6">
      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Agency</span>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={agency}
          onChange={(event) => onAgencyChange(event.target.value)}
        >
          <option value="All">All</option>
          {agencies.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Fiscal year</span>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={fiscalYear}
          onChange={(event) => onFiscalYearChange(Number(event.target.value))}
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </label>

      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Status</span>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as "All" | "Active" | "Closed")}
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </select>
      </label>

      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Sort by</span>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value as "award_date" | "obligated_amount")}
        >
          <option value="award_date">Award Date</option>
          <option value="obligated_amount">Obligated Amount</option>
        </select>
      </label>

      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Direction</span>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={sortDir}
          onChange={(event) => onSortDirChange(event.target.value as "asc" | "desc")}
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </label>

      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Search</span>
        <input
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Description or vendor"
        />
      </label>
    </div>
  );
}

import type { Agency } from "../lib/types";

type FiltersBarProps = {
  agencies: Agency[];
  agency: string;
  fiscalYear: number;
  status: "All" | "Active" | "Closed";
  search: string;
  onAgencyChange: (value: string) => void;
  onFiscalYearChange: (value: number) => void;
  onStatusChange: (value: "All" | "Active" | "Closed") => void;
  onSearchChange: (value: string) => void;
};

export default function FiltersBar(props: FiltersBarProps) {
  const {
    agencies,
    agency,
    fiscalYear,
    status,
    search,
    onAgencyChange,
    onFiscalYearChange,
    onStatusChange,
    onSearchChange
  } = props;

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-4">
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

import type { Contract } from "../lib/types";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

type ContractsTableProps = {
  contracts: Contract[];
  loading?: boolean;
  onSelect: (contract: Contract) => void;
};

export default function ContractsTable({ contracts, loading = false, onSelect }: ContractsTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 h-6 w-52 animate-pulse rounded bg-gray-200" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-10 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No contracts match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Contract ID</th>
            <th className="px-4 py-3">Agency</th>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Obligated</th>
            <th className="px-4 py-3">Award Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Category</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr
              key={contract.contract_id}
              className="cursor-pointer border-t border-gray-100 hover:bg-blue-50"
              onClick={() => onSelect(contract)}
            >
              <td className="px-4 py-3 font-medium text-gray-800">{contract.contract_id}</td>
              <td className="px-4 py-3">{contract.agency}</td>
              <td className="px-4 py-3">{contract.vendor_name}</td>
              <td className="px-4 py-3">{money(contract.obligated_amount)}</td>
              <td className="px-4 py-3">{contract.award_date}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    contract.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {contract.status}
                </span>
              </td>
              <td className="px-4 py-3">{contract.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

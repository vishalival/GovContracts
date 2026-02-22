import type { Contract, VendorDetail } from "../lib/types";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

type ContractDrawerProps = {
  open: boolean;
  contract: Contract | null;
  vendorDetail: VendorDetail | null;
  loadingVendor?: boolean;
  onClose: () => void;
};

export default function ContractDrawer({
  open,
  contract,
  vendorDetail,
  loadingVendor = false,
  onClose
}: ContractDrawerProps) {
  if (!open || !contract) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/20">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <div className="text-sm text-gray-500">Contract details</div>
            <div className="text-lg font-semibold">{contract.contract_id}</div>
          </div>
          <button className="rounded-md border border-gray-300 px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="space-y-5 p-5 text-sm text-gray-700">
          <section>
            <h3 className="mb-2 font-semibold text-gray-900">Overview</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Agency: {contract.agency}</div>
              <div>Status: {contract.status}</div>
              <div>Vendor: {contract.vendor_name}</div>
              <div>Fiscal Year: {contract.fiscal_year}</div>
              <div>Obligated: {money(contract.obligated_amount)}</div>
              <div>Total Value: {money(contract.total_value)}</div>
              <div>Award Date: {contract.award_date}</div>
              <div>Period End: {contract.period_end}</div>
              <div>PSC: {contract.psc}</div>
              <div>NAICS: {contract.naics}</div>
              <div>Category: {contract.category}</div>
              <div>Office: {contract.program_office}</div>
            </div>
            <p className="mt-3 rounded bg-gray-50 p-3">{contract.description}</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-gray-900">Vendor Summary</h3>
            {loadingVendor ? (
              <div className="h-20 animate-pulse rounded bg-gray-100" />
            ) : vendorDetail ? (
              <div className="space-y-1">
                <div>{vendorDetail.name}</div>
                <div>Total Awards: {money(vendorDetail.total_awards)}</div>
                <div>Active Contracts: {vendorDetail.active_contracts}</div>
                <div>
                  Top Agencies:{" "}
                  {vendorDetail.top_agencies.map((item) => `${item.agency} (${money(item.obligated_amount)})`).join(", ")}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Vendor details unavailable.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

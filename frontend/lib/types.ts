export type Agency = {
  code: string;
  name: string;
};

export type BudgetBreakdownItem = {
  category: string;
  amount: number;
};

export type BudgetSummary = {
  agency: string;
  fiscal_year: number;
  total_budget: number;
  obligated_amount: number;
  remaining_budget: number;
  breakdown_by_category: BudgetBreakdownItem[];
};

export type ContractStatus = "Active" | "Closed";

export type Contract = {
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
  psc_description?: string;
  naics_description?: string;
  description: string;
  status: ContractStatus;
  category: string;
  program_office: string;
  place_of_performance: string;
};

export type ContractsResponse = {
  total: number;
  limit: number;
  offset: number;
  items: Contract[];
};

export type Vendor = {
  vendor_id: string;
  name: string;
  uei: string;
  duns?: string;
  total_awards: number;
  active_contracts: number;
  small_business: boolean;
};

export type VendorDetail = Vendor & {
  contracts_count: number;
  top_agencies: { agency: string; obligated_amount: number }[];
  top_categories: { category: string; obligated_amount: number }[];
};

export type CobolAdjudicationDecision = "APPROVE" | "REVIEW" | "REJECT";

export type CobolAdjudication = {
  program_name: string;
  contract_id: string;
  vendor_id: string;
  decision: CobolAdjudicationDecision;
  reasons: string[];
  inputs: {
    contract_status: string;
    obligated_amount: number;
    vendor_active_contracts: number;
    vendor_total_awards: number;
  };
};

export type ModernizationTriggerResponse = {
  status: "queued";
  message: string;
  event_type: string;
  contract_id: string;
  vendor_id: string;
  cobol_path: string;
  target_stack: string;
  base_branch: string;
  decision_preview: CobolAdjudicationDecision;
  repository: string;
};

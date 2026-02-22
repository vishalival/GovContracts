# GovContracts API (Phase 1)

Base URL: `http://localhost:8000`

## GET /v1/agencies

Returns the list of supported agencies for filter dropdowns.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| None | - | - | No query parameters. |

### Example curl

```bash
curl -s http://localhost:8000/v1/agencies
```

### Example JSON response

```json
{
  "items": [
    { "code": "DOD", "name": "Department of Defense" },
    { "code": "DOT", "name": "Department of Transportation" },
    { "code": "HHS", "name": "Department of Health and Human Services" }
  ]
}
```

## GET /v1/budget/summary

Returns budget summary for one agency and fiscal year.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| fiscal_year | integer | No | Fiscal year. Default: `2026`. |
| agency | string | Yes | Agency code, e.g. `DOT`. |

### Example curl

```bash
curl -s "http://localhost:8000/v1/budget/summary?agency=DOT&fiscal_year=2026"
```

### Example JSON response

```json
{
  "agency": "DOT",
  "fiscal_year": 2026,
  "total_budget": 18750000000,
  "obligated_amount": 14240000000,
  "remaining_budget": 4510000000,
  "breakdown_by_category": [
    { "category": "Infrastructure", "amount": 8200000000 },
    { "category": "IT Systems", "amount": 1800000000 },
    { "category": "Operations", "amount": 2800000000 }
  ]
}
```

## GET /v1/contracts

Returns paginated contracts with optional agency/status/year filters.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| agency | string | No | Agency code. Use `All` or omit for all agencies. |
| status | string | No | One of `Active`, `Closed`, `All`. Default: `All`. |
| fiscal_year | integer | No | Fiscal year. Default: `2026`. |
| limit | integer | No | Page size. Default: `25`, max: `100`. |
| offset | integer | No | Pagination offset. Default: `0`. |
| sort_by | string | No | Field to sort by. One of `award_date`, `obligated_amount`. Default: `award_date`. |
| sort_dir | string | No | Sort direction. One of `asc`, `desc`. Default: `desc`. |

### Example curl

```bash
curl -s "http://localhost:8000/v1/contracts?agency=DOT&status=Active&fiscal_year=2026&limit=10&offset=0&sort_by=award_date&sort_dir=desc"
```

### Example JSON response

```json
{
  "total": 6,
  "limit": 10,
  "offset": 0,
  "items": [
    {
      "contract_id": "DOT-2026-00041",
      "agency": "DOT",
      "fiscal_year": 2026,
      "vendor_id": "V003",
      "vendor_name": "BlueRiver Transit Systems",
      "vendor_uei": "UEI3N8D0TXA94",
      "obligated_amount": 42000000,
      "total_value": 115000000,
      "award_date": "2026-01-14",
      "period_end": "2029-09-30",
      "psc": "R706",
      "naics": "488490",
      "description": "Regional traffic management platform modernization",
      "status": "Active",
      "category": "IT Systems",
      "program_office": "Office of Surface Transportation",
      "place_of_performance": "Austin,TX"
    }
  ]
}
```

### Error Responses

| Status | Condition | Example `detail` |
|---|---|---|
| 400 | Invalid `status` value | `"status must be one of All, Active, Closed"` |
| 400 | Invalid `sort_by` value | `"sort_by must be one of award_date, obligated_amount"` |
| 400 | Invalid `sort_dir` value | `"sort_dir must be one of asc, desc"` |

## GET /v1/contracts/{contract_id}

Returns complete detail for one contract.

### Path Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| contract_id | string | Yes | Contract ID such as `DOT-2026-00041`. |

### Example curl

```bash
curl -s http://localhost:8000/v1/contracts/DOT-2026-00041
```

### Example JSON response

```json
{
  "item": {
    "contract_id": "DOT-2026-00041",
    "agency": "DOT",
    "fiscal_year": 2026,
    "vendor_id": "V003",
    "vendor_name": "BlueRiver Transit Systems",
    "vendor_uei": "UEI3N8D0TXA94",
    "obligated_amount": 42000000,
    "total_value": 115000000,
    "award_date": "2026-01-14",
    "period_end": "2029-09-30",
    "psc": "R706",
    "naics": "488490",
    "description": "Regional traffic management platform modernization",
    "status": "Active",
    "category": "IT Systems",
    "program_office": "Office of Surface Transportation",
    "place_of_performance": "Austin,TX"
  }
}
```

## GET /v1/vendors

Returns vendor search results.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| query | string | No | Case-insensitive match on vendor name or UEI. |
| limit | integer | No | Max number of vendors. Default: `20`, max: `100`. |

### Example curl

```bash
curl -s "http://localhost:8000/v1/vendors?query=blue&limit=5"
```

### Example JSON response

```json
{
  "items": [
    {
      "vendor_id": "V003",
      "name": "BlueRiver Transit Systems",
      "uei": "UEI3N8D0TXA94",
      "duns": "834920154",
      "total_awards": 356000000,
      "active_contracts": 4,
      "small_business": false
    }
  ]
}
```

## GET /v1/vendors/{vendor_id}

Returns detailed vendor profile, totals, and top agencies/categories.

### Path Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| vendor_id | string | Yes | Vendor ID such as `V003`. |

### Example curl

```bash
curl -s http://localhost:8000/v1/vendors/V003
```

### Example JSON response

```json
{
  "vendor_id": "V003",
  "name": "BlueRiver Transit Systems",
  "uei": "UEI3N8D0TXA94",
  "duns": "834920154",
  "small_business": false,
  "total_awards": 356000000,
  "active_contracts": 4,
  "contracts_count": 7,
  "top_agencies": [
    { "agency": "DOT", "obligated_amount": 162000000 },
    { "agency": "DHS", "obligated_amount": 104000000 }
  ],
  "top_categories": [
    { "category": "Infrastructure", "obligated_amount": 188000000 },
    { "category": "IT Systems", "obligated_amount": 101000000 }
  ]
}
```

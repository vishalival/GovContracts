# GovContracts API (Phase 1)

Base URL: `http://localhost:8000`

## GET /health

Returns a simple health-check response indicating the API is running.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| None | - | - | No query parameters. |

### Example curl

```bash
curl -s http://localhost:8000/health
```

### Example JSON response

```json
{
  "status": "ok"
}
```

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

Each contract item includes `psc_description` (string) and `naics_description` (string) fields resolved at runtime from the CSV lookup tables in `code_tables/`. If a code is not found, the value falls back to `"Unknown PSC"` or `"Unknown NAICS"` respectively.
### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| agency | string | No | Agency code. Use `All` or omit for all agencies. |
| status | string | No | One of `Active`, `Closed`, `All`. Default: `All`. |
| fiscal_year | integer | No | Fiscal year. Default: `2026`. |
| limit | integer | No | Page size. Default: `25`, max: `100`. |
| offset | integer | No | Pagination offset. Default: `0`. |
| sort_by | string | No | Field to sort results by. One of `award_date`, `obligated_amount`. Default: `award_date`. |
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
      "psc_description": "Support - Management: IT Systems Development",
      "naics_description": "Other Support Activities for Road Transportation",
      "description": "Regional traffic management platform modernization",
      "status": "Active",
      "category": "IT Systems",
      "program_office": "Office of Surface Transportation",
      "place_of_performance": "Austin,TX"
    }
  ]
}
```

## GET /v1/contracts/{contract_id}

Returns complete detail for one contract. The response item includes `psc_description` and `naics_description` fields (see [GET /v1/contracts](#get-v1contracts) for details).

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
    "psc_description": "Support - Management: IT Systems Development",
    "naics_description": "Other Support Activities for Road Transportation",
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

## GET /v1/legacy/cobol/source

Returns the legacy COBOL source file used for contract award adjudication.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| None | - | - | No query parameters. |

### Error Responses

| Status | Detail |
|---|---|
| 404 | Legacy COBOL source not found |

### Example curl

```bash
curl -s http://localhost:8000/v1/legacy/cobol/source
```

### Example JSON response

```json
{
  "program_name": "CONTRACT_AWARD_ADJUDICATION",
  "path": "legacy_cobol/CONTRACT_AWARD_ADJUDICATION.cbl",
  "content": "IDENTIFICATION DIVISION.\nPROGRAM-ID. CONTRACT-AWARD-ADJUDICATION.\n..."
}
```

## GET /v1/legacy/cobol/adjudication

Evaluates one contract and vendor profile using legacy-style adjudication logic and returns `APPROVE`, `REVIEW`, or `REJECT`. Rules are evaluated in priority order and the first matching rule determines the outcome (COBOL first-match-wins semantics), so the `reasons` array always contains exactly one element.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| contract_id | string | Yes | Contract ID (5–40 characters), e.g. `DOT-2026-00041`. |

### Error Responses

| Status | Detail |
|---|---|
| 404 | Contract not found |
| 404 | Vendor not found for contract |
| 422 | Validation error (contract_id length must be 5–40) |

### Example curl

```bash
curl -s "http://localhost:8000/v1/legacy/cobol/adjudication?contract_id=DOT-2026-00041"
```

### Example JSON response

```json
{
  "program_name": "CONTRACT_AWARD_ADJUDICATION",
  "contract_id": "DOT-2026-00041",
  "vendor_id": "V003",
  "decision": "APPROVE",
  "reasons": [
    "Contract and vendor profile satisfy automated legacy award checks."
  ],
  "inputs": {
    "contract_status": "Active",
    "obligated_amount": 42000000,
    "vendor_active_contracts": 3,
    "vendor_total_awards": 199000000
  }
}
```

## POST /internal/alignment/run

Triggers a regulatory alignment check that compares internal PSC and NAICS code tables against official external snapshots. Produces a JSON report, a Markdown report (`docs/ALIGNMENT_REPORT.md`), and a Markdown proposal (`docs/ALIGNMENT_PROPOSAL.md`).

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| None | - | - | No query parameters. |

### Example curl

```bash
curl -s -X POST http://localhost:8000/internal/alignment/run
```

### Example JSON response

```json
{
  "status": "ok",
  "generated_at": "2026-02-24T04:29:20.514720+00:00",
  "summary": {
    "psc_added": 2,
    "psc_removed": 1,
    "psc_modified": 2,
    "naics_added": 0,
    "naics_removed": 7,
    "naics_modified": 4,
    "severity_counts": {
      "critical": 1,
      "high": 1,
      "medium": 4,
      "low": 0
    }
  },
  "files_written": {
    "json": "backend/data/alignment_report.json",
    "markdown_report": "docs/ALIGNMENT_REPORT.md",
    "markdown_proposal": "docs/ALIGNMENT_PROPOSAL.md"
  }
}
```

## GET /internal/alignment/latest

Returns the most recent alignment report. The `report` object contains per-domain diffs (`psc` and `naics`), each with `added`, `removed`, and `modified` arrays. Every drift item includes a `severity` field (`critical`, `high`, `medium`, or `low`). The `summary` object contains aggregate counts and a `severity_counts` breakdown.

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| None | - | - | No query parameters. |

### Error Responses

| Status | Detail |
|---|---|
| 404 | No alignment report found. Run POST /internal/alignment/run first. |

### Example curl

```bash
curl -s http://localhost:8000/internal/alignment/latest
```

### Example JSON response

```json
{
  "generated_at": "2026-02-24T04:29:20.514720+00:00",
  "summary": {
    "psc_added": 2,
    "psc_removed": 1,
    "psc_modified": 2,
    "naics_added": 0,
    "naics_removed": 7,
    "naics_modified": 4,
    "severity_counts": {
      "critical": 1,
      "high": 1,
      "medium": 4,
      "low": 0
    }
  },
  "report": {
    "generated_at": "2026-02-24T04:29:20.514720+00:00",
    "psc": {
      "added": [
        {
          "code": "R799",
          "official_description": "Support - Management: Regulatory Compliance Support",
          "contracts_affected": 0,
          "severity": "medium"
        }
      ],
      "removed": [
        {
          "code": "Y1JZ",
          "internal_description": "Construction of Miscellaneous Buildings",
          "contracts_affected": 1,
          "severity": "critical"
        }
      ],
      "modified": [
        {
          "code": "D302",
          "internal_description": "IT and Telecom - Systems Development",
          "official_description": "IT and Telecommunications Systems Support Services",
          "contracts_affected": 3,
          "severity": "high"
        }
      ]
    },
    "naics": {
      "added": [],
      "removed": [
        {
          "code": "237310",
          "internal_description": "Highway, Street, and Bridge Construction",
          "contracts_affected": 1,
          "severity": "critical"
        }
      ],
      "modified": [
        {
          "code": "238220",
          "internal_description": "Plumbing and HVAC Contractors",
          "official_description": "Plumbing, Heating, and Air-Conditioning Contractors",
          "contracts_affected": 0,
          "severity": "low"
        }
      ]
    },
    "summary": {
      "psc_added": 2,
      "psc_removed": 1,
      "psc_modified": 2,
      "naics_added": 0,
      "naics_removed": 7,
      "naics_modified": 4,
      "severity_counts": {
        "critical": 1,
        "high": 1,
        "medium": 4,
        "low": 0
      }
    }
  }
}
```

## GET /v1/docs/api

Returns the raw Markdown content of the API documentation file (`docs/api.md`).

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| None | - | - | No query parameters. |

### Error Responses

| Status | Detail |
|---|---|
| 404 | API docs not found |

### Example curl

```bash
curl -s http://localhost:8000/v1/docs/api
```

### Example JSON response

```json
{
  "content": "# GovContracts API (Phase 1)\n\nBase URL: `http://localhost:8000`\n..."
}
```

## POST /v1/modernization/trigger

Triggers GitHub `repository_dispatch` so a workflow can launch a Devin COBOL modernization session.

### Environment Requirements (backend)

| Name | Required | Description |
|---|---|---|
| GITHUB_TOKEN | Yes | GitHub token with permission to dispatch repository events. |
| GITHUB_REPOSITORY | Yes | Repository slug in `owner/repo` format. |
| GITHUB_API_URL | No | Defaults to `https://api.github.com`. |

### JSON Body

| Name | Type | Required | Description |
|---|---|---|---|
| contract_id | string | Yes | Contract ID (5–40 characters), e.g. `DOT-2026-00041`. |
| cobol_path | string | No | Path to a `.cbl` file (5–200 characters). Defaults to `backend/legacy_cobol/CONTRACT_AWARD_ADJUDICATION.cbl`. |
| target_stack | string | No | Target technology stack (2–40 characters). Defaults to `python-fastapi`. |
| base_branch | string | No | Git branch name (1–100 characters). Defaults to `main`. |
| event_type | string | No | GitHub repository dispatch event type (3–100 characters). Defaults to `devin-cobol-modernize`. |

### Error Responses

| Status | Detail |
|---|---|
| 400 | cobol_path must point to a .cbl file |
| 404 | Contract not found |
| 404 | Vendor not found for contract |
| 422 | Validation error |
| 500 | GITHUB_TOKEN is not configured |
| 500 | GITHUB_REPOSITORY is not configured |
| 502 | GitHub dispatch error |

### Example curl

```bash
curl -s -X POST http://localhost:8000/v1/modernization/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "DOT-2026-00041",
    "target_stack": "python-fastapi"
  }'
```

### Example JSON response

```json
{
  "status": "queued",
  "message": "Devin COBOL modernization workflow dispatch requested.",
  "event_type": "devin-cobol-modernize",
  "contract_id": "DOT-2026-00041",
  "vendor_id": "V003",
  "cobol_path": "backend/legacy_cobol/CONTRACT_AWARD_ADJUDICATION.cbl",
  "target_stack": "python-fastapi",
  "base_branch": "main",
  "decision_preview": "APPROVE",
  "repository": "your-org/your-repo"
}
```

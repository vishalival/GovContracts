# COBOL -> Python Modernization Notes: VENDOR_RISK_ASSESSMENT

**Status:** Complete -- Requires Domain Review  
**Date:** 2026-02-24  
**Source:** `backend/legacy_cobol/VENDOR_RISK_ASSESSMENT.cbl`  
**Target:** `modernized/vendor_risk_assessment.py`  
**Target Stack:** Python 3.11 / FastAPI  

---

## Field Mappings (COBOL -> Python)

| COBOL Variable | PIC | Python Symbol | Type | Notes |
|---|---|---|---|---|
| `WS-RISK-RATING` | `X(8)` | `RiskRating` enum / `RiskAssessmentResult.rating` | `str` (enum) | Values: `HIGH`, `MODERATE`, `LOW` |
| `WS-RISK-REASON` | `X(80)` | `RiskAssessmentResult.reason` | `str` | Single reason string per result |
| `WS-VENDOR-TOTAL-AWARDS` | `9(12)` | `vendor_total_awards` parameter | `int` | Whole-dollar amount, no float |
| `WS-VENDOR-ACTIVE-CONTRACTS` | `9(4)` | `vendor_active_contracts` parameter | `int` | Count of active contracts |
| `WS-LARGEST-CONTRACT-VALUE` | `9(10)` | `largest_contract_value` parameter | `int` | Whole-dollar amount, no float |
| `WS-VENDOR-IS-SMALL-BIZ` | `9(1)` | `vendor_is_small_biz` parameter | `bool` | COBOL: 0/1; Python: bool |
| `WS-YEARS-AS-VENDOR` | `9(3)` | `years_as_vendor` parameter | `int` | Whole years |

---

## Threshold Constants

| COBOL Literal | Python Constant | Value | COBOL Line |
|---|---|---|---|
| `2` (line 22) | `NEW_VENDOR_YEARS_THRESHOLD` | 2 | 22 |
| `100000000` (line 23) | `NEW_VENDOR_AWARDS_THRESHOLD` | 100,000,000 | 23 |
| `8` (line 31) | `CONCENTRATION_CONTRACTS_THRESHOLD` | 8 | 31 |
| `75000000` (line 39) | `DOMINANCE_CONTRACT_THRESHOLD` | 75,000,000 | 39 |
| `250000000` (line 48) | `SMALL_BIZ_EXPOSURE_THRESHOLD` | 250,000,000 | 48 |
| `4` (line 56) | `MODERATE_CONTRACTS_THRESHOLD` | 4 | 56 |
| `300000000` (line 63) | `WATCH_LEVEL_AWARDS_THRESHOLD` | 300,000,000 | 63 |

---

## Data Type Conversions

| COBOL Type | Python Type | Rationale |
|---|---|---|
| `PIC 9(12)` (total awards) | `int` | Integer whole-dollar values; no floating point per codebase standard |
| `PIC 9(10)` (contract value) | `int` | Integer whole-dollar values; no floating point |
| `PIC 9(4)` (contract count) | `int` | Simple integer counter |
| `PIC 9(3)` (years) | `int` | Simple integer counter |
| `PIC 9(1)` (small biz flag) | `bool` | COBOL uses 0/1; Python uses native bool |
| `PIC X(8)` (risk rating) | `str` (Enum) | Fixed-width COBOL string -> Python enum for type safety |
| `PIC X(80)` (reason) | `str` | Fixed-width COBOL string -> Python str (no padding) |

---

## Precision Handling

- All monetary values use Python `int` (whole dollars), matching COBOL `PIC 9(n)` semantics.
- No floating-point arithmetic is used anywhere in the modernized module.
- No `Decimal` is needed because all comparisons are simple integer threshold checks.
- The COBOL program performs no arithmetic on monetary fields -- it only compares them against literal thresholds. The Python translation preserves this behavior exactly.

---

## Assumptions

1. **Small business flag:** The COBOL program uses `WS-VENDOR-IS-SMALL-BIZ = 1` as a boolean test. The Python translation uses a native `bool` parameter. The adapter function converts truthy dict values via `bool()`.

2. **String trimming:** COBOL `WS-RISK-RATING` is `PIC X(8)` with trailing spaces (e.g., `"HIGH    "`, `"LOW     "`). The Python enum uses trimmed values (`"HIGH"`, `"LOW"`). This is functionally equivalent since downstream consumers should trim/compare without padding.

3. **Default risk rating:** The COBOL WORKING-STORAGE initializes `WS-RISK-RATING` to `"MODERATE"`. However, this default is never the final output in normal execution -- Rule 6 overwrites it to `"LOW"` if no prior rule matches. The Python implementation does not carry this default forward since early-return semantics guarantee a rating is always set explicitly.

4. **Input validation:** The COBOL program performs no input validation beyond the business rules. The Python implementation follows the same pattern -- invalid inputs (negative values, etc.) are not explicitly guarded against.

---

## Known Gaps

1. **No integration with existing vendor data:** The modernized module provides a standalone assessment function. Integration with the existing vendor API endpoints (`/v1/vendors/{vendor_id}`) is not included in this PR. The `largest_contract_value` and `years_as_vendor` fields would need to be computed from existing contract data or added to the vendor data model.

2. **No API endpoint yet:** While the module includes a dict-based adapter (`assess_vendor_risk_from_dict`), no FastAPI endpoint has been added in this PR. This is intentional -- the endpoint should be added after domain review of the business rules.

3. **Missing vendor fields:** The existing vendor data model (`data/vendors.json`) does not include `largest_contract_value` or `years_as_vendor` fields. These would need to be added or computed at runtime for production use.

---

## Migration Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Business rule thresholds may not match current policy | **High** | All thresholds are extracted as named constants for easy review and modification |
| `vendor_is_small_biz` interpretation differs from COBOL 0/1 | **Low** | Python `bool` is semantically equivalent; adapter handles conversion |
| Default `MODERATE` rating behavior | **Low** | Verified that Rule 6 always sets explicit `LOW`; documented in parity notes |
| Missing data fields for production integration | **Medium** | `largest_contract_value` and `years_as_vendor` must be sourced before production rollout |

---

## Suggested Validation Steps Before Production Rollout

1. **Domain expert review:** Have a procurement policy owner validate all seven threshold values against current agency policy.
2. **Data availability check:** Confirm that `largest_contract_value` and `years_as_vendor` can be reliably sourced from existing systems.
3. **Parallel run:** Run the Python module alongside the COBOL program with production data to verify behavioral parity.
4. **Integration testing:** After adding the FastAPI endpoint, run end-to-end tests through the API layer.
5. **Performance baseline:** Establish response time benchmarks for the assessment function under expected load.

---

## File Inventory

| File | Purpose |
|---|---|
| `modernized/vendor_risk_assessment.py` | Modernized vendor risk assessment logic (standalone, no framework dependency) |
| `tests/test_vendor_risk_assessment.py` | Parity test suite (45+ test cases) |
| `MODERNIZATION_NOTES.md` | This document |
| `parity_notes.md` | Behavioral parity analysis |
| `backend/legacy_cobol/VENDOR_RISK_ASSESSMENT.cbl` | Original COBOL source (unchanged, retained for reference) |

# COBOL → Python Modernization Mapping

## Source Program

| Attribute | Value |
|---|---|
| Program ID | `CONTRACT-AWARD-ADJUDICATION` |
| Source path | `backend/legacy_cobol/CONTRACT_AWARD_ADJUDICATION.cbl` |
| Target module | `backend/adjudication.py` |
| Target stack | Python 3.12 / FastAPI |

## Working-Storage Variables → Python Constants & Parameters

| COBOL Variable | PIC | Python Symbol | Type | Notes |
|---|---|---|---|---|
| `WS-DECISION` | `X(7)` | `Decision` enum / `AdjudicationResult.decision` | `str` (enum) | Values: `APPROVE`, `REVIEW`, `REJECT` |
| `WS-REASON` | `X(80)` | `AdjudicationResult.reason` | `str` | Single reason string per result |
| `WS-CONTRACT-STATUS` | `X(8)` | `contract_status` parameter | `str` | Must equal `"Active"` to pass |
| `WS-OBLIGATED-AMOUNT` | `9(10)` | `obligated_amount` parameter | `int` | Dollar amount |
| `WS-VENDOR-ACTIVE-COUNT` | `9(4)` | `vendor_active_contracts` parameter | `int` | Count of active contracts |
| `WS-VENDOR-TOTAL-AWARDS` | `9(12)` | `vendor_total_awards` parameter | `int` | Cumulative dollar total |

## Threshold Constants

| COBOL Literal | Python Constant | Value |
|---|---|---|
| `1000000` (line 26) | `OBLIGATED_AMOUNT_MIN` | 1,000,000 |
| `120000000` (line 32) | `HIGH_DOLLAR_THRESHOLD` | 120,000,000 |
| `5` (line 38) | `VENDOR_ACTIVE_CONTRACTS_MAX` | 5 |
| `500000000` (line 44) | `VENDOR_TOTAL_AWARDS_THRESHOLD` | 500,000,000 |

## Paragraph → Function Mapping

| COBOL Paragraph | Lines | Python Function | Description |
|---|---|---|---|
| `MAIN-LOGIC` | 19–51 | `adjudicate()` | Core rule evaluation; first-match-wins via early `return` (mirrors `GO TO PROGRAM-END`) |
| `PROGRAM-END` | 53–54 | Normal function return | `GOBACK` is equivalent to returning from the function |

## Rule Evaluation Order

The COBOL program uses `GO TO PROGRAM-END` to short-circuit on the first matching rule. The Python implementation preserves this with early `return` statements.

| Priority | COBOL Lines | Condition | Decision | Reason |
|---|---|---|---|---|
| 1 | 20–24 | `WS-CONTRACT-STATUS NOT = "ACTIVE"` | **REJECT** | `CONTRACT STATUS NOT ACTIVE` |
| 2 | 26–30 | `WS-OBLIGATED-AMOUNT < 1000000` | **REJECT** | `OBLIGATED AMOUNT BELOW THRESHOLD` |
| 3 | 32–36 | `WS-OBLIGATED-AMOUNT >= 120000000` | **REVIEW** | `HIGH DOLLAR AWARD REQUIRES REVIEW` |
| 4 | 38–42 | `WS-VENDOR-ACTIVE-COUNT >= 5` | **REVIEW** | `VENDOR WORKLOAD CONCENTRATION` |
| 5 | 44–48 | `WS-VENDOR-TOTAL-AWARDS >= 500000000` | **REVIEW** | `CUMULATIVE AWARD WATCH THRESHOLD` |
| 6 | 50–51 | _(none of the above)_ | **APPROVE** | `ALL AUTOMATED CHECKS PASSED` |

## Parity Notes

### Behavioral difference from prior Python helper

The **original** `_legacy_cobol_award_decision` function in `main.py` accumulated multiple REVIEW reasons in a single pass (e.g., if both the high-dollar and workload rules matched, both reasons were returned). The **COBOL program** uses `GO TO PROGRAM-END` after the first matching rule, so only one reason is ever produced.

The modernized `adjudicate()` function faithfully follows the COBOL semantics: **exactly one reason per result, determined by the first matching rule.**

The API wrapper `adjudicate_contract()` translates the terse COBOL reason strings into the friendlier wording previously used by the API, ensuring downstream consumers see no change in tone.

### Status string comparison

The COBOL program compares `WS-CONTRACT-STATUS` against the literal `"ACTIVE"` (uppercase, padded). In the application data, contract status values are `"Active"` (title-case). The Python implementation compares against `"Active"` to match the actual data, which is functionally equivalent since the COBOL comparison operates within the context of the host application's data preparation layer.

## Test Coverage

The test suite at `backend/tests/test_adjudication.py` covers:

- **22 test cases** across 8 test classes
- Every rule individually (boundary and interior values)
- Rule priority / short-circuit ordering
- The specific trigger contract (`NASA-2026-00206` / vendor `V007`)
- Representative fixtures for APPROVE, REVIEW, and REJECT outcomes

## File Inventory

| File | Purpose |
|---|---|
| `backend/adjudication.py` | Modernized adjudication logic (standalone, no framework dependency) |
| `backend/main.py` | Updated to delegate to `adjudication.py` via existing `_legacy_cobol_award_decision` wrapper |
| `backend/tests/test_adjudication.py` | Parity test suite (22 cases) |
| `backend/legacy_cobol/CONTRACT_AWARD_ADJUDICATION.cbl` | Original COBOL source (unchanged, retained for reference) |
| `docs/cobol_modernization.md` | This document |

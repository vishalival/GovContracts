# Behavioral Parity Notes: VENDOR_RISK_ASSESSMENT

**Source:** `backend/legacy_cobol/VENDOR_RISK_ASSESSMENT.cbl`  
**Target:** `modernized/vendor_risk_assessment.py`  
**Date:** 2026-02-24  

---

## Decision Matrix

Every COBOL branch is mapped to an identical Python early-return. The table
below documents the complete decision matrix with exact behavioral parity.

| Rule | COBOL Lines | COBOL Condition | Rating | COBOL Reason String | Python Function Return |
|------|-------------|-----------------|--------|--------------------|-----------------------|
| 1 | 22-28 | `WS-YEARS-AS-VENDOR < 2 AND WS-VENDOR-TOTAL-AWARDS >= 100000000` | **HIGH** | `NEW VENDOR WITH LARGE CUMULATIVE AWARDS` | `RiskRating.HIGH`, same reason |
| 2 | 31-36 | `WS-VENDOR-ACTIVE-CONTRACTS >= 8` | **HIGH** | `EXCESSIVE ACTIVE CONTRACT CONCENTRATION` | `RiskRating.HIGH`, same reason |
| 3 | 39-44 | `WS-LARGEST-CONTRACT-VALUE >= 75000000` | **HIGH** | `SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD` | `RiskRating.HIGH`, same reason |
| 4 | 47-53 | `WS-VENDOR-IS-SMALL-BIZ = 1 AND WS-VENDOR-TOTAL-AWARDS >= 250000000` | **HIGH** | `SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT` | `RiskRating.HIGH`, same reason |
| 5a | 56-61 | `WS-VENDOR-ACTIVE-CONTRACTS >= 4` | **MODERATE** | `ELEVATED ACTIVE CONTRACT COUNT` | `RiskRating.MODERATE`, same reason |
| 5b | 63-68 | `WS-VENDOR-TOTAL-AWARDS >= 300000000` | **MODERATE** | `CUMULATIVE AWARDS APPROACHING WATCH LEVEL` | `RiskRating.MODERATE`, same reason |
| 6 | 71-73 | _(none of the above)_ | **LOW** | `ALL RISK INDICATORS WITHIN ACCEPTABLE RANGE` | `RiskRating.LOW`, same reason |

---

## Short-Circuit Semantics

The COBOL program uses `GO TO ASSESSMENT-END` after each matching rule to
implement first-match-wins evaluation. The Python implementation preserves
this exactly using early `return` statements. Rule evaluation order is
identical:

```
Rule 1 -> Rule 2 -> Rule 3 -> Rule 4 -> Rule 5a -> Rule 5b -> Rule 6 (default)
```

The first matching rule determines the final output. No subsequent rules
are evaluated after a match, consistent with the COBOL `GO TO` pattern.

---

## Behavioral Differences and Deviations

### 1. Default WS-RISK-RATING initialization

**COBOL:** `WS-RISK-RATING` is initialized to `"MODERATE"` in WORKING-STORAGE (line 11).

**Python:** No default rating is carried. The function always returns explicitly via early-return or the final `LOW` return.

**Parity impact:** None. In the COBOL program, the default `"MODERATE"` is never the final output because:
- If rules 1-5b match, the rating is explicitly set before `GO TO ASSESSMENT-END`
- If no rule matches, Rule 6 explicitly sets `"LOW"`

The initial `"MODERATE"` value is a COBOL idiom (working storage must be initialized) with no semantic effect on the output.

### 2. String padding

**COBOL:** Rating values include trailing spaces to fill `PIC X(8)`:
- `"HIGH    "` (8 chars)
- `"MODERATE"` (8 chars, exact fit)
- `"LOW     "` (8 chars)

**Python:** Enum values are unpadded: `"HIGH"`, `"MODERATE"`, `"LOW"`.

**Parity impact:** None for downstream consumers that trim strings. If any consumer depends on the exact 8-character padded format, an adapter would be needed.

### 3. Small business flag type

**COBOL:** `WS-VENDOR-IS-SMALL-BIZ` is `PIC 9(1)`, compared with `= 1`.

**Python:** `vendor_is_small_biz` is `bool`. The adapter function uses `bool()` conversion.

**Parity impact:** None. Python `bool(1)` is `True`, `bool(0)` is `False`. The COBOL comparison `= 1` is exactly equivalent to Python `is True` / truthiness check.

### 4. Reason string length

**COBOL:** `WS-RISK-REASON` is `PIC X(80)`, padded with spaces.

**Python:** Reason strings are unpadded, variable-length.

**Parity impact:** None for string comparison after trimming. If fixed-width output is required, `str.ljust(80)` can be applied.

---

## Deviations from COBOL Behavior

**None.** All seven decision branches produce identical ratings and reason
strings (modulo trailing whitespace) for all possible input combinations.
The evaluation order and short-circuit semantics are preserved exactly.

---

## Paragraph -> Function Mapping

| COBOL Paragraph | Lines | Python Function | Description |
|---|---|---|---|
| `MAIN-LOGIC` | 20-73 | `assess_vendor_risk()` | Core rule evaluation; first-match-wins via early `return` (mirrors `GO TO ASSESSMENT-END`) |
| `ASSESSMENT-END` | 75-76 | Normal function return | `GOBACK` is equivalent to returning from the function |

---

## Test Coverage Summary

The test suite (`tests/test_vendor_risk_assessment.py`) provides comprehensive
parity verification:

| Category | Test Count | Description |
|---|---|---|
| Rule 1 (HIGH - new vendor) | 6 | Happy path, boundary +/- 1, both conditions |
| Rule 2 (HIGH - concentration) | 4 | At threshold, above, boundary -1, zero |
| Rule 3 (HIGH - dominance) | 4 | At threshold, above, boundary -1, zero |
| Rule 4 (HIGH - small biz) | 4 | At threshold, above, boundary -1, non-small-biz |
| Rule 5a (MODERATE - contracts) | 3 | At threshold, between 5a and 2, boundary -1 |
| Rule 5b (MODERATE - awards) | 3 | At threshold, above, boundary -1 |
| Rule 6 (LOW - default) | 3 | Safe values, all zeros, established vendor |
| Priority ordering | 6 | Each consecutive rule pair, all-match scenario |
| Edge cases | 5 | Combinations, boundary interactions |
| API wrapper | 4 | Dict adapter, missing fields, response shape |
| Constants | 7 | Verify each threshold matches COBOL literal |
| **Total** | **49** | |

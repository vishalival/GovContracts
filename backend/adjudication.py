"""Modernized contract award adjudication logic.

This module is a faithful Python translation of the legacy COBOL program
``CONTRACT_AWARD_ADJUDICATION.cbl``.  Every rule preserves the original
evaluation order and short-circuit (``GO TO PROGRAM-END``) semantics so
that the three possible outcomes — **APPROVE**, **REVIEW**, **REJECT** —
are identical for any given set of inputs.

COBOL paragraph mapping
------------------------
- ``MAIN-LOGIC``            → :func:`adjudicate`
- ``WS-CONTRACT-STATUS``    → *contract_status* parameter
- ``WS-OBLIGATED-AMOUNT``   → *obligated_amount* parameter
- ``WS-VENDOR-ACTIVE-COUNT``→ *vendor_active_contracts* parameter
- ``WS-VENDOR-TOTAL-AWARDS``→ *vendor_total_awards* parameter
- ``WS-DECISION``           → :attr:`AdjudicationResult.decision`
- ``WS-REASON``             → :attr:`AdjudicationResult.reason`
- ``PROGRAM-END``           → normal function return
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import List


# ---------------------------------------------------------------------------
# Constants – mirror the COBOL WORKING-STORAGE thresholds
# ---------------------------------------------------------------------------

#: Minimum obligated amount for award consideration (COBOL line 26).
OBLIGATED_AMOUNT_MIN: int = 1_000_000

#: Upper bound that triggers mandatory review (COBOL line 32).
HIGH_DOLLAR_THRESHOLD: int = 120_000_000

#: Maximum active contracts before vendor workload review (COBOL line 38).
VENDOR_ACTIVE_CONTRACTS_MAX: int = 5

#: Cumulative award total that triggers a watch-list review (COBOL line 44).
VENDOR_TOTAL_AWARDS_THRESHOLD: int = 500_000_000


# ---------------------------------------------------------------------------
# Decision enum
# ---------------------------------------------------------------------------

class Decision(str, Enum):
    """Possible adjudication outcomes, matching COBOL ``WS-DECISION``."""

    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    REJECT = "REJECT"


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class AdjudicationResult:
    """Immutable result of a single adjudication run.

    Attributes:
        decision: One of APPROVE, REVIEW, or REJECT.
        reason:   Human-readable explanation (single string, mirrors
                  COBOL ``WS-REASON``).
    """

    decision: Decision
    reason: str


# ---------------------------------------------------------------------------
# Core adjudication function
# ---------------------------------------------------------------------------

def adjudicate(
    *,
    contract_status: str,
    obligated_amount: int,
    vendor_active_contracts: int,
    vendor_total_awards: int,
) -> AdjudicationResult:
    """Evaluate a contract/vendor pair using legacy adjudication rules.

    The rules are evaluated **in order**; the first matching rule
    determines the outcome (mirroring the COBOL ``GO TO PROGRAM-END``
    pattern).

    Parameters:
        contract_status:        Current contract status string.
        obligated_amount:       Dollar amount obligated on the contract.
        vendor_active_contracts: Number of currently active contracts for the vendor.
        vendor_total_awards:     Cumulative dollar amount of all awards to the vendor.

    Returns:
        An :class:`AdjudicationResult` with the decision and reason.

    Rule evaluation order (matches COBOL ``MAIN-LOGIC``):
        1. Status check   – status must be ``"Active"``
        2. Floor check    – obligated_amount >= 1 000 000
        3. Ceiling check  – obligated_amount < 120 000 000
        4. Workload check – vendor_active_contracts < 5
        5. Cumulative check – vendor_total_awards < 500 000 000
        6. Default         – APPROVE
    """

    # ── Rule 1 (COBOL lines 20-24): status gate ──────────────────────
    if contract_status != "Active":
        return AdjudicationResult(
            decision=Decision.REJECT,
            reason="CONTRACT STATUS NOT ACTIVE",
        )

    # ── Rule 2 (COBOL lines 26-30): obligated-amount floor ───────────
    if obligated_amount < OBLIGATED_AMOUNT_MIN:
        return AdjudicationResult(
            decision=Decision.REJECT,
            reason="OBLIGATED AMOUNT BELOW THRESHOLD",
        )

    # ── Rule 3 (COBOL lines 32-36): high-dollar ceiling ──────────────
    if obligated_amount >= HIGH_DOLLAR_THRESHOLD:
        return AdjudicationResult(
            decision=Decision.REVIEW,
            reason="HIGH DOLLAR AWARD REQUIRES REVIEW",
        )

    # ── Rule 4 (COBOL lines 38-42): vendor workload ─────────────────
    if vendor_active_contracts >= VENDOR_ACTIVE_CONTRACTS_MAX:
        return AdjudicationResult(
            decision=Decision.REVIEW,
            reason="VENDOR WORKLOAD CONCENTRATION",
        )

    # ── Rule 5 (COBOL lines 44-48): cumulative award watch ──────────
    if vendor_total_awards >= VENDOR_TOTAL_AWARDS_THRESHOLD:
        return AdjudicationResult(
            decision=Decision.REVIEW,
            reason="CUMULATIVE AWARD WATCH THRESHOLD",
        )

    # ── Rule 6 (COBOL lines 50-51): all checks passed ───────────────
    return AdjudicationResult(
        decision=Decision.APPROVE,
        reason="ALL AUTOMATED CHECKS PASSED",
    )


# ---------------------------------------------------------------------------
# Convenience wrapper used by the API layer
# ---------------------------------------------------------------------------

def adjudicate_contract(
    contract: dict,
    vendor: dict,
) -> dict:
    """Thin adapter that accepts raw contract/vendor dicts and returns
    a dict matching the existing API response shape.

    This keeps the :func:`adjudicate` function pure (no dict coupling)
    while providing a drop-in replacement for the legacy helper in
    ``main.py``.
    """
    result = adjudicate(
        contract_status=contract["status"],
        obligated_amount=int(contract["obligated_amount"]),
        vendor_active_contracts=int(vendor.get("active_contracts", 0)),
        vendor_total_awards=int(vendor.get("total_awards", 0)),
    )

    # Build a reasons list that mirrors the existing API response format.
    # The legacy helper collected multiple REVIEW reasons in a single call;
    # the COBOL program itself only returns one reason (first match wins).
    # We preserve COBOL semantics: exactly one reason per result.
    reasons: List[str] = [_api_reason(result)]

    return {"decision": result.decision.value, "reasons": reasons}


def _api_reason(result: AdjudicationResult) -> str:
    """Map the terse COBOL-style reason to the friendlier API wording
    used by the existing ``_legacy_cobol_award_decision`` helper."""
    _mapping = {
        "CONTRACT STATUS NOT ACTIVE": (
            "Contract is not active and requires no further award action."
        ),
        "OBLIGATED AMOUNT BELOW THRESHOLD": (
            "Obligated amount is below the modernization threshold."
        ),
        "HIGH DOLLAR AWARD REQUIRES REVIEW": (
            "High dollar amount requires additional federal review controls."
        ),
        "VENDOR WORKLOAD CONCENTRATION": (
            "Vendor has high active workload concentration."
        ),
        "CUMULATIVE AWARD WATCH THRESHOLD": (
            "Vendor cumulative awards exceed policy watch threshold."
        ),
        "ALL AUTOMATED CHECKS PASSED": (
            "Contract and vendor profile satisfy automated legacy award checks."
        ),
    }
    return _mapping.get(result.reason, result.reason)

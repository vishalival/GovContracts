"""Modernized vendor risk assessment logic.

This module is a faithful Python translation of the legacy COBOL program
``VENDOR_RISK_ASSESSMENT.cbl``.  Every rule preserves the original
evaluation order and short-circuit (``GO TO ASSESSMENT-END``) semantics so
that the three possible risk ratings -- **HIGH**, **MODERATE**, **LOW** --
are identical for any given set of inputs.

COBOL paragraph mapping
------------------------
- ``MAIN-LOGIC``                  -> :func:`assess_vendor_risk`
- ``WS-VENDOR-TOTAL-AWARDS``      -> *vendor_total_awards* parameter
- ``WS-VENDOR-ACTIVE-CONTRACTS``  -> *vendor_active_contracts* parameter
- ``WS-LARGEST-CONTRACT-VALUE``   -> *largest_contract_value* parameter
- ``WS-VENDOR-IS-SMALL-BIZ``     -> *vendor_is_small_biz* parameter
- ``WS-YEARS-AS-VENDOR``         -> *years_as_vendor* parameter
- ``WS-RISK-RATING``             -> :attr:`RiskAssessmentResult.rating`
- ``WS-RISK-REASON``             -> :attr:`RiskAssessmentResult.reason`
- ``ASSESSMENT-END``              -> normal function return
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import List


# ---------------------------------------------------------------------------
# Constants -- mirror the COBOL WORKING-STORAGE thresholds
# ---------------------------------------------------------------------------

#: Years-as-vendor threshold for "new vendor" classification (COBOL line 22).
NEW_VENDOR_YEARS_THRESHOLD: int = 2

#: Cumulative awards threshold for new-vendor high risk (COBOL line 23).
NEW_VENDOR_AWARDS_THRESHOLD: int = 100_000_000

#: Active contract count threshold for concentration risk (COBOL line 31).
CONCENTRATION_CONTRACTS_THRESHOLD: int = 8

#: Single contract value threshold for dominance risk (COBOL line 39).
DOMINANCE_CONTRACT_THRESHOLD: int = 75_000_000

#: Cumulative awards threshold for small-biz exposure (COBOL line 48).
SMALL_BIZ_EXPOSURE_THRESHOLD: int = 250_000_000

#: Active contract count threshold for moderate risk (COBOL line 56).
MODERATE_CONTRACTS_THRESHOLD: int = 4

#: Cumulative awards threshold for approaching watch level (COBOL line 63).
WATCH_LEVEL_AWARDS_THRESHOLD: int = 300_000_000


# ---------------------------------------------------------------------------
# Risk rating enum
# ---------------------------------------------------------------------------

class RiskRating(str, Enum):
    """Possible risk ratings, matching COBOL ``WS-RISK-RATING``."""

    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RiskAssessmentResult:
    """Immutable result of a single vendor risk assessment.

    Attributes:
        rating: One of HIGH, MODERATE, or LOW.
        reason: Human-readable explanation (single string, mirrors
                COBOL ``WS-RISK-REASON``).
    """

    rating: RiskRating
    reason: str


# ---------------------------------------------------------------------------
# Core assessment function
# ---------------------------------------------------------------------------

def assess_vendor_risk(
    *,
    vendor_total_awards: int,
    vendor_active_contracts: int,
    largest_contract_value: int,
    vendor_is_small_biz: bool,
    years_as_vendor: int,
) -> RiskAssessmentResult:
    """Evaluate a vendor's risk profile using legacy assessment rules.

    The rules are evaluated **in order**; the first matching rule
    determines the outcome (mirroring the COBOL ``GO TO ASSESSMENT-END``
    pattern).

    Parameters:
        vendor_total_awards:      Cumulative dollar amount of all awards
                                  to the vendor (integer, whole dollars).
        vendor_active_contracts:  Number of currently active contracts
                                  for the vendor.
        largest_contract_value:   Dollar value of the vendor's largest
                                  single contract (integer, whole dollars).
        vendor_is_small_biz:      Whether the vendor is classified as a
                                  small business.
        years_as_vendor:          Number of years the vendor has been
                                  registered/active.

    Returns:
        A :class:`RiskAssessmentResult` with the rating and reason.

    Rule evaluation order (matches COBOL ``MAIN-LOGIC``):
        1. New vendor + large portfolio    -> HIGH
        2. Concentration risk (>= 8)       -> HIGH
        3. Single contract dominance       -> HIGH
        4. Small biz + high exposure       -> HIGH
        5a. Elevated active contracts (>= 4) -> MODERATE
        5b. Awards approaching watch level   -> MODERATE
        6. Default                           -> LOW
    """

    # -- Rule 1 (COBOL lines 22-28): new vendor with large portfolio ----
    if (years_as_vendor < NEW_VENDOR_YEARS_THRESHOLD
            and vendor_total_awards >= NEW_VENDOR_AWARDS_THRESHOLD):
        return RiskAssessmentResult(
            rating=RiskRating.HIGH,
            reason="NEW VENDOR WITH LARGE CUMULATIVE AWARDS",
        )

    # -- Rule 2 (COBOL lines 31-36): concentration risk ----------------
    if vendor_active_contracts >= CONCENTRATION_CONTRACTS_THRESHOLD:
        return RiskAssessmentResult(
            rating=RiskRating.HIGH,
            reason="EXCESSIVE ACTIVE CONTRACT CONCENTRATION",
        )

    # -- Rule 3 (COBOL lines 39-44): single contract dominance ---------
    if largest_contract_value >= DOMINANCE_CONTRACT_THRESHOLD:
        return RiskAssessmentResult(
            rating=RiskRating.HIGH,
            reason="SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD",
        )

    # -- Rule 4 (COBOL lines 47-53): small biz with high exposure ------
    if vendor_is_small_biz and vendor_total_awards >= SMALL_BIZ_EXPOSURE_THRESHOLD:
        return RiskAssessmentResult(
            rating=RiskRating.HIGH,
            reason="SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT",
        )

    # -- Rule 5a (COBOL lines 56-61): elevated active contracts ---------
    if vendor_active_contracts >= MODERATE_CONTRACTS_THRESHOLD:
        return RiskAssessmentResult(
            rating=RiskRating.MODERATE,
            reason="ELEVATED ACTIVE CONTRACT COUNT",
        )

    # -- Rule 5b (COBOL lines 63-68): awards approaching watch level ----
    if vendor_total_awards >= WATCH_LEVEL_AWARDS_THRESHOLD:
        return RiskAssessmentResult(
            rating=RiskRating.MODERATE,
            reason="CUMULATIVE AWARDS APPROACHING WATCH LEVEL",
        )

    # -- Rule 6 (COBOL lines 71-73): all checks passed -----------------
    return RiskAssessmentResult(
        rating=RiskRating.LOW,
        reason="ALL RISK INDICATORS WITHIN ACCEPTABLE RANGE",
    )


# ---------------------------------------------------------------------------
# Convenience wrapper for API layer
# ---------------------------------------------------------------------------

def assess_vendor_risk_from_dict(vendor: dict) -> dict:
    """Thin adapter that accepts a raw vendor dict and returns a dict
    matching a standard API response shape.

    This keeps the :func:`assess_vendor_risk` function pure (no dict
    coupling) while providing a drop-in integration point for the
    FastAPI layer.
    """
    result = assess_vendor_risk(
        vendor_total_awards=int(vendor.get("total_awards", 0)),
        vendor_active_contracts=int(vendor.get("active_contracts", 0)),
        largest_contract_value=int(vendor.get("largest_contract_value", 0)),
        vendor_is_small_biz=bool(vendor.get("small_business", False)),
        years_as_vendor=int(vendor.get("years_as_vendor", 0)),
    )

    reasons: List[str] = [_api_reason(result)]

    return {
        "risk_rating": result.rating.value,
        "risk_reason": reasons[0],
        "reasons": reasons,
    }


def _api_reason(result: RiskAssessmentResult) -> str:
    """Map the terse COBOL-style reason to friendlier API wording."""
    _mapping = {
        "NEW VENDOR WITH LARGE CUMULATIVE AWARDS": (
            "New vendor (< 2 years) with large cumulative award portfolio "
            "exceeding $100M threshold."
        ),
        "EXCESSIVE ACTIVE CONTRACT CONCENTRATION": (
            "Vendor has excessive active contract concentration "
            "(8 or more active contracts)."
        ),
        "SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD": (
            "Vendor has a single contract exceeding the $75M dominance threshold."
        ),
        "SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT": (
            "Small business vendor exceeds cumulative exposure limit of $250M."
        ),
        "ELEVATED ACTIVE CONTRACT COUNT": (
            "Vendor has an elevated active contract count (4 or more active contracts)."
        ),
        "CUMULATIVE AWARDS APPROACHING WATCH LEVEL": (
            "Vendor cumulative awards approaching watch level ($300M threshold)."
        ),
        "ALL RISK INDICATORS WITHIN ACCEPTABLE RANGE": (
            "All vendor risk indicators are within acceptable range."
        ),
    }
    return _mapping.get(result.reason, result.reason)

"""Parity tests for the modernized adjudication module.

Each test case encodes a specific COBOL rule from
``CONTRACT_AWARD_ADJUDICATION.cbl`` and verifies that the Python
implementation in ``adjudication.py`` produces the identical decision
and reason.

The test fixtures include the specific contract referenced in the
modernization trigger (NASA-2026-00206 / V007) as well as synthetic
edge-case inputs that exercise every branch.
"""

import sys
from pathlib import Path

# Ensure the backend package is importable when running from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from adjudication import (
    OBLIGATED_AMOUNT_MIN,
    HIGH_DOLLAR_THRESHOLD,
    VENDOR_ACTIVE_CONTRACTS_MAX,
    VENDOR_TOTAL_AWARDS_THRESHOLD,
    AdjudicationResult,
    Decision,
    adjudicate,
    adjudicate_contract,
)


# ======================================================================
# Pure-function tests (adjudicate)
# ======================================================================


class TestRule1StatusNotActive:
    """COBOL lines 20-24: status gate → REJECT."""

    def test_closed_status_rejects(self) -> None:
        result = adjudicate(
            contract_status="Closed",
            obligated_amount=50_000_000,
            vendor_active_contracts=2,
            vendor_total_awards=100_000_000,
        )
        assert result.decision == Decision.REJECT
        assert result.reason == "CONTRACT STATUS NOT ACTIVE"

    def test_empty_status_rejects(self) -> None:
        result = adjudicate(
            contract_status="",
            obligated_amount=50_000_000,
            vendor_active_contracts=0,
            vendor_total_awards=0,
        )
        assert result.decision == Decision.REJECT

    def test_status_check_fires_before_amount_check(self) -> None:
        """Even if amount is below threshold, status fires first."""
        result = adjudicate(
            contract_status="Closed",
            obligated_amount=500,
            vendor_active_contracts=10,
            vendor_total_awards=999_999_999,
        )
        assert result.decision == Decision.REJECT
        assert result.reason == "CONTRACT STATUS NOT ACTIVE"


class TestRule2ObligatedAmountFloor:
    """COBOL lines 26-30: amount < 1 000 000 → REJECT."""

    def test_below_threshold_rejects(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=999_999,
            vendor_active_contracts=1,
            vendor_total_awards=50_000_000,
        )
        assert result.decision == Decision.REJECT
        assert result.reason == "OBLIGATED AMOUNT BELOW THRESHOLD"

    def test_exactly_at_threshold_does_not_reject(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=OBLIGATED_AMOUNT_MIN,  # 1_000_000
            vendor_active_contracts=0,
            vendor_total_awards=0,
        )
        assert result.decision != Decision.REJECT

    def test_zero_amount_rejects(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=0,
            vendor_active_contracts=0,
            vendor_total_awards=0,
        )
        assert result.decision == Decision.REJECT
        assert result.reason == "OBLIGATED AMOUNT BELOW THRESHOLD"


class TestRule3HighDollar:
    """COBOL lines 32-36: amount >= 120 000 000 → REVIEW."""

    def test_high_dollar_triggers_review(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=120_000_000,
            vendor_active_contracts=1,
            vendor_total_awards=100_000_000,
        )
        assert result.decision == Decision.REVIEW
        assert result.reason == "HIGH DOLLAR AWARD REQUIRES REVIEW"

    def test_just_below_high_dollar_does_not_trigger(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=119_999_999,
            vendor_active_contracts=0,
            vendor_total_awards=0,
        )
        assert result.decision == Decision.APPROVE


class TestRule4VendorWorkload:
    """COBOL lines 38-42: active contracts >= 5 → REVIEW."""

    def test_high_workload_triggers_review(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=50_000_000,
            vendor_active_contracts=5,
            vendor_total_awards=100_000_000,
        )
        assert result.decision == Decision.REVIEW
        assert result.reason == "VENDOR WORKLOAD CONCENTRATION"

    def test_exactly_below_workload_threshold(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=50_000_000,
            vendor_active_contracts=4,
            vendor_total_awards=0,
        )
        assert result.decision == Decision.APPROVE


class TestRule5CumulativeAwards:
    """COBOL lines 44-48: total awards >= 500 000 000 → REVIEW."""

    def test_cumulative_watch_triggers_review(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=50_000_000,
            vendor_active_contracts=2,
            vendor_total_awards=500_000_000,
        )
        assert result.decision == Decision.REVIEW
        assert result.reason == "CUMULATIVE AWARD WATCH THRESHOLD"

    def test_just_below_cumulative_threshold(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=50_000_000,
            vendor_active_contracts=2,
            vendor_total_awards=499_999_999,
        )
        assert result.decision == Decision.APPROVE


class TestRule6Approve:
    """COBOL lines 50-51: all checks passed → APPROVE."""

    def test_all_checks_pass(self) -> None:
        result = adjudicate(
            contract_status="Active",
            obligated_amount=50_000_000,
            vendor_active_contracts=2,
            vendor_total_awards=100_000_000,
        )
        assert result.decision == Decision.APPROVE
        assert result.reason == "ALL AUTOMATED CHECKS PASSED"


# ======================================================================
# Rule priority / short-circuit tests
# ======================================================================


class TestRulePriority:
    """Verify that COBOL GO TO semantics (first-match-wins) are preserved."""

    def test_high_dollar_fires_before_workload(self) -> None:
        """Rule 3 should fire even if rule 4 also matches."""
        result = adjudicate(
            contract_status="Active",
            obligated_amount=200_000_000,
            vendor_active_contracts=10,
            vendor_total_awards=999_000_000,
        )
        assert result.decision == Decision.REVIEW
        assert result.reason == "HIGH DOLLAR AWARD REQUIRES REVIEW"

    def test_workload_fires_before_cumulative(self) -> None:
        """Rule 4 should fire even if rule 5 also matches."""
        result = adjudicate(
            contract_status="Active",
            obligated_amount=50_000_000,
            vendor_active_contracts=6,
            vendor_total_awards=600_000_000,
        )
        assert result.decision == Decision.REVIEW
        assert result.reason == "VENDOR WORKLOAD CONCENTRATION"


# ======================================================================
# Real contract fixture: NASA-2026-00206 / V007
# ======================================================================


class TestNASA202600206:
    """Regression test using the specific contract that triggered this
    modernization run.

    Contract NASA-2026-00206:
        - agency: NASA
        - status: Closed
        - obligated_amount: 920 000
        - vendor_id: V007 (Harborview Operations LLC)

    Expected legacy decision: REJECT (status is Closed, rule 1 fires).
    """

    CONTRACT = {
        "contract_id": "NASA-2026-00206",
        "agency": "NASA",
        "fiscal_year": 2026,
        "vendor_id": "V007",
        "vendor_name": "Harborview Operations LLC",
        "vendor_uei": "UEI6F0D9P2L67",
        "obligated_amount": 920000,
        "total_value": 3600000,
        "award_date": "2026-07-11",
        "period_end": "2027-07-10",
        "psc": "S216",
        "naics": "561210",
        "description": "Ground support hangar janitorial and safety services.",
        "status": "Closed",
        "category": "Operations",
        "program_office": "Center Operations Support",
        "place_of_performance": "Hampton,VA",
    }

    VENDOR = {
        "vendor_id": "V007",
        "name": "Harborview Operations LLC",
        "uei": "UEI6F0D9P2L67",
        "duns": "530471992",
        "total_awards": 1170000,
        "active_contracts": 0,
        "small_business": True,
    }

    def test_pure_function_rejects(self) -> None:
        result = adjudicate(
            contract_status=self.CONTRACT["status"],
            obligated_amount=int(self.CONTRACT["obligated_amount"]),
            vendor_active_contracts=int(self.VENDOR["active_contracts"]),
            vendor_total_awards=int(self.VENDOR["total_awards"]),
        )
        assert result.decision == Decision.REJECT
        assert result.reason == "CONTRACT STATUS NOT ACTIVE"

    def test_api_wrapper_rejects(self) -> None:
        result = adjudicate_contract(self.CONTRACT, self.VENDOR)
        assert result["decision"] == "REJECT"
        assert len(result["reasons"]) == 1
        assert "not active" in result["reasons"][0].lower()


# ======================================================================
# Additional representative contract fixtures
# ======================================================================


class TestRepresentativeFixtures:
    """Cover a spread of real-world-like scenarios beyond the trigger
    contract to prove broad parity."""

    def test_active_large_contract_approves(self) -> None:
        """Active contract, mid-range amount, low vendor load → APPROVE."""
        result = adjudicate_contract(
            {
                "status": "Active",
                "obligated_amount": 42_000_000,
            },
            {
                "active_contracts": 3,
                "total_awards": 199_000_000,
            },
        )
        assert result["decision"] == "APPROVE"

    def test_active_high_dollar_contract_reviews(self) -> None:
        """Active contract at $128M → REVIEW (high dollar)."""
        result = adjudicate_contract(
            {
                "status": "Active",
                "obligated_amount": 128_000_000,
            },
            {
                "active_contracts": 2,
                "total_awards": 340_000_000,
            },
        )
        assert result["decision"] == "REVIEW"
        assert "federal review" in result["reasons"][0].lower()

    def test_active_small_contract_rejects(self) -> None:
        """Active contract with $250K obligated → REJECT (below floor)."""
        result = adjudicate_contract(
            {
                "status": "Active",
                "obligated_amount": 250_000,
            },
            {
                "active_contracts": 0,
                "total_awards": 0,
            },
        )
        assert result["decision"] == "REJECT"
        assert "below" in result["reasons"][0].lower()

    def test_closed_contract_rejects_regardless_of_amount(self) -> None:
        """Closed status always rejects, even with high amounts."""
        result = adjudicate_contract(
            {
                "status": "Closed",
                "obligated_amount": 200_000_000,
            },
            {
                "active_contracts": 0,
                "total_awards": 0,
            },
        )
        assert result["decision"] == "REJECT"

    def test_vendor_at_cumulative_threshold(self) -> None:
        """Vendor total awards exactly at $500M → REVIEW."""
        result = adjudicate_contract(
            {
                "status": "Active",
                "obligated_amount": 50_000_000,
            },
            {
                "active_contracts": 2,
                "total_awards": 500_000_000,
            },
        )
        assert result["decision"] == "REVIEW"
        assert "cumulative" in result["reasons"][0].lower()

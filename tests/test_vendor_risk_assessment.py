"""Parity tests for the modernized vendor risk assessment module.

Each test case encodes a specific COBOL rule from
``VENDOR_RISK_ASSESSMENT.cbl`` and verifies that the Python
implementation in ``modernized/vendor_risk_assessment.py`` produces
the identical risk rating and reason.

Test coverage:
- Every HIGH rule (Rules 1-4) with happy path + boundary values
- Every MODERATE rule (Rules 5a-5b) with happy path + boundary values
- LOW default path (Rule 6)
- Rule priority / first-match-wins ordering
- Edge cases and combination tests
"""

import sys
from pathlib import Path

# Ensure the modernized package is importable when running from repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modernized.vendor_risk_assessment import (
    NEW_VENDOR_YEARS_THRESHOLD,
    NEW_VENDOR_AWARDS_THRESHOLD,
    CONCENTRATION_CONTRACTS_THRESHOLD,
    DOMINANCE_CONTRACT_THRESHOLD,
    SMALL_BIZ_EXPOSURE_THRESHOLD,
    MODERATE_CONTRACTS_THRESHOLD,
    WATCH_LEVEL_AWARDS_THRESHOLD,
    RiskAssessmentResult,
    RiskRating,
    assess_vendor_risk,
    assess_vendor_risk_from_dict,
)


# ======================================================================
# Defaults used by tests (safe baseline that triggers no rules)
# ======================================================================

_SAFE_DEFAULTS = dict(
    vendor_total_awards=50_000_000,
    vendor_active_contracts=2,
    largest_contract_value=10_000_000,
    vendor_is_small_biz=False,
    years_as_vendor=10,
)


def _assess(**overrides: object) -> RiskAssessmentResult:
    """Helper: assess with safe defaults, overriding specific fields."""
    kwargs = {**_SAFE_DEFAULTS, **overrides}
    return assess_vendor_risk(**kwargs)


# ======================================================================
# Rule 1: New vendor with large cumulative awards -> HIGH
# COBOL lines 22-28
# ======================================================================


class TestRule1NewVendorLargePortfolio:
    """years < 2 AND total_awards >= 100,000,000 -> HIGH."""

    def test_new_vendor_large_awards_is_high(self) -> None:
        result = _assess(years_as_vendor=1, vendor_total_awards=100_000_000)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"

    def test_zero_years_large_awards_is_high(self) -> None:
        result = _assess(years_as_vendor=0, vendor_total_awards=200_000_000)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"

    def test_boundary_years_at_threshold_does_not_trigger(self) -> None:
        """years == 2 should NOT trigger rule 1 (requires < 2)."""
        result = _assess(years_as_vendor=2, vendor_total_awards=100_000_000)
        assert result.rating != RiskRating.HIGH or result.reason != "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"

    def test_boundary_awards_minus_one_does_not_trigger(self) -> None:
        """awards == 99,999,999 should NOT trigger rule 1."""
        result = _assess(years_as_vendor=1, vendor_total_awards=99_999_999)
        assert result.rating != RiskRating.HIGH or result.reason != "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"

    def test_new_vendor_below_awards_threshold_not_high(self) -> None:
        """New vendor (0 years) but low awards -> should NOT be HIGH via rule 1."""
        result = _assess(years_as_vendor=0, vendor_total_awards=50_000_000)
        assert result.reason != "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"

    def test_old_vendor_high_awards_not_rule1(self) -> None:
        """Established vendor (10 years) with high awards -> should NOT trigger rule 1."""
        result = _assess(years_as_vendor=10, vendor_total_awards=500_000_000)
        assert result.reason != "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"


# ======================================================================
# Rule 2: Concentration risk -> HIGH
# COBOL lines 31-36
# ======================================================================


class TestRule2ConcentrationRisk:
    """active_contracts >= 8 -> HIGH."""

    def test_eight_contracts_is_high(self) -> None:
        result = _assess(vendor_active_contracts=8)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "EXCESSIVE ACTIVE CONTRACT CONCENTRATION"

    def test_above_threshold_is_high(self) -> None:
        result = _assess(vendor_active_contracts=15)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "EXCESSIVE ACTIVE CONTRACT CONCENTRATION"

    def test_boundary_minus_one_does_not_trigger(self) -> None:
        """7 active contracts should NOT trigger rule 2."""
        result = _assess(vendor_active_contracts=7)
        assert result.reason != "EXCESSIVE ACTIVE CONTRACT CONCENTRATION"

    def test_zero_contracts_does_not_trigger(self) -> None:
        result = _assess(vendor_active_contracts=0)
        assert result.reason != "EXCESSIVE ACTIVE CONTRACT CONCENTRATION"


# ======================================================================
# Rule 3: Single contract dominance -> HIGH
# COBOL lines 39-44
# ======================================================================


class TestRule3SingleContractDominance:
    """largest_contract_value >= 75,000,000 -> HIGH."""

    def test_at_threshold_is_high(self) -> None:
        result = _assess(largest_contract_value=75_000_000)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD"

    def test_above_threshold_is_high(self) -> None:
        result = _assess(largest_contract_value=100_000_000)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD"

    def test_boundary_minus_one_does_not_trigger(self) -> None:
        """74,999,999 should NOT trigger rule 3."""
        result = _assess(largest_contract_value=74_999_999)
        assert result.reason != "SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD"

    def test_zero_value_does_not_trigger(self) -> None:
        result = _assess(largest_contract_value=0)
        assert result.reason != "SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD"


# ======================================================================
# Rule 4: Small business with high cumulative exposure -> HIGH
# COBOL lines 47-53
# ======================================================================


class TestRule4SmallBizExposure:
    """is_small_biz AND total_awards >= 250,000,000 -> HIGH."""

    def test_small_biz_at_threshold_is_high(self) -> None:
        result = _assess(vendor_is_small_biz=True, vendor_total_awards=250_000_000)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT"

    def test_small_biz_above_threshold_is_high(self) -> None:
        result = _assess(vendor_is_small_biz=True, vendor_total_awards=400_000_000)
        assert result.rating == RiskRating.HIGH
        assert result.reason == "SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT"

    def test_boundary_minus_one_does_not_trigger(self) -> None:
        """Small biz with 249,999,999 should NOT trigger rule 4."""
        result = _assess(vendor_is_small_biz=True, vendor_total_awards=249_999_999)
        assert result.reason != "SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT"

    def test_not_small_biz_does_not_trigger(self) -> None:
        """Non-small-biz with high awards should NOT trigger rule 4."""
        result = _assess(vendor_is_small_biz=False, vendor_total_awards=250_000_000)
        assert result.reason != "SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT"


# ======================================================================
# Rule 5a: Elevated active contract count -> MODERATE
# COBOL lines 56-61
# ======================================================================


class TestRule5aElevatedContracts:
    """active_contracts >= 4 (but < 8 so rule 2 doesn't fire) -> MODERATE."""

    def test_four_contracts_is_moderate(self) -> None:
        result = _assess(vendor_active_contracts=4)
        assert result.rating == RiskRating.MODERATE
        assert result.reason == "ELEVATED ACTIVE CONTRACT COUNT"

    def test_seven_contracts_is_moderate(self) -> None:
        """7 contracts: below rule 2 (8), but above rule 5a (4)."""
        result = _assess(vendor_active_contracts=7)
        assert result.rating == RiskRating.MODERATE
        assert result.reason == "ELEVATED ACTIVE CONTRACT COUNT"

    def test_boundary_minus_one_does_not_trigger(self) -> None:
        """3 active contracts should NOT trigger rule 5a."""
        result = _assess(vendor_active_contracts=3)
        assert result.reason != "ELEVATED ACTIVE CONTRACT COUNT"


# ======================================================================
# Rule 5b: Cumulative awards approaching watch level -> MODERATE
# COBOL lines 63-68
# ======================================================================


class TestRule5bCumulativeWatch:
    """total_awards >= 300,000,000 (but below other thresholds) -> MODERATE."""

    def test_at_threshold_is_moderate(self) -> None:
        result = _assess(vendor_total_awards=300_000_000)
        assert result.rating == RiskRating.MODERATE
        assert result.reason == "CUMULATIVE AWARDS APPROACHING WATCH LEVEL"

    def test_above_threshold_is_moderate(self) -> None:
        """Awards > 300M but < 250M small biz threshold (not small biz)."""
        result = _assess(vendor_total_awards=400_000_000)
        assert result.rating == RiskRating.MODERATE
        assert result.reason == "CUMULATIVE AWARDS APPROACHING WATCH LEVEL"

    def test_boundary_minus_one_does_not_trigger(self) -> None:
        """299,999,999 should NOT trigger rule 5b."""
        result = _assess(vendor_total_awards=299_999_999)
        assert result.reason != "CUMULATIVE AWARDS APPROACHING WATCH LEVEL"


# ======================================================================
# Rule 6: All checks passed -> LOW
# COBOL lines 71-73
# ======================================================================


class TestRule6LowRisk:
    """Default when no other rules match -> LOW."""

    def test_all_safe_values_is_low(self) -> None:
        result = _assess()
        assert result.rating == RiskRating.LOW
        assert result.reason == "ALL RISK INDICATORS WITHIN ACCEPTABLE RANGE"

    def test_all_zeros_is_low(self) -> None:
        result = assess_vendor_risk(
            vendor_total_awards=0,
            vendor_active_contracts=0,
            largest_contract_value=0,
            vendor_is_small_biz=False,
            years_as_vendor=0,
        )
        # years=0 < 2, but total_awards=0 < 100M, so rule 1 doesn't fire
        assert result.rating == RiskRating.LOW
        assert result.reason == "ALL RISK INDICATORS WITHIN ACCEPTABLE RANGE"

    def test_established_vendor_moderate_values_is_low(self) -> None:
        result = _assess(
            years_as_vendor=20,
            vendor_total_awards=100_000_000,
            vendor_active_contracts=3,
            largest_contract_value=50_000_000,
            vendor_is_small_biz=False,
        )
        assert result.rating == RiskRating.LOW


# ======================================================================
# Rule priority / first-match-wins (GO TO ASSESSMENT-END) tests
# ======================================================================


class TestRulePriority:
    """Verify COBOL GO TO ASSESSMENT-END semantics are preserved."""

    def test_rule1_fires_before_rule2(self) -> None:
        """New vendor + large awards + many contracts: rule 1 wins."""
        result = _assess(
            years_as_vendor=1,
            vendor_total_awards=100_000_000,
            vendor_active_contracts=10,
        )
        assert result.reason == "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"

    def test_rule2_fires_before_rule3(self) -> None:
        """8 contracts + large single contract: rule 2 wins."""
        result = _assess(
            vendor_active_contracts=8,
            largest_contract_value=80_000_000,
        )
        assert result.reason == "EXCESSIVE ACTIVE CONTRACT CONCENTRATION"

    def test_rule3_fires_before_rule4(self) -> None:
        """Large single contract + small biz exposure: rule 3 wins."""
        result = _assess(
            largest_contract_value=75_000_000,
            vendor_is_small_biz=True,
            vendor_total_awards=300_000_000,
        )
        assert result.reason == "SINGLE CONTRACT EXCEEDS DOMINANCE THRESHOLD"

    def test_rule4_fires_before_rule5a(self) -> None:
        """Small biz exposure + elevated contracts: rule 4 wins."""
        result = _assess(
            vendor_is_small_biz=True,
            vendor_total_awards=250_000_000,
            vendor_active_contracts=5,
        )
        assert result.reason == "SMALL BUSINESS EXCEEDS CUMULATIVE EXPOSURE LIMIT"

    def test_rule5a_fires_before_rule5b(self) -> None:
        """Elevated contracts + high awards: rule 5a wins."""
        result = _assess(
            vendor_active_contracts=4,
            vendor_total_awards=300_000_000,
        )
        assert result.reason == "ELEVATED ACTIVE CONTRACT COUNT"

    def test_all_high_rules_match_rule1_wins(self) -> None:
        """When all HIGH rules match, rule 1 (first) wins."""
        result = assess_vendor_risk(
            years_as_vendor=0,
            vendor_total_awards=300_000_000,
            vendor_active_contracts=10,
            largest_contract_value=80_000_000,
            vendor_is_small_biz=True,
        )
        assert result.rating == RiskRating.HIGH
        assert result.reason == "NEW VENDOR WITH LARGE CUMULATIVE AWARDS"


# ======================================================================
# Edge cases and combination tests
# ======================================================================


class TestEdgeCases:
    """Edge cases not covered by individual rule tests."""

    def test_new_vendor_zero_awards_is_low(self) -> None:
        """New vendor with zero awards -> no rule fires -> LOW."""
        result = _assess(years_as_vendor=0, vendor_total_awards=0)
        assert result.rating == RiskRating.LOW

    def test_small_biz_below_exposure_with_elevated_contracts(self) -> None:
        """Small biz below 250M but with 5 active contracts -> MODERATE via 5a."""
        result = _assess(
            vendor_is_small_biz=True,
            vendor_total_awards=100_000_000,
            vendor_active_contracts=5,
        )
        assert result.rating == RiskRating.MODERATE
        assert result.reason == "ELEVATED ACTIVE CONTRACT COUNT"

    def test_large_awards_non_small_biz_moderate(self) -> None:
        """Non-small-biz with 300M+ awards -> MODERATE (rule 5b)."""
        result = _assess(
            vendor_is_small_biz=False,
            vendor_total_awards=350_000_000,
            vendor_active_contracts=3,
        )
        assert result.rating == RiskRating.MODERATE
        assert result.reason == "CUMULATIVE AWARDS APPROACHING WATCH LEVEL"

    def test_exact_boundary_rule1_both_conditions(self) -> None:
        """years=1, awards=100M exactly -> HIGH (rule 1)."""
        result = _assess(years_as_vendor=1, vendor_total_awards=100_000_000)
        assert result.rating == RiskRating.HIGH

    def test_years_exactly_2_with_large_awards_not_rule1(self) -> None:
        """years=2 is NOT < 2, so rule 1 does not fire even with large awards."""
        result = _assess(years_as_vendor=2, vendor_total_awards=500_000_000)
        # Rule 5b should fire (300M+ awards, not small biz)
        assert result.rating == RiskRating.MODERATE
        assert result.reason == "CUMULATIVE AWARDS APPROACHING WATCH LEVEL"


# ======================================================================
# API wrapper tests
# ======================================================================


class TestApiWrapper:
    """Test the dict-based adapter function."""

    def test_wrapper_returns_correct_shape(self) -> None:
        result = assess_vendor_risk_from_dict({
            "total_awards": 50_000_000,
            "active_contracts": 2,
            "largest_contract_value": 10_000_000,
            "small_business": False,
            "years_as_vendor": 10,
        })
        assert result["risk_rating"] == "LOW"
        assert "risk_reason" in result
        assert "reasons" in result
        assert len(result["reasons"]) == 1

    def test_wrapper_high_risk(self) -> None:
        result = assess_vendor_risk_from_dict({
            "total_awards": 200_000_000,
            "active_contracts": 10,
            "largest_contract_value": 0,
            "small_business": False,
            "years_as_vendor": 5,
        })
        assert result["risk_rating"] == "HIGH"

    def test_wrapper_defaults_missing_fields_to_zero(self) -> None:
        """Missing dict keys default to 0/False."""
        result = assess_vendor_risk_from_dict({})
        # All zeros: years=0 < 2, but awards=0 < 100M -> rule 1 doesn't fire
        # Everything zero -> LOW
        assert result["risk_rating"] == "LOW"

    def test_wrapper_moderate_risk(self) -> None:
        result = assess_vendor_risk_from_dict({
            "total_awards": 300_000_000,
            "active_contracts": 3,
            "largest_contract_value": 10_000_000,
            "small_business": False,
            "years_as_vendor": 10,
        })
        assert result["risk_rating"] == "MODERATE"
        assert "watch level" in result["risk_reason"].lower()


# ======================================================================
# Constant value verification
# ======================================================================


class TestConstants:
    """Verify threshold constants match the COBOL literal values."""

    def test_new_vendor_years_threshold(self) -> None:
        assert NEW_VENDOR_YEARS_THRESHOLD == 2

    def test_new_vendor_awards_threshold(self) -> None:
        assert NEW_VENDOR_AWARDS_THRESHOLD == 100_000_000

    def test_concentration_contracts_threshold(self) -> None:
        assert CONCENTRATION_CONTRACTS_THRESHOLD == 8

    def test_dominance_contract_threshold(self) -> None:
        assert DOMINANCE_CONTRACT_THRESHOLD == 75_000_000

    def test_small_biz_exposure_threshold(self) -> None:
        assert SMALL_BIZ_EXPOSURE_THRESHOLD == 250_000_000

    def test_moderate_contracts_threshold(self) -> None:
        assert MODERATE_CONTRACTS_THRESHOLD == 4

    def test_watch_level_awards_threshold(self) -> None:
        assert WATCH_LEVEL_AWARDS_THRESHOLD == 300_000_000

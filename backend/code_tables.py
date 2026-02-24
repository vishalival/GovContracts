"""Lookup helpers for PSC and NAICS classification code tables.

Loads the CSV source-of-truth files from the ``code_tables/`` directory
and exposes simple functions to resolve a code into its human-readable
description.
"""

import csv
from pathlib import Path
from typing import Dict

CODE_TABLES_DIR = Path(__file__).resolve().parent.parent / "code_tables"

_psc_lookup: Dict[str, str] = {}
_naics_lookup: Dict[str, str] = {}


def _load_csv(path: Path) -> Dict[str, str]:
    """Read a two-column CSV (code, description) into a dict."""
    mapping: Dict[str, str] = {}
    with path.open("r", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            mapping[row["code"].strip()] = row["description"].strip()
    return mapping


def load_code_tables() -> None:
    """Load (or reload) the PSC and NAICS lookup tables from disk."""
    global _psc_lookup, _naics_lookup
    _psc_lookup = _load_csv(CODE_TABLES_DIR / "psc_codes.csv")
    _naics_lookup = _load_csv(CODE_TABLES_DIR / "naics_codes.csv")


def get_psc_description(code: str) -> str:
    """Return the human-readable description for a PSC code, or a fallback."""
    return _psc_lookup.get(code, "Unknown PSC")


def get_naics_description(code: str) -> str:
    """Return the human-readable description for a NAICS code, or a fallback."""
    return _naics_lookup.get(code, "Unknown NAICS")


def enrich_contract(contract: dict) -> dict:
    """Return a shallow copy of *contract* with description fields added."""
    enriched = dict(contract)
    enriched["psc_description"] = get_psc_description(contract.get("psc", ""))
    enriched["naics_description"] = get_naics_description(contract.get("naics", ""))
    return enriched

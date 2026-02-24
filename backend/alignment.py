"""Regulatory alignment engine — compares internal PSC and NAICS code tables
against official government registry snapshots and reports drift with contract
impact counts.

Internal tables: code_tables/psc_codes.csv, code_tables/naics_codes.csv
Official snapshots: external_sources/official_psc_snapshot.csv, official_naics_snapshot.csv
"""

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
CODE_TABLES_DIR = ROOT_DIR / "code_tables"
EXTERNAL_SOURCES_DIR = ROOT_DIR / "external_sources"
DATA_DIR = ROOT_DIR / "backend" / "data"
DOCS_DIR = ROOT_DIR / "docs"

INTERNAL_NAICS_PATH = CODE_TABLES_DIR / "naics_codes.csv"
INTERNAL_PSC_PATH = CODE_TABLES_DIR / "psc_codes.csv"
OFFICIAL_NAICS_PATH = EXTERNAL_SOURCES_DIR / "official_naics_snapshot.csv"
OFFICIAL_PSC_PATH = EXTERNAL_SOURCES_DIR / "official_psc_snapshot.csv"
CONTRACTS_PATH = DATA_DIR / "contracts.json"

ALIGNMENT_REPORT_PATH = DATA_DIR / "alignment_report.json"
ALIGNMENT_REPORT_MD_PATH = DOCS_DIR / "ALIGNMENT_REPORT.md"
ALIGNMENT_PROPOSAL_MD_PATH = DOCS_DIR / "ALIGNMENT_PROPOSAL.md"


def _load_code_table(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}

    result: dict[str, str] = {}
    with path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            code = (row.get("code") or "").strip()
            description = (row.get("description") or "").strip()
            if code and description:
                result[code] = description
    return result


def _load_contract_usage() -> tuple[Counter[str], Counter[str]]:
    psc_usage: Counter[str] = Counter()
    naics_usage: Counter[str] = Counter()
    if not CONTRACTS_PATH.exists():
        return psc_usage, naics_usage

    with CONTRACTS_PATH.open("r", encoding="utf-8") as file:
        contracts = json.load(file)

    for contract in contracts:
        psc = str(contract.get("psc", "")).strip()
        if psc:
            psc_usage[psc] += 1
        naics = str(contract.get("naics", "")).strip()
        if naics:
            naics_usage[naics] += 1

    return psc_usage, naics_usage


def _build_domain_diff(
    *,
    internal: dict[str, str],
    official: dict[str, str],
    usage_counts: Counter[str],
) -> dict[str, list[dict[str, Any]]]:
    added: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []
    modified: list[dict[str, Any]] = []

    for code in sorted(official.keys() - internal.keys()):
        added.append(
            {
                "code": code,
                "official_description": official[code],
                "contracts_affected": usage_counts.get(code, 0),
            }
        )

    for code in sorted(internal.keys() - official.keys()):
        removed.append(
            {
                "code": code,
                "internal_description": internal[code],
                "contracts_affected": usage_counts.get(code, 0),
            }
        )

    for code in sorted(internal.keys() & official.keys()):
        if internal[code] != official[code]:
            modified.append(
                {
                    "code": code,
                    "internal_description": internal[code],
                    "official_description": official[code],
                    "contracts_affected": usage_counts.get(code, 0),
                }
            )

    return {"added": added, "removed": removed, "modified": modified}


def _render_alignment_report_md(report: dict[str, Any]) -> str:
    generated_at = report["generated_at"]
    summary = report["summary"]

    def render_rows(items: list[dict[str, Any]], row_type: str) -> str:
        if not items:
            return "_None._"
        lines = [
            "| Code | Details | Contracts Affected |",
            "|---|---|---:|",
        ]
        for item in items:
            if row_type == "added":
                details = f"Official: {item['official_description']}"
            elif row_type == "removed":
                details = f"Internal: {item['internal_description']}"
            else:
                details = f"Internal: {item['internal_description']} -> Official: {item['official_description']}"
            lines.append(f"| `{item['code']}` | {details} | {item['contracts_affected']} |")
        return "\n".join(lines)

    return "\n".join(
        [
            "# Regulatory Alignment Report",
            "",
            f"Run timestamp: `{generated_at}`",
            "",
            "| Domain | Added | Removed | Modified |",
            "|---|---:|---:|---:|",
            f"| PSC | {summary['psc_added']} | {summary['psc_removed']} | {summary['psc_modified']} |",
            f"| NAICS | {summary['naics_added']} | {summary['naics_removed']} | {summary['naics_modified']} |",
            "",
            "## PSC Added",
            "",
            render_rows(report["psc"]["added"], "added"),
            "",
            "## PSC Removed",
            "",
            render_rows(report["psc"]["removed"], "removed"),
            "",
            "## PSC Modified",
            "",
            render_rows(report["psc"]["modified"], "modified"),
            "",
            "## NAICS Added",
            "",
            render_rows(report["naics"]["added"], "added"),
            "",
            "## NAICS Removed",
            "",
            render_rows(report["naics"]["removed"], "removed"),
            "",
            "## NAICS Modified",
            "",
            render_rows(report["naics"]["modified"], "modified"),
            "",
            "Official snapshot is simulated for demo; in production would be fetched from authoritative registry.",
        ]
    )


def _render_alignment_proposal_md(report: dict[str, Any]) -> str:
    lines = [
        "# Alignment Proposal",
        "",
        "This proposal summarizes recommended internal code-table updates based on the latest alignment report.",
        "Do not auto-apply without approval.",
        "",
        "## Suggested Changes",
        "",
    ]

    def add_proposals(label: str, diff: dict[str, list[dict[str, Any]]]) -> None:
        for item in diff["added"]:
            lines.append(f"- Add {label} `{item['code']}`: `{item['official_description']}`.")
        for item in diff["modified"]:
            lines.append(
                f"- Update {label} `{item['code']}` from `{item['internal_description']}` to "
                f"`{item['official_description']}`."
            )
        for item in diff["removed"]:
            lines.append(
                f"- Review {label} `{item['code']}` for removal/deprecation handling "
                f"(currently internal only: `{item['internal_description']}`)."
            )

    add_proposals("PSC", report["psc"])
    add_proposals("NAICS", report["naics"])

    if lines[-1] == "":
        lines.append("- No differences detected.")

    lines.extend(
        [
            "",
            "## Review Checklist",
            "",
            "- [ ] Confirm each proposed add/update/remove with procurement policy owners.",
            "- [ ] Validate contract/reporting impact for high-usage codes first.",
            "- [ ] Decide deprecation treatment for internal-only codes (remove vs alias vs keep).",
            "- [ ] Approve and schedule table updates in `code_tables/`.",
            "",
            "## Safety Note",
            "",
            "Do not auto-apply without approval.",
        ]
    )
    return "\n".join(lines)


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content + "\n", encoding="utf-8")


def run_alignment_check() -> dict[str, Any]:
    internal_psc = _load_code_table(INTERNAL_PSC_PATH)
    internal_naics = _load_code_table(INTERNAL_NAICS_PATH)
    official_psc = _load_code_table(OFFICIAL_PSC_PATH)
    official_naics = _load_code_table(OFFICIAL_NAICS_PATH)
    psc_usage, naics_usage = _load_contract_usage()
    psc_diff = _build_domain_diff(internal=internal_psc, official=official_psc, usage_counts=psc_usage)
    naics_diff = _build_domain_diff(internal=internal_naics, official=official_naics, usage_counts=naics_usage)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "psc": psc_diff,
        "naics": naics_diff,
        "summary": {
            "psc_added": len(psc_diff["added"]),
            "psc_removed": len(psc_diff["removed"]),
            "psc_modified": len(psc_diff["modified"]),
            "naics_added": len(naics_diff["added"]),
            "naics_removed": len(naics_diff["removed"]),
            "naics_modified": len(naics_diff["modified"]),
        },
    }

    _write_json(ALIGNMENT_REPORT_PATH, report)
    _write_text(ALIGNMENT_REPORT_MD_PATH, _render_alignment_report_md(report))
    _write_text(ALIGNMENT_PROPOSAL_MD_PATH, _render_alignment_proposal_md(report))

    return report


def load_latest_alignment_report() -> dict[str, Any] | None:
    if not ALIGNMENT_REPORT_PATH.exists():
        return None
    return json.loads(ALIGNMENT_REPORT_PATH.read_text(encoding="utf-8"))

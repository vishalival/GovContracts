import json
import os
from pathlib import Path
from typing import Any
import urllib.error
import urllib.request

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
API_DOCS_PATH = BASE_DIR.parent / "docs" / "api.md"
LEGACY_COBOL_DIR = BASE_DIR / "legacy_cobol"
COBOL_PROGRAM_PATH = LEGACY_COBOL_DIR / "CONTRACT_AWARD_ADJUDICATION.cbl"
COBOL_PROGRAM_REPO_PATH = "backend/legacy_cobol/CONTRACT_AWARD_ADJUDICATION.cbl"


class ModernizationTriggerRequest(BaseModel):
    contract_id: str = Field(..., min_length=5, max_length=40)
    cobol_path: str = Field(default=COBOL_PROGRAM_REPO_PATH, min_length=5, max_length=200)
    target_stack: str = Field(default="python-fastapi", min_length=2, max_length=40)
    base_branch: str = Field(default="main", min_length=1, max_length=100)
    event_type: str = Field(default="devin-cobol-modernize", min_length=3, max_length=100)

AGENCIES: list[dict[str, Any]] = []
BUDGETS: list[dict[str, Any]] = []
VENDORS: list[dict[str, Any]] = []
CONTRACTS: list[dict[str, Any]] = []
VENDOR_MAP: dict[str, dict[str, Any]] = {}


app = FastAPI(title="GovContracts API")

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://data-stack-dusky.vercel.app",
]

extra_origins = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if extra_origins:
    ALLOWED_ORIGINS.extend([origin.strip() for origin in extra_origins.split(",") if origin.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_json_file(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _refresh_vendor_metrics() -> None:
    global VENDOR_MAP
    rollups: dict[str, dict[str, int]] = {}
    for contract in CONTRACTS:
        vendor_id = contract["vendor_id"]
        if vendor_id not in rollups:
            rollups[vendor_id] = {"total_awards": 0, "active_contracts": 0}
        rollups[vendor_id]["total_awards"] += int(contract["obligated_amount"])
        if contract["status"] == "Active":
            rollups[vendor_id]["active_contracts"] += 1

    VENDOR_MAP = {vendor["vendor_id"]: dict(vendor) for vendor in VENDORS}
    for vendor_id, metrics in rollups.items():
        if vendor_id in VENDOR_MAP:
            VENDOR_MAP[vendor_id]["total_awards"] = metrics["total_awards"]
            VENDOR_MAP[vendor_id]["active_contracts"] = metrics["active_contracts"]


def _load_data() -> None:
    global AGENCIES, BUDGETS, VENDORS, CONTRACTS
    AGENCIES = _load_json_file(DATA_DIR / "agencies.json")
    BUDGETS = _load_json_file(DATA_DIR / "budgets.json")
    VENDORS = _load_json_file(DATA_DIR / "vendors.json")
    CONTRACTS = _load_json_file(DATA_DIR / "contracts.json")
    _refresh_vendor_metrics()


def _normalize_agency(agency: str | None) -> str | None:
    if agency is None:
        return None
    if agency.upper() == "ALL":
        return None
    return agency.upper()


def _filter_contracts(
    *,
    agency: str | None,
    status: str,
    fiscal_year: int,
) -> list[dict[str, Any]]:
    normalized_agency = _normalize_agency(agency)
    items = [contract for contract in CONTRACTS if contract["fiscal_year"] == fiscal_year]

    if normalized_agency:
        items = [contract for contract in items if contract["agency"] == normalized_agency]
    if status != "All":
        items = [contract for contract in items if contract["status"] == status]
    return items


def _compute_budget_summary(agency: str, fiscal_year: int) -> dict[str, Any]:
    normalized_agency = agency.upper()
    for budget in BUDGETS:
        if budget["agency"] == normalized_agency and budget["fiscal_year"] == fiscal_year:
            total_budget = int(budget["total_budget"])
            obligated_amount = int(budget["obligated_amount"])
            return {
                "agency": normalized_agency,
                "fiscal_year": fiscal_year,
                "total_budget": total_budget,
                "obligated_amount": obligated_amount,
                "remaining_budget": total_budget - obligated_amount,
                "breakdown_by_category": budget["breakdown_by_category"],
            }
    raise HTTPException(status_code=404, detail="Budget summary not found")


def _compute_vendor_detail(vendor_id: str) -> dict[str, Any]:
    vendor = VENDOR_MAP.get(vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor_contracts = [contract for contract in CONTRACTS if contract["vendor_id"] == vendor_id]
    agency_totals: dict[str, int] = {}
    category_totals: dict[str, int] = {}

    for contract in vendor_contracts:
        agency_totals[contract["agency"]] = agency_totals.get(contract["agency"], 0) + int(
            contract["obligated_amount"]
        )
        category_totals[contract["category"]] = category_totals.get(contract["category"], 0) + int(
            contract["obligated_amount"]
        )

    top_agencies = [
        {"agency": agency, "obligated_amount": amount}
        for agency, amount in sorted(agency_totals.items(), key=lambda item: item[1], reverse=True)[:3]
    ]
    top_categories = [
        {"category": category, "obligated_amount": amount}
        for category, amount in sorted(category_totals.items(), key=lambda item: item[1], reverse=True)[:3]
    ]

    return {
        "vendor_id": vendor["vendor_id"],
        "name": vendor["name"],
        "uei": vendor["uei"],
        "duns": vendor.get("duns"),
        "small_business": bool(vendor["small_business"]),
        "total_awards": int(vendor["total_awards"]),
        "active_contracts": int(vendor["active_contracts"]),
        "contracts_count": len(vendor_contracts),
        "top_agencies": top_agencies,
        "top_categories": top_categories,
    }


def _find_contract(contract_id: str) -> dict[str, Any]:
    for contract in CONTRACTS:
        if contract["contract_id"] == contract_id:
            return contract
    raise HTTPException(status_code=404, detail="Contract not found")


def _legacy_cobol_award_decision(contract: dict[str, Any], vendor: dict[str, Any]) -> dict[str, Any]:
    reasons: list[str] = []
    obligated_amount = int(contract["obligated_amount"])
    active_contracts = int(vendor.get("active_contracts", 0))
    total_awards = int(vendor.get("total_awards", 0))

    if contract["status"] != "Active":
        reasons.append("Contract is not active and requires no further award action.")
        return {"decision": "REJECT", "reasons": reasons}

    if obligated_amount < 1_000_000:
        reasons.append("Obligated amount is below the modernization threshold.")
        return {"decision": "REJECT", "reasons": reasons}

    if obligated_amount >= 120_000_000:
        reasons.append("High dollar amount requires additional federal review controls.")
    if active_contracts >= 5:
        reasons.append("Vendor has high active workload concentration.")
    if total_awards >= 500_000_000:
        reasons.append("Vendor cumulative awards exceed policy watch threshold.")

    if reasons:
        return {"decision": "REVIEW", "reasons": reasons}

    reasons.append("Contract and vendor profile satisfy automated legacy award checks.")
    return {"decision": "APPROVE", "reasons": reasons}


def _dispatch_repository_event(*, event_type: str, client_payload: dict[str, Any]) -> dict[str, str]:
    github_token = os.getenv("GITHUB_TOKEN", "").strip()
    github_repository = os.getenv("GITHUB_REPOSITORY", "").strip()
    github_api_url = os.getenv("GITHUB_API_URL", "https://api.github.com").rstrip("/")

    if not github_token:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN is not configured")
    if not github_repository:
        raise HTTPException(status_code=500, detail="GITHUB_REPOSITORY is not configured")

    dispatch_url = f"{github_api_url}/repos/{github_repository}/dispatches"
    payload = json.dumps({"event_type": event_type, "client_payload": client_payload}).encode("utf-8")
    request = urllib.request.Request(
        dispatch_url,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status_code = response.getcode()
            if status_code not in (200, 201, 202, 204):
                raise HTTPException(status_code=502, detail=f"GitHub dispatch failed with status {status_code}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore").strip()
        detail = body or str(exc.reason)
        raise HTTPException(status_code=502, detail=f"GitHub dispatch error: {detail}") from exc
    except urllib.error.URLError as exc:
        raise HTTPException(status_code=502, detail=f"GitHub dispatch network error: {exc.reason}") from exc

    return {"repository": github_repository, "dispatch_url": dispatch_url}


@app.on_event("startup")
def startup_load_data() -> None:
    _load_data()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/agencies")
def get_agencies() -> dict[str, list[dict[str, Any]]]:
    return {"items": AGENCIES}


@app.get("/v1/budget/summary")
def get_budget_summary(
    agency: str = Query(..., min_length=2, max_length=10),
    fiscal_year: int = Query(2026, ge=2000, le=2100),
) -> dict[str, Any]:
    return _compute_budget_summary(agency=agency, fiscal_year=fiscal_year)


@app.get("/v1/contracts")
def get_contracts(
    agency: str | None = Query(None),
    status: str = Query("All"),
    fiscal_year: int = Query(2026, ge=2000, le=2100),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("award_date"),
    sort_dir: str = Query("desc"),
) -> dict[str, Any]:
    allowed_statuses = {"All", "Active", "Closed"}
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="status must be one of All, Active, Closed")

    allowed_sort_by = {"award_date", "obligated_amount"}
    if sort_by not in allowed_sort_by:
        raise HTTPException(status_code=400, detail="sort_by must be one of award_date, obligated_amount")

    allowed_sort_dir = {"asc", "desc"}
    if sort_dir not in allowed_sort_dir:
        raise HTTPException(status_code=400, detail="sort_dir must be one of asc, desc")

    filtered = _filter_contracts(agency=agency, status=status, fiscal_year=fiscal_year)

    if sort_by == "obligated_amount":
        key_fn = lambda contract: int(contract["obligated_amount"])
    else:
        # ISO dates sort correctly as strings.
        key_fn = lambda contract: contract["award_date"]

    filtered = sorted(filtered, key=key_fn, reverse=(sort_dir == "desc"))
    total = len(filtered)
    paginated = filtered[offset : offset + limit]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": paginated,
    }


@app.get("/v1/contracts/{contract_id}")
def get_contract(contract_id: str) -> dict[str, Any]:
    for contract in CONTRACTS:
        if contract["contract_id"] == contract_id:
            return {"item": contract}
    raise HTTPException(status_code=404, detail="Contract not found")


@app.get("/v1/vendors")
def get_vendors(
    query: str = Query("", max_length=100),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, list[dict[str, Any]]]:
    needle = query.strip().lower()
    items = list(VENDOR_MAP.values())
    if needle:
        items = [
            vendor
            for vendor in items
            if needle in vendor["name"].lower() or needle in vendor["uei"].lower()
        ]
    return {"items": items[:limit]}


@app.get("/v1/vendors/{vendor_id}")
def get_vendor_detail(vendor_id: str) -> dict[str, Any]:
    return _compute_vendor_detail(vendor_id)


@app.get("/v1/legacy/cobol/source")
def get_legacy_cobol_source() -> dict[str, str]:
    if not COBOL_PROGRAM_PATH.exists():
        raise HTTPException(status_code=404, detail="Legacy COBOL source not found")
    return {
        "program_name": "CONTRACT_AWARD_ADJUDICATION",
        "path": str(COBOL_PROGRAM_PATH.relative_to(BASE_DIR)),
        "content": COBOL_PROGRAM_PATH.read_text(encoding="utf-8"),
    }


@app.get("/v1/legacy/cobol/adjudication")
def get_legacy_cobol_adjudication(
    contract_id: str = Query(..., min_length=5, max_length=40),
) -> dict[str, Any]:
    contract = _find_contract(contract_id)
    vendor = VENDOR_MAP.get(contract["vendor_id"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found for contract")

    decision = _legacy_cobol_award_decision(contract=contract, vendor=vendor)
    return {
        "program_name": "CONTRACT_AWARD_ADJUDICATION",
        "contract_id": contract["contract_id"],
        "vendor_id": vendor["vendor_id"],
        "decision": decision["decision"],
        "reasons": decision["reasons"],
        "inputs": {
            "contract_status": contract["status"],
            "obligated_amount": int(contract["obligated_amount"]),
            "vendor_active_contracts": int(vendor.get("active_contracts", 0)),
            "vendor_total_awards": int(vendor.get("total_awards", 0)),
        },
    }


@app.post("/v1/modernization/trigger")
def trigger_cobol_modernization(request: ModernizationTriggerRequest) -> dict[str, Any]:
    if not request.cobol_path.lower().endswith(".cbl"):
        raise HTTPException(status_code=400, detail="cobol_path must point to a .cbl file")

    contract = _find_contract(request.contract_id)
    vendor = VENDOR_MAP.get(contract["vendor_id"])
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found for contract")

    adjudication = _legacy_cobol_award_decision(contract=contract, vendor=vendor)
    dispatch_metadata = _dispatch_repository_event(
        event_type=request.event_type,
        client_payload={
            "contract_id": request.contract_id,
            "cobol_path": request.cobol_path,
            "target_stack": request.target_stack,
            "base_branch": request.base_branch,
            "decision_preview": adjudication["decision"],
            "vendor_id": vendor["vendor_id"],
        },
    )

    return {
        "status": "queued",
        "message": "Devin COBOL modernization workflow dispatch requested.",
        "event_type": request.event_type,
        "contract_id": request.contract_id,
        "vendor_id": vendor["vendor_id"],
        "cobol_path": request.cobol_path,
        "target_stack": request.target_stack,
        "base_branch": request.base_branch,
        "decision_preview": adjudication["decision"],
        "repository": dispatch_metadata["repository"],
    }


@app.get("/v1/docs/api")
def get_api_docs_markdown() -> dict[str, str]:
    if not API_DOCS_PATH.exists():
        raise HTTPException(status_code=404, detail="API docs not found")
    return {"content": API_DOCS_PATH.read_text(encoding="utf-8")}

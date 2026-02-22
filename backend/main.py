import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
API_DOCS_PATH = BASE_DIR.parent / "docs" / "api.md"

AGENCIES: list[dict[str, Any]] = []
BUDGETS: list[dict[str, Any]] = []
VENDORS: list[dict[str, Any]] = []
CONTRACTS: list[dict[str, Any]] = []
VENDOR_MAP: dict[str, dict[str, Any]] = {}


app = FastAPI(title="GovContracts API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
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
    year: int = Query(2026, ge=2000, le=2100),
) -> dict[str, Any]:
    return _compute_budget_summary(agency=agency, year=year)


@app.get("/v1/contracts")
def get_contracts(
    agency: str | None = Query(None),
    status: str = Query("All"),
    fiscal_year: int = Query(2026, ge=2000, le=2100),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    allowed_statuses = {"All", "Active", "Closed"}
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="status must be one of All, Active, Closed")

    filtered = _filter_contracts(agency=agency, status=status, fiscal_year=fiscal_year)
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


@app.get("/v1/docs/api")
def get_api_docs_markdown() -> dict[str, str]:
    if not API_DOCS_PATH.exists():
        raise HTTPException(status_code=404, detail="API docs not found")
    return {"content": API_DOCS_PATH.read_text(encoding="utf-8")}

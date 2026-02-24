import csv
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CODE_TABLES_DIR = ROOT_DIR / "code_tables"
NAICS_CODES_PATH = CODE_TABLES_DIR / "naics_codes.csv"

NAICS_CODES: dict[str, str] = {}


def _load_csv_codes(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}

    codes: dict[str, str] = {}
    with path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            code = (row.get("code") or "").strip()
            description = (row.get("description") or "").strip()
            if code and description:
                codes[code] = description
    return codes


def load_code_tables() -> None:
    global NAICS_CODES
    NAICS_CODES = _load_csv_codes(NAICS_CODES_PATH)


def get_naics_description(code: str) -> str | None:
    normalized = code.strip() if code else ""
    return NAICS_CODES.get(normalized)

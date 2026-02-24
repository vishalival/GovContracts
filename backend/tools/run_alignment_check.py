from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from alignment import run_alignment_check


def main() -> None:
    report = run_alignment_check()
    summary = report["summary"]
    print(
        "Alignment check complete: "
        f"PSC(+{summary['psc_added']}/-{summary['psc_removed']}/~{summary['psc_modified']}), "
        f"NAICS(+{summary['naics_added']}/-{summary['naics_removed']}/~{summary['naics_modified']})"
    )


if __name__ == "__main__":
    main()

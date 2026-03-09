# Alignment Proposal

This proposal summarizes recommended internal code-table updates based on the latest alignment report (`2026-03-09T04:53:59Z`).
All changes require procurement policy owner approval before application to `code_tables/`.

## Critical Priority — Codes Removed from Official Registry (9 contracts affected)

These codes exist in internal tables but are absent from the official registry snapshot.
Contracts referencing these codes carry classification risk until a deprecation strategy is decided.

| Code | Domain | Internal Description | Contracts Affected |
|---|---|---|---:|
| `541715` | NAICS | R&D in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology) | 3 |
| `336414` | NAICS | Guided Missile and Space Vehicle Manufacturing | 2 |
| `488490` | NAICS | Other Support Activities for Road Transportation | 2 |
| `237310` | NAICS | Highway, Street, and Bridge Construction | 1 |
| `424210` | NAICS | Drugs and Druggists' Sundries Merchant Wholesalers | 1 |
| `561612` | NAICS | Security Guards and Patrol Services | 1 |
| `561720` | NAICS | Janitorial Services | 1 |
| `Y1JZ` | PSC | Construction of Miscellaneous Buildings | 1 |
| `T550` | PSC | Blockchain Infrastructure Consulting | 0 |

**Required action:** For each code, procurement policy owners must choose one of:
1. **Remove** — delete the code from internal tables and reclassify affected contracts.
2. **Alias** — map the retired code to its official successor (if one exists) and update affected contracts.
3. **Retain** — keep the code with an explicit waiver annotation justifying continued internal use.

## High Priority — Description Drift (7 contracts affected)

These codes exist in both internal and official tables but descriptions differ.
Update internal descriptions to match the official registry.

| Code | Domain | Current Internal Description | Official Description | Contracts Affected |
|---|---|---|---|---:|
| `518210` | NAICS | Computing Infrastructure Providers, Data Processing, and Related Services | Data Processing, Hosting, and Related Services | 4 |
| `541512` | NAICS | Computer Systems Design Services | Computer Systems Design and Related Services | 3 |
| `D307` | PSC | IT Strategy Services | IT and Telecom - IT Strategy and Architecture | 1 |

**Required action:** Update the `description` column in `code_tables/naics_codes.csv` and `code_tables/psc_codes.csv` to match official descriptions. No contract reclassification needed.

## Low Priority — Description Alignment (0 contracts affected)

These codes have minor description differences with no contract impact.

| Code | Domain | Current Internal Description | Official Description |
|---|---|---|---|
| `238220` | NAICS | Plumbing and HVAC Contractors | Plumbing, Heating, and Air-Conditioning Contractors |
| `334511` | NAICS | Search and Detection Equipment Manufacturing | Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing |

**Required action:** Update descriptions in `code_tables/naics_codes.csv` at next convenience.

## Medium Priority — New Official Code (0 contracts affected)

This code appears in the official registry but is not yet in internal tables.

| Code | Domain | Official Description |
|---|---|---|
| `R799` | PSC | Support - Management: Regulatory Compliance Support |

**Required action:** Add `R799` to `code_tables/psc_codes.csv` so future contract awards using this code resolve correctly.

## Review Checklist

- [ ] Triage critical-priority removals: decide remove, alias, or retain for each of the 9 affected codes.
- [ ] Update high-priority descriptions in `code_tables/psc_codes.csv` and `code_tables/naics_codes.csv`.
- [ ] Add PSC `R799` to `code_tables/psc_codes.csv`.
- [ ] Update low-priority descriptions at next convenience.
- [ ] Verify that downstream reports and dashboards reflect any reclassified contracts.
- [ ] Update `docs/code_tables.md` examples if referenced codes are removed or renamed (see note below).

## Documentation Note

`docs/code_tables.md` currently uses NAICS examples `237310`, `336414`, and `541512` (lines 31-32). Codes `237310` and `336414` are flagged for removal, and `541512` has a description update. These examples should be revised once the code-table changes are approved.

## Safety Note

No changes have been auto-applied. All edits to `code_tables/` require explicit approval from procurement policy owners.

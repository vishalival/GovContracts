# Alignment Proposal

This proposal summarizes recommended internal code-table updates based on the latest alignment report (`2026-03-23T05:05:31.880443+00:00`). **Do not auto-apply without procurement policy owner approval.**

## Critical — Codes Removed from Official Registry (9 contracts affected)

These codes exist in internal tables but are absent from the official registry snapshot. Contracts referencing them may carry classification risk.

| Code | Domain | Internal Description | Contracts Affected |
|---|---|---|---:|
| `Y1JZ` | PSC | Construction of Miscellaneous Buildings | 1 |
| `237310` | NAICS | Highway, Street, and Bridge Construction | 1 |
| `336414` | NAICS | Guided Missile and Space Vehicle Manufacturing | 2 |
| `424210` | NAICS | Drugs and Druggists' Sundries Merchant Wholesalers | 1 |
| `488490` | NAICS | Other Support Activities for Road Transportation | 2 |
| `541715` | NAICS | R&D in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology) | 3 |
| `561612` | NAICS | Security Guards and Patrol Services | 1 |
| `561720` | NAICS | Janitorial Services | 1 |

**Required action:** For each code, decide whether to *remove*, *alias to a successor code*, or *retain with a deprecation flag*. Prioritize codes with active contract references.

## Critical — Low-Impact Removal (0 contracts affected)

| Code | Domain | Internal Description | Contracts Affected |
|---|---|---|---:|
| `T550` | PSC | Blockchain Infrastructure Consulting | 0 |

**Required action:** Confirm removal or deprecation. No active contracts are affected, so this is safe to remove once approved.

## High — Description Mismatches Affecting Active Contracts (7 contracts affected)

Internal descriptions diverge from official registry descriptions. Contracts using these codes display outdated labels.

| Code | Domain | Internal Description | Official Description | Contracts Affected |
|---|---|---|---|---:|
| `518210` | NAICS | Computing Infrastructure Providers, Data Processing, and Related Services | Data Processing, Hosting, and Related Services | 4 |
| `541512` | NAICS | Computer Systems Design Services | Computer Systems Design and Related Services | 3 |

**Required action:** Update internal descriptions in `code_tables/naics_codes.csv` to match official registry.

## Medium — Description Mismatches (1 contract affected)

| Code | Domain | Internal Description | Official Description | Contracts Affected |
|---|---|---|---|---:|
| `D307` | PSC | IT Strategy Services | IT and Telecom - IT Strategy and Architecture | 1 |

**Required action:** Update internal description in `code_tables/psc_codes.csv` to match official registry.

## Medium — New Official Codes Not in Internal Tables (0 contracts affected)

| Code | Domain | Official Description | Contracts Affected |
|---|---|---|---:|
| `R799` | PSC | Support - Management: Regulatory Compliance Support | 0 |

**Required action:** Add to `code_tables/psc_codes.csv` if this code is expected to appear in future contract awards. No urgency since no existing contracts reference it.

## Low — Cosmetic Description Mismatches (0 contracts affected)

| Code | Domain | Internal Description | Official Description | Contracts Affected |
|---|---|---|---|---:|
| `238220` | NAICS | Plumbing and HVAC Contractors | Plumbing, Heating, and Air-Conditioning Contractors | 0 |
| `334511` | NAICS | Search and Detection Equipment Manufacturing | Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing | 0 |

**Required action:** Update descriptions in `code_tables/naics_codes.csv` at next convenience. No contract impact.

## Review Checklist

- [ ] Confirm each proposed add/update/remove with procurement policy owners.
- [ ] Prioritize critical-severity items with active contract references first.
- [ ] For removed codes: decide deprecation treatment (remove, alias to successor, or retain with flag).
- [ ] For description mismatches: verify official descriptions against the authoritative GSA/Census registry before applying.
- [ ] Validate that high-impact description updates (518210, 541512) do not break downstream reporting filters.
- [ ] Approve and schedule table updates in `code_tables/`.
- [ ] After updates, re-run `POST /internal/alignment/run` to verify drift is resolved.

## Safety Note

**Do not auto-apply these changes without explicit procurement policy owner approval.** All recommendations are human-in-the-loop; this report is advisory only.

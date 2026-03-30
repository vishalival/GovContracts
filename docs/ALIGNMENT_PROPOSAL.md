# Alignment Proposal

This proposal summarizes recommended internal code-table updates based on the latest alignment report (`2026-03-30T05:27:31Z`). Items are grouped by severity. **Do not auto-apply without procurement policy owner approval.**

## Critical — Removed Codes Still Referenced by Active Contracts

These codes exist in internal tables but are absent from the official registry while active contracts still reference them. Requires a migration or re-classification plan before removal.

| Code | Domain | Internal Description | Contracts Affected | Recommended Action |
|---|---|---|---:|---|
| `Y1JZ` | PSC | Construction of Miscellaneous Buildings | 1 | Re-classify affected contract to a valid PSC before removing code. |
| `237310` | NAICS | Highway, Street, and Bridge Construction | 1 | Re-classify affected contract to a valid NAICS before removing code. |
| `336414` | NAICS | Guided Missile and Space Vehicle Manufacturing | 2 | Re-classify affected contracts to a valid NAICS before removing code. |
| `424210` | NAICS | Drugs and Druggists' Sundries Merchant Wholesalers | 1 | Re-classify affected contract to a valid NAICS before removing code. |
| `488490` | NAICS | Other Support Activities for Road Transportation | 2 | Re-classify affected contracts to a valid NAICS before removing code. |
| `541715` | NAICS | R&D in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology) | 3 | Re-classify affected contracts to a valid NAICS before removing code. |
| `561612` | NAICS | Security Guards and Patrol Services | 1 | Re-classify affected contract to a valid NAICS before removing code. |
| `561720` | NAICS | Janitorial Services | 1 | Re-classify affected contract to a valid NAICS before removing code. |

**Total critical items: 8 (affecting 11 contracts).**

## High — Modified Descriptions on High-Usage Codes

These codes exist in both tables but the internal description diverges from the official description. High contract usage means downstream reports and filters may display stale labels.

| Code | Domain | Internal Description | Official Description | Contracts Affected | Recommended Action |
|---|---|---|---|---:|---|
| `518210` | NAICS | Computing Infrastructure Providers, Data Processing, and Related Services | Data Processing, Hosting, and Related Services | 4 | Update internal description to match official. |
| `541512` | NAICS | Computer Systems Design Services | Computer Systems Design and Related Services | 3 | Update internal description to match official. |

## Medium — New or Low-Usage Modified Codes

| Code | Domain | Type | Details | Contracts Affected | Recommended Action |
|---|---|---|---|---:|---|
| `R799` | PSC | Added | Official: Support - Management: Regulatory Compliance Support | 0 | Add to `psc_codes.csv` to enable future use. |
| `D307` | PSC | Modified | Internal: IT Strategy Services → Official: IT and Telecom - IT Strategy and Architecture | 1 | Update internal description to match official. |

## Low — Removed Codes With No Active Contract References

These codes can be safely deprecated or removed since no active contracts reference them.

| Code | Domain | Internal Description | Recommended Action |
|---|---|---|---|
| `T550` | PSC | Blockchain Infrastructure Consulting | Remove from `psc_codes.csv` or mark deprecated. No contract impact. |

## Low — Modified Descriptions With No Active Contract References

| Code | Domain | Internal Description | Official Description | Recommended Action |
|---|---|---|---|---|
| `238220` | NAICS | Plumbing and HVAC Contractors | Plumbing, Heating, and Air-Conditioning Contractors | Update internal description to match official. No contract impact. |
| `334511` | NAICS | Search and Detection Equipment Manufacturing | Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing | Update internal description to match official. No contract impact. |

## Review Checklist

- [ ] Triage critical items first: identify replacement codes for the 8 removed codes affecting 11 contracts.
- [ ] Confirm high-severity description updates (NAICS `518210`, `541512`) with procurement policy owners.
- [ ] Update `code_tables/psc_codes.csv` and `code_tables/naics_codes.csv` only after approval.
- [ ] Decide deprecation treatment for zero-impact removals (PSC `T550`): remove, alias, or keep.
- [ ] Verify that `docs/code_tables.md` examples are updated after any table changes (currently references removed codes `237310` and `336414`).
- [ ] Run `POST /internal/alignment/run` after applying table updates to confirm drift is resolved.

## Safety Note

**Do not auto-apply table edits without explicit procurement policy owner approval.** All changes require human-in-the-loop review.

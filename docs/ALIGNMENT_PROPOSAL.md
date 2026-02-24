# Alignment Proposal

This proposal summarizes recommended internal code-table updates based on the latest alignment report (`2026-02-24T18:58:47.525770+00:00`).
Do not auto-apply without approval.

## Critical — Removed Codes Still Referenced by Active Contracts

These internal codes are absent from the official registry but are still assigned to live contracts. Removing them without a migration path will produce `"Unknown PSC"` or `"Unknown NAICS"` fallback descriptions in API responses.

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

**Recommended action:** For each code above, choose one of:
1. **Retain as alias** — keep the internal code with a deprecation flag so existing contracts resolve correctly.
2. **Remap** — reassign affected contracts to the nearest official code before removing.
3. **Remove** — delete from `code_tables/` only after confirming zero active contract references remain.

## High — Description Drift on High-Usage Codes

These codes exist in both internal and official tables but their descriptions diverge. The internal description is shown in API responses; updating it will change user-facing text for multiple contracts.

| Code | Domain | Internal Description | Official Description | Contracts Affected |
|---|---|---|---|---:|
| `518210` | NAICS | Computing Infrastructure Providers, Data Processing, and Related Services | Data Processing, Hosting, and Related Services | 4 |
| `541512` | NAICS | Computer Systems Design Services | Computer Systems Design and Related Services | 3 |

**Recommended action:** Align internal descriptions to official wording. Notify downstream report consumers before updating.

## Medium — Description Drift or Newly Catalogued Codes

| Code | Domain | Change Type | Details | Contracts Affected |
|---|---|---|---|---:|
| `R799` | PSC | Add | Official: Support - Management: Regulatory Compliance Support | 0 |
| `D307` | PSC | Update | `IT Strategy Services` -> `IT and Telecom - IT Strategy and Architecture` | 1 |

**Recommended action:** Add `R799` to `code_tables/psc_codes.csv`. Update `D307` description after verifying no reporting dependencies.

## Low — Cosmetic or Zero-Impact Drift

| Code | Domain | Change Type | Details | Contracts Affected |
|---|---|---|---|---:|
| `T550` | PSC | Remove candidate | Internal only: Blockchain Infrastructure Consulting | 0 |
| `238220` | NAICS | Update | `Plumbing and HVAC Contractors` -> `Plumbing, Heating, and Air-Conditioning Contractors` | 0 |
| `334511` | NAICS | Update | `Search and Detection Equipment Manufacturing` -> `Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing` | 0 |

**Recommended action:** Apply at convenience. No contract impact.

## Review Checklist

- [ ] Triage all 8 critical-severity removed codes — decide retain-as-alias, remap, or remove for each.
- [ ] Confirm high-severity description updates (`518210`, `541512`) with procurement policy owners before applying.
- [ ] Validate that `D307` description update does not break fiscal-year reporting filters.
- [ ] Approve addition of `R799` to `code_tables/psc_codes.csv`.
- [ ] Schedule table updates in `code_tables/` after all approvals.
- [ ] Verify API response examples in `docs/api.md` still reflect current code-table state after updates.

## Safety Note

Do not auto-apply without approval. All table edits require human sign-off and should be staged in a dedicated PR with contract-impact validation.

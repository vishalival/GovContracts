# Alignment Proposal

This proposal summarizes recommended internal code-table updates based on the latest alignment report (`2026-02-24T15:20:25.869858+00:00`).

**All changes require explicit human approval before application.** No source-table edits should be auto-applied.

---

## High-Impact Changes (contracts affected > 0)

These changes affect live contract records. Prioritize review and impact assessment before applying.

### Description Updates

| Code | Domain | Current (Internal) | Proposed (Official) | Contracts Affected |
|---|---|---|---|---:|
| `518210` | NAICS | Computing Infrastructure Providers, Data Processing, and Related Services | Data Processing, Hosting, and Related Services | 4 |
| `D302` | PSC | IT and Telecom - Systems Development | IT and Telecommunications Systems Support Services | 3 |
| `R706` | PSC | Support - Management: IT Systems Development | Information Technology Systems Development Services | 3 |
| `541512` | NAICS | Computer Systems Design Services | Computer Systems Design and Related Services | 3 |

### Removals Requiring Deprecation Decision

These codes exist in the internal tables but are absent from the official registry snapshot. Each requires a decision: **remove**, **alias to a successor code**, or **retain with a deprecation flag**.

| Code | Domain | Internal Description | Contracts Affected | Suggested Action |
|---|---|---|---:|---|
| `541715` | NAICS | R&D in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology) | 3 | Identify successor NAICS code; remap affected contracts before removal. |
| `488490` | NAICS | Other Support Activities for Road Transportation | 2 | Identify successor NAICS code; remap affected contracts before removal. |
| `336414` | NAICS | Guided Missile and Space Vehicle Manufacturing | 2 | Identify successor NAICS code; remap affected contracts before removal. |
| `Y1JZ` | PSC | Construction of Miscellaneous Buildings | 1 | Identify successor PSC code or retain with deprecation flag. |
| `237310` | NAICS | Highway, Street, and Bridge Construction | 1 | Identify successor NAICS code; remap affected contracts before removal. |
| `424210` | NAICS | Drugs and Druggists' Sundries Merchant Wholesalers | 1 | Identify successor NAICS code; remap affected contracts before removal. |
| `561612` | NAICS | Security Guards and Patrol Services | 1 | Identify successor NAICS code; remap affected contracts before removal. |
| `561720` | NAICS | Janitorial Services | 1 | Identify successor NAICS code; remap affected contracts before removal. |

---

## Zero-Impact Changes (no contracts affected)

These changes can be applied with lower risk since no existing contract records reference these codes.

### New Codes to Add

| Code | Domain | Official Description | Contracts Affected |
|---|---|---|---:|
| `R799` | PSC | Support - Management: Regulatory Compliance Support | 0 |
| `V221` | PSC | AIT Controlled Goods Transportation | 0 |

### Description Updates (zero usage)

| Code | Domain | Current (Internal) | Proposed (Official) | Contracts Affected |
|---|---|---|---|---:|
| `238220` | NAICS | Plumbing and HVAC Contractors | Plumbing, Heating, and Air-Conditioning Contractors | 0 |
| `334511` | NAICS | Search and Detection Equipment Manufacturing | Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing | 0 |

---

## Downstream Documentation Impacts

If the above changes are approved and applied to `code_tables/`, the following documentation will also require updates:

- **`docs/api.md`** — Example JSON responses for `GET /v1/contracts` and `GET /v1/contracts/{contract_id}` use PSC `R706` and NAICS `488490` descriptions that will change or become invalid after alignment.
- **`docs/code_tables.md`** — Example codes (`D302`, `R706`, `541512`, `237310`, `336414`) reference current internal descriptions that will change.

---

## Review Checklist

- [ ] Confirm each proposed add/update/remove with procurement policy owners.
- [ ] For high-impact description updates (4 codes, 13 contracts total): verify that downstream reports and dashboards tolerate description changes.
- [ ] For each removal candidate (8 codes, 11 contracts total): identify an official successor code or decide to retain with a deprecation flag.
- [ ] Validate that no active small-business set-aside determinations depend on removed NAICS codes.
- [ ] After applying changes to `code_tables/`, update `docs/api.md` examples and `docs/code_tables.md` examples accordingly.
- [ ] Approve and schedule table updates in `code_tables/`.

## Safety Note

**Do not auto-apply without approval.** All source-table edits must be reviewed and approved by a procurement policy owner before merging.

# Alignment Proposal

This proposal summarizes recommended internal code-table updates based on the latest alignment report (`2026-03-16T05:19:20.575841+00:00`).

**Do not auto-apply. All changes require procurement policy owner approval before execution.**

**Impact overview:** 8 critical, 2 high, 2 medium, 3 low severity items across 15 drift findings. Critical items affect contracts with active obligations and must be triaged first.

---

## Critical — Removed Codes With Active Contracts

These codes exist in internal tables but are absent from the official registry snapshot. Contracts currently reference them, creating compliance risk.

| Code | Domain | Internal Description | Contracts Affected | Action Required |
|---|---|---|---:|---|
| `541715` | NAICS | R&D in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology) | 3 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |
| `336414` | NAICS | Guided Missile and Space Vehicle Manufacturing | 2 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |
| `488490` | NAICS | Other Support Activities for Road Transportation | 2 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |
| `237310` | NAICS | Highway, Street, and Bridge Construction | 1 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |
| `424210` | NAICS | Drugs and Druggists' Sundries Merchant Wholesalers | 1 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |
| `561612` | NAICS | Security Guards and Patrol Services | 1 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |
| `561720` | NAICS | Janitorial Services | 1 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |
| `Y1JZ` | PSC | Construction of Miscellaneous Buildings | 1 | Reclassify or obtain waiver for affected contracts before next reporting cycle. |

## High — Description Drift on High-Usage Codes

Internal descriptions diverge from the official registry on codes referenced by 3+ contracts. Update internal tables to align with official descriptions.

| Code | Domain | Internal Description | Official Description | Contracts Affected |
|---|---|---|---|---:|
| `518210` | NAICS | Computing Infrastructure Providers, Data Processing, and Related Services | Data Processing, Hosting, and Related Services | 4 |
| `541512` | NAICS | Computer Systems Design Services | Computer Systems Design and Related Services | 3 |

## Medium — Description Drift or Newly Available Codes

These items have lower immediate risk but should be addressed to maintain table accuracy.

| Code | Domain | Change Type | Details | Contracts Affected |
|---|---|---|---|---:|
| `D307` | PSC | Description update | `IT Strategy Services` → `IT and Telecom - IT Strategy and Architecture` | 1 |
| `R799` | PSC | New code available | `Support - Management: Regulatory Compliance Support` (add to internal table) | 0 |

## Low — Removed Codes or Description Drift With No Active Contracts

No immediate contract impact. Address during next scheduled table maintenance.

| Code | Domain | Change Type | Details |
|---|---|---|---|
| `T550` | PSC | Removal candidate | `Blockchain Infrastructure Consulting` — internal only, no contracts reference this code. |
| `238220` | NAICS | Description update | `Plumbing and HVAC Contractors` → `Plumbing, Heating, and Air-Conditioning Contractors` |
| `334511` | NAICS | Description update | `Search and Detection Equipment Manufacturing` → `Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing` |

---

## Review Checklist

- [ ] Triage all 8 critical items: determine reclassification path or waiver for each affected contract.
- [ ] Update internal descriptions for the 2 high-severity codes (`518210`, `541512`) after confirming no downstream reporting dependencies.
- [ ] Decide whether to add PSC `R799` to the internal table.
- [ ] Decide deprecation treatment for `T550` (remove, alias, or retain).
- [ ] Confirm each proposed change with procurement policy owners.
- [ ] Approve and schedule table updates in `code_tables/`.

## Safety Note

**Do not auto-apply without approval.** All edits to `code_tables/` must be reviewed and approved by a procurement policy owner. Use the compliance judgment endpoint (`POST /v1/compliance/judgment`) to record human decisions for contracts at risk.

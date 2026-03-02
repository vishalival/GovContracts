# Alignment Proposal

This proposal summarizes recommended internal code-table updates based on the latest alignment report (`2026-03-02T04:50:11.793591+00:00`).
Do not auto-apply without approval.

## Impact Summary

| Severity | Count | Contracts Affected |
|---|---:|---:|
| Critical | 8 | 12 |
| High | 2 | 7 |
| Medium | 2 | 1 |
| Low | 3 | 0 |

> **Total exposure:** 19 contract references use codes with regulatory drift. Critical items should be triaged first.

## Critical Priority: Removed Codes With Active Contracts

These codes exist in the internal tables but are absent from the official registry snapshot. Active contracts still reference them, creating compliance risk.

- **NAICS `541715`** (3 contracts): "R&D in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology)" is not in the official snapshot. Determine replacement code or obtain waiver before next reporting cycle.
- **NAICS `336414`** (2 contracts): "Guided Missile and Space Vehicle Manufacturing" is not in the official snapshot. Determine replacement code or obtain waiver.
- **NAICS `488490`** (2 contracts): "Other Support Activities for Road Transportation" is not in the official snapshot. Determine replacement code or obtain waiver.
- **NAICS `237310`** (1 contract): "Highway, Street, and Bridge Construction" is not in the official snapshot. Determine replacement code or obtain waiver.
- **NAICS `424210`** (1 contract): "Drugs and Druggists' Sundries Merchant Wholesalers" is not in the official snapshot. Determine replacement code or obtain waiver.
- **NAICS `561612`** (1 contract): "Security Guards and Patrol Services" is not in the official snapshot. Determine replacement code or obtain waiver.
- **NAICS `561720`** (1 contract): "Janitorial Services" is not in the official snapshot. Determine replacement code or obtain waiver.
- **PSC `Y1JZ`** (1 contract): "Construction of Miscellaneous Buildings" is not in the official snapshot. Determine replacement code or obtain waiver.

## High Priority: Modified Descriptions on High-Usage Codes

These codes exist in both tables but the official description has diverged. High contract usage means reporting outputs may be inconsistent.

- **NAICS `518210`** (4 contracts): Update from `Computing Infrastructure Providers, Data Processing, and Related Services` to `Data Processing, Hosting, and Related Services`.
- **NAICS `541512`** (3 contracts): Update from `Computer Systems Design Services` to `Computer Systems Design and Related Services`.

## Medium Priority: New and Low-Usage Modified Codes

- **PSC `R799`** (0 contracts): Add `Support - Management: Regulatory Compliance Support` to internal table. No immediate contract impact.
- **PSC `D307`** (1 contract): Update from `IT Strategy Services` to `IT and Telecom - IT Strategy and Architecture`.

## Low Priority: Removed Codes With No Active Contracts

These can be deprecated at convenience since no active contracts reference them.

- **PSC `T550`** (0 contracts): `Blockchain Infrastructure Consulting` is internal-only. Safe to remove or archive.
- **NAICS `238220`** (0 contracts): Update from `Plumbing and HVAC Contractors` to `Plumbing, Heating, and Air-Conditioning Contractors`.
- **NAICS `334511`** (0 contracts): Update from `Search and Detection Equipment Manufacturing` to `Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing`.

## Review Checklist

- [ ] Triage the 8 critical items with procurement policy owners; prioritize by contract count (NAICS 541715, 336414, 488490 first).
- [ ] For each removed code with active contracts, decide: reclassify contracts to a valid code, request a regulatory exception, or escalate.
- [ ] Approve description updates for high-priority modified codes (NAICS 518210, 541512) and schedule table edits in `code_tables/`.
- [ ] Confirm that medium/low changes do not affect downstream reporting before applying.
- [ ] After table updates, re-run `POST /internal/alignment/run` to verify drift is resolved.

## Safety Note

Do not auto-apply without approval. All monetary values in contract data use integer representation (whole dollars) consistent with legacy COBOL field definitions.

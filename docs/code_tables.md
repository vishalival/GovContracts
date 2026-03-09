# Federal Procurement Classification Codes

## Overview

Government contracts use standardized classification codes to categorize the products and services being procured. The two primary classification systems are **PSC** (Product and Service Codes) and **NAICS** (North American Industry Classification System) codes. These codes appear on every federal contract award and are essential for searching, filtering, and analyzing procurement data.

## What Are PSC Codes?

**Product and Service Codes (PSC)** are four-character alphanumeric codes maintained by the General Services Administration (GSA). They classify _what_ the government is buying.

Examples:
- `D302` - IT and Telecom - Systems Development
- `R706` - Support - Management: IT Systems Development
- `Y1QA` - Construction of Highways, Roads, Streets, Bridges, and Railways

PSC codes are grouped by prefix:
- **A** - Research and Development
- **D** - IT and Telecommunications
- **J** - Maintenance and Repair
- **R** - Professional, Administrative, and Management Support
- **S** - Utilities and Housekeeping
- **Y** - Construction
- **Numeric (e.g. 6505)** - Products/Supplies

## What Are NAICS Codes?

**North American Industry Classification System (NAICS)** codes are six-digit numeric codes maintained by the U.S. Census Bureau and the Office of Management and Budget. They classify the _industry_ of the contractor performing the work.

Examples:
- `541512` - Computer Systems Design Services
- `237310` - Highway, Street, and Bridge Construction
- `336414` - Guided Missile and Space Vehicle Manufacturing

## Why Are These Codes Cryptic?

These codes were designed for machine processing and statistical aggregation, not for human readability. Their compact format allows consistent categorization across millions of transactions, but it creates a significant barrier for analysts, journalists, and oversight personnel trying to understand what a contract actually covers.

The meanings of codes can also shift over time as classification systems are updated. NAICS codes are revised on a five-year cycle, and PSC codes are updated periodically by the GSA. This creates **semantic documentation drift** where historical contract records may reference codes whose definitions have changed.

## How They Are Used in Federal Procurement

1. **Contract classification** - Every federal contract award must include both a PSC and NAICS code.
2. **Small business set-asides** - NAICS codes determine which size standards apply for small business eligibility.
3. **Market research** - Agencies use these codes to search for potential vendors and analyze spending patterns.
4. **Congressional reporting** - Spending reports are aggregated by these codes.
5. **FPDS and SAM.gov** - The Federal Procurement Data System and System for Award Management use these codes extensively.

## Source of Truth

The CSV files in the `code_tables/` directory serve as the source of truth for code-to-description mappings used by this application:

- `code_tables/psc_codes.csv` - PSC code lookup table
- `code_tables/naics_codes.csv` - NAICS code lookup table

These tables are loaded by the backend at startup and used to enrich contract responses with human-readable descriptions (`psc_description` and `naics_description` fields). If a contract references a code that is not present in the lookup table, the description falls back to `"Unknown PSC"` or `"Unknown NAICS"` respectively.

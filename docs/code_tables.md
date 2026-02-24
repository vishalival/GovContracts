# Government Code Tables

Federal procurement records often store classification data as short codes that are difficult to interpret without reference tables.

## NAICS (North American Industry Classification System)

NAICS codes classify the economic activity or industry of the vendor or requirement and are frequently used for market analysis and set-aside strategy.

## Why these codes are cryptic

Operational federal systems typically persist compact values (for example `541512`) to optimize data exchange and maintain compatibility with upstream systems.

## Source of truth

This project keeps the source-of-truth NAICS table in:

- `code_tables/naics_codes.csv`

The backend loads this file at startup and decodes NAICS dynamically so dashboards can display readable descriptions without duplicating logic in the UI.

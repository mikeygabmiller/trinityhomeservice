# Organic search measurement

This dependency-free Node tool turns a verified Search Console snapshot into a local dashboard, daily CSV, page CSV, query/page CSV and machine-readable summary. It does not change the live site, forms, pricing or `/lights/`.

## Refresh (AI operator)

1. Discover the connected Windsor `searchconsole` account, fields and options. Select only `https://trinityexteriorco.com/`. Do not guess accounts or fields.
2. Use the same explicit date range for three successful reads. Prefer finalized data and an end date at least three days behind the current date. Record the actual latest returned date; do not fill missing dates with zero.
   - Property: `date,clicks,impressions,ctr,position`.
   - Pages: `date,page,clicks,impressions,ctr,position`.
   - Query/page: `date,page,query,clicks,impressions,ctr,position`.
3. Read sitemap health separately: `path,submitted,errors,warnings,last_downloaded,last_submitted`. Do not use the deprecated `indexed` field as evidence of index coverage.
4. Save the arrays in a **local** JSON snapshot with `property`, `captured_at` (ISO timestamp), `date_from`, `date_to`, `property_daily`, `page_daily`, `query_page_daily` and `sitemaps`. Extract the successful connector response's `result` array. A failed read is a blocker, never an empty array or zero.
5. Run `node seo-measure.mjs seo-data/snapshot.json seo-output/latest` and open `seo-output/latest/dashboard.html`. Archive dated snapshots locally. Run `node --test seo-measure.test.mjs` after changing calculation logic.

The ignored directories are conveniences, not an access-control system. Keep raw data and generated files out of commits, PRs and GitHub Pages. The report works offline and loads no remote scripts or trackers. Its noindex tag does not make a hosted file private. Share it only deliberately. Use a local preview when inspecting it with a browser.

## Interpretation

Property totals and page totals have different aggregation rules. Never add page impressions to estimate site impressions. CTR is recomputed from clicks/impressions; position is weighted by impressions. Missing rows remain unavailable. The API can omit anonymized queries and detailed data, so the query/page table is not a complete keyword inventory. Average search position is not a guaranteed ranking or a Maps rank.

Refresh with comparable full windows before claiming growth. A later cumulative snapshot versus an earlier partial snapshot is not a valid growth comparison. The tool replaces a report from one snapshot rather than appending overlapping extracts, preventing accidental double counting. It rejects duplicate dimension rows and account/date mismatches.

Prioritize Christmas lighting, then gutters. Filter those services in the dashboard. Do not create/rewrite city pages simply because they lack rows. Record Google URL Inspection evidence separately: a successful HTTP response or sitemap inclusion is not proof of indexing.

## Lead and revenue attribution: pending connection

Search Console measures search exposure and clicks, not leads or revenue. The current website counter cannot distinguish organic sessions. Until source-to-lead-to-job linkage is verified, qualified leads and booked revenue remain unavailable, never zero. Do not install a guessed GA4 ID, treat call clicks as completed calls, or change public contact numbers to track calls.

When Rotor access works, retain these fields in a private operational store: opaque lead ID, created date, service, first landing path, source/medium/campaign, attribution method, qualified date, quote ID, job ID, booked date, booked revenue and currency. Deduplicate by lead/job ID and preserve unknown source. Never place names, emails, addresses, phone numbers, or CRM identifiers in URLs or analytics events. Count one qualified lead per lead and one booked amount per job; distinguish booked revenue from cash received. Query-level revenue cannot be inferred by joining Search Console queries to individual people.

Any future form instrumentation must preserve existing submissions, capture success only after the backend accepts it, respect consent choices, and be tested without contacting real customers. This implementation intentionally leaves customer flows intact.

Sources: [Google Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [Google guidance on aggregation and missing rows](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data), [Search Console privacy filtering](https://developers.google.com/search/blog/2022/10/performance-data-deep-dive).

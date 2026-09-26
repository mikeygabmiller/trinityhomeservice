# Homeowner SEO tools

Four public entry points support lighting first and gutters second. Existing `/lights/`, its city pages, `/book/`, window and roof landing pages remain unchanged. The homepage has one new planning-links section, gutter cleaning has one related link, and the sitemap adds four URLs.

| Page | Purpose | Current content |
| --- | --- | --- |
| `/christmas-lighting-cost/` | Build a lighting quote brief and explain scope | Working planner; dollar ranges disabled pending Louis's approved pricing |
| `/christmas-lighting-ideas/` | Choose a reference design | Two owner-approved warm-white roofline project photos |
| `/projects/` | Search/filter real job proof | Two lighting projects and three owner-confirmed cleaning photos |
| `/gutter-help/` | Describe symptoms and discuss repeat maintenance | Ground-level observation prompts and county vegetation-based guidance |

## Pricing gate

The lighting page's `budget-rules` JSON has `approved:false` and no rates. The range engine fails closed on missing/invalid rules or measurements. There are no live sample prices. Its arithmetic tests use synthetic numbers labeled TEST ONLY.

Before enabling ranges, obtain Louis's actual rules: whether a footage model is appropriate, rate bounds for supported home heights, minimum, scope/inclusions, taxes and any access restrictions. Validate against approved actual quotes. `approvedOn` records the date and `scope` is shown with every result. Unsupported heights or unknown measurements get a property-specific quote instead. More complex pricing requires extending the engine and tests, not forcing it into these fields. Never infer roofline footage from house floor area. Never activate an estimate from test fixtures.

## Contact and privacy

The existing landing forms have no notes fields. Each tool instead offers copyable notes and an email compose link to the established public business email. The visitor reviews and sends the message in their own app. A separate callback link uses the existing landing form unchanged. The tools themselves do not send messages, submit forms, upload files, collect contact details, or persist selections.

## Measurement

`seo-measure.mjs` groups the two new lighting pages under Christmas lighting and gutter help under Gutters. The mixed-service project library remains Shared / booking. New pages have no established search baseline yet; missing rows are unavailable, not zero.

The browser queues `seo_tool_start`, `seo_tool_result`, `seo_tool_filter`, and `seo_quote_click` in `dataLayer` with fixed tool/choice labels. Search terms, roofline measurements, note contents and customer information are excluded. These hooks **are not a connected analytics system**: no tag or analytics ID is installed here. Quote clicks are not submitted leads. Once analytics and CRM attribution are authorized and connected, verify consent and delivery, then measure landing → tool → quote intent → qualified lead → booked job. Search Console alone cannot measure those steps.

## Growing the project library

The current cleaning entries describe only what the confirmed real photos show. No towns, customer problems, outcomes, prices or before/after claims were invented. Exact town and scope questions previously deferred by Louis remain optional until supplied.

AI workflow for the next job: use the approved photo plus Louis's supplied job notes (or a voice-note transcript), extract only confirmed facts, create a local draft, then integrate the reviewed story into the existing library. Reuse an example on a relevant service/city page only when its actual town and scope are verified. Do not create a thin page for every photo.

For a repeatable local draft, save JSON under ignored `seo-data/` with `service`, optional `town` plus `townConfirmed:true`, `photosApproved:true`, and `facts:[{"text":"An owner-confirmed statement","ownerConfirmed":true}]`. From the repository root run `node job-story.mjs seo-data/job.json seo-output/job-draft.html`. Review the original facts/photos before publication. This helper does not transcribe, auto-publish, or certify privacy; the output is deliberately local and ignored.

## Verification

Run `node --test --test-isolation=none homeowner-tools.test.mjs seo-measure.test.mjs`. Check all four pages at desktop and mobile widths, filter/search empty states, both design selections, both tools' outputs, copy fallback, internal anchors, image loading, JavaScript errors and unchanged existing forms. Do not send test leads. Verify the deployed files and `/lights/` after merging.

General gutter guidance source: [Snohomish County, Gutters and Downspouts](https://snohomishcountywa.gov/6944/117059/Gutters-and-Downspouts), reviewed September 26, 2026. General guidance is not a promise of a Trinity repair service or recurring package.

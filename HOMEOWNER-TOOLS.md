# Homeowner SEO tools

Four public entry points support lighting first and gutters second. Existing `/lights/`, its city pages, `/book/`, window and roof landing pages remain unchanged. The homepage has one new planning-links section, gutter cleaning has one related link, and the sitemap adds four URLs.

| Page | Purpose | Current content |
| --- | --- | --- |
| `/christmas-lighting-cost/` | Estimate lighting cost and build a quote brief | Approved ranges: $600 minimum; one story $5–$8/ft; two stories $7–$10/ft |
| `/christmas-lighting-ideas/` | Choose a reference design | Two owner-approved warm-white roofline project photos |
| `/projects/` | Search/filter real job proof | Two lighting projects and three owner-confirmed cleaning photos |
| `/gutter-help/` | Describe symptoms and discuss repeat maintenance | Ground-level observation prompts and county vegetation-based guidance |

## Pricing gate

Louis approved showing his saved rates on September 26, 2026. The lighting page's `budget-rules` JSON has `approved:true`, a $600 minimum, one-story rates of $5–$8/ft and two-story rates of $7–$10/ft, before any applicable tax. Standard-access rooflines only; unknown measurements/access receive a starting-price prompt, while three stories, difficult access and extras require a custom quote. The estimator shows the starting price on load and updates ranges and quote notes as inputs change. No roofline length is guessed. `/lights/` is unchanged.

The range engine still fails closed on missing/unapproved/invalid rules. Owner-editor exports remain drafts; approving this version does not preapprove future edits. Synthetic arithmetic tests are labeled TEST ONLY, and a separate test verifies the approved public rates and exclusions.

### Editable owner recommendations

Run `node lighting-pricing-editor.mjs` from the repository root to create `seo-output/lighting-pricing-editor.html`. Open the generated file in a browser. It is standalone and works offline. This output remains ignored; do not commit or publish it as an admin page. The source generator contains proposed market-based starting numbers, not approved customer prices.

The editor lets Louis adjust the minimum, one-story/two-story low and high rates, and scope text. It previews sample jobs using the same calculation function as the public tool, saves drafts in browser storage when available, imports/exports a versioned settings file, and downloads a portable copy of itself. Exports always use `approved:false`. No network request or publication happens from the editor. The HTML file contains no customer data or credentials; a local preview is not an authenticated admin interface.

Proposed defaults: $750 minimum, $6–$8/ft one story, $8–$10/ft two stories, before any applicable tax; difficult access, three-story work and extras require a custom quote. These are recommendations to validate against actual all-season costs, not a local average or a guarantee of profitability. Source links and reasoning are in the editor. No renewal discount is assumed.

To activate a chosen version, obtain Louis's explicit approval of its exact numbers and scope. Validate its saved `settings` with `validateSettings`, convert using `draftRules`, then set the approved date/flag only as part of that authorized branch/PR change to the lighting planner's inline `budget-rules`. Preserve `standardAccessOnly:true`; the new access field defaults to unknown, which cannot receive an automatic price under these rules. Verify the actual supported heights, bounds, minimum and custom-quote cases after deployment. Do not merely paste an arbitrary imported `rules` object or treat saving a draft as approval.

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

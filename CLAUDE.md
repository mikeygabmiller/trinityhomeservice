# Trinity Exterior Cleaning — site

Static site for a one-person exterior cleaning and holiday lighting business in
Snohomish County, WA. No build step, no framework, no dependencies. Each page is
a single self-contained HTML file with its CSS and JS inline.

GitHub Pages serves `main` from the repo root. `CNAME` points at
trinityexteriorco.com. **Merging to `main` publishes to the live site** — there is
no staging environment.

| Path | What it is |
|---|---|
| `index.html` | Homepage. Services, reviews, contact form. |
| `book/index.html` | `/book` — exterior cleaning quote landing page. |
| `lights/index.html` | `/lights` — holiday lighting landing page. Runs Google Ads traffic. |
| `stats.html` | Internal stats page, not linked from navigation. |

All three quote forms post to formsubmit.co. `/lights` also has Google Ads
conversion tracking wired up; the `send_to` values are filled in by hand in the
comment block at the top of that file.

---

## Rules

### 1. Only change the page I name

If I ask about `/lights`, change `lights/index.html` and nothing else. The three
pages share a visual language and a lot of copy patterns, which makes it tempting
to "fix" the same phrasing everywhere. Don't. A tweak that is right for a holiday
lighting landing page is often wrong for the cleaning pages, and vice versa.

If a change genuinely needs to touch another page, say so and wait. Do not bundle
it in.

"The site" in my prompt does not override the page I was clearly talking about.
Read the context, and if it is actually ambiguous, ask.

### 2. Verify service claims before putting them in copy

Do not write a claim about what the business does based on what another part of
the page already says. Existing copy is not a source of truth — some of it was
drafted speculatively and is wrong.

Anything about equipment, process, scheduling, inclusions, or guarantees: ask me
first. A wrong claim on a live lead-generation page is worse than a slow turnaround.

**Established facts** (safe to use):

- Owner-operated, Louis does the work himself
- Licensed, bonded and insured
- 5.0 on Google, 28 verified reviews — all for **cleaning** work, not lighting
- Phone/text 425-595-7758, louis@trinityexteriorco.com
- Snohomish County plus surrounding towns
- Holiday lighting: Trinity supplies commercial-grade LEDs, custom-cut, hung on
  clips (no nails or staples), mid-season repairs free, takedown and off-season
  storage included

**Known false — do not reintroduce:**

- Timers. Trinity does not supply them. A previous draft claimed "timers turn it
  on every night" and built a headline on it.

**Unverified — ask before using:**

- Total customer count. A `/book` draft claimed "hundreds of homeowners" against
  28 reviews. Do not use a number I have not given you.

### 3. Ship immediately

Do not wait for approval to publish. When the work is done:

1. Commit to the working branch
2. Push
3. Open the PR
4. Merge it
5. **Poll the live URL until the change actually appears, and verify it there**

Step 5 is not optional and is the reason this works. Since merging publishes
straight to production with no review gate, the deployed page is the only real
confirmation — check the live HTML, not the local file. If the deploy shows
something broken, fix it and ship again rather than reporting success.

Exception: if the change would take the site down or publish a claim covered by
rule 2, stop and ask instead.

---

## Voice

Plain, specific, and concrete. The test is whether a sentence could only have been
written by someone who does this work.

**Avoid:** "here to help with all your needs", "feel free to reach out",
"dedicated to assisting you", "the perfect solution", "peace of mind", "leap of
faith", "3 Easy Steps", "Proudly serving", "Absolutely", "crystal clear",
"like-new condition", "brought back to life", "state-of-the-art", stacked CTA
qualifiers ("free, no-obligation … zero pressure"), and heavy em-dash asides.

**Prefer:** what gets cleaned, what the clips do to the shingles, what the
guarantee actually covers, who shows up at the house. Say "call or text" rather
than "reach out". End a sentence with a period rather than an em-dash clause.

Review quotes may be **shortened** with an ellipsis but never reworded,
reordered, or added to. Rewriting a customer's published review needs their
sign-off; trimming one does not.

---

## Checking work before shipping

Nothing to build — serve the directory and look at it:

```
python3 -m http.server 8765        # then hit http://localhost:8765/lights/
```

Playwright is available (`NODE_PATH=/opt/node22/lib/node_modules`, chromium
pre-installed). Worth doing for any hero or layout change:

- Screenshot at 1280×900 and 390×844 at minimum
- On `/lights`, measure that the form's submit button stays above the fold at
  both sizes — that has been a repeated regression
- Check the console for JS errors

`index.html` has a pre-existing unclosed `<section>` before `</body>`. Browsers
auto-close it. Leave it alone unless fixing it is the task.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PROPERTY = 'https://trinityexteriorco.com/';
const grains = { property_daily: ['date'], page_daily: ['date', 'page'], query_page_daily: ['date', 'page', 'query'] };
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function validate(snapshot) {
  if (snapshot.property !== PROPERTY) throw Error('Unexpected Search Console property');
  if (!date(snapshot.date_from) || !date(snapshot.date_to) || snapshot.date_from > snapshot.date_to) throw Error('Invalid date range');
  if (!snapshot.captured_at || !Number.isFinite(Date.parse(snapshot.captured_at))) throw Error('Missing capture timestamp');
  for (const [grain, dimensions] of Object.entries(grains)) {
    if (!Array.isArray(snapshot[grain])) throw Error(`Missing ${grain}; use [] only for a successful empty response`);
    const seen = new Set();
    for (const row of snapshot[grain]) {
      if (!date(row.date) || row.date < snapshot.date_from || row.date > snapshot.date_to) throw Error(`Date outside range in ${grain}`);
      if (!number(row.clicks) || !number(row.impressions) || row.clicks > row.impressions) throw Error(`Invalid metrics in ${grain}`);
      if (row.impressions > 0 && (!number(row.position) || row.position < 1)) throw Error(`Missing average position in ${grain}`);
      for (const key of dimensions) if (typeof row[key] !== 'string' || !row[key]) throw Error(`Missing ${key} in ${grain}`);
      if (row.page && new URL(row.page).origin !== new URL(PROPERTY).origin) throw Error('Unexpected page origin');
      const key = JSON.stringify(dimensions.map(d => row[d]));
      if (seen.has(key)) throw Error(`Duplicate ${grain} row: ${key}`);
      seen.add(key);
    }
  }
  return snapshot;
}

export function aggregate(rows) {
  if (!rows.length) return { clicks: null, impressions: null, ctr: null, position: null, days: 0 };
  const clicks = rows.reduce((sum, r) => sum + r.clicks, 0);
  const impressions = rows.reduce((sum, r) => sum + r.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : null,
    position: impressions ? rows.reduce((sum, r) => sum + (r.impressions ? r.position * r.impressions : 0), 0) / impressions : null,
    days: new Set(rows.map(r => r.date)).size };
}

export function service(page) {
  const p = new URL(page).pathname;
  if (p === '/lights/' || p.startsWith('/lights/') || ['/christmas-lighting-cost/','/christmas-lighting-ideas/'].includes(p)) return 'Christmas lighting';
  if (p === '/gutter-cleaning/' || p === '/gutter-help/') return 'Gutters';
  if (p === '/window-cleaning/') return 'Windows';
  if (p === '/roof-cleaning/') return 'Roofs';
  return 'Shared / booking';
}

function group(rows, dimensions) {
  const map = new Map();
  for (const row of rows) {
    const key = JSON.stringify(dimensions.map(d => row[d]));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return [...map.values()].map(items => ({ ...Object.fromEntries(dimensions.map(d => [d, items[0][d]])), ...aggregate(items) }))
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
}

export function buildReport(snapshot) {
  validate(snapshot);
  return { property: snapshot.property, captured_at: snapshot.captured_at, date_from: snapshot.date_from, date_to: snapshot.date_to,
    totals: aggregate(snapshot.property_daily), daily: [...snapshot.property_daily].sort((a,b) => a.date.localeCompare(b.date)),
    pages: group(snapshot.page_daily, ['page']).map(r => ({ ...r, service: service(r.page) })),
    queries: group(snapshot.query_page_daily, ['query', 'page']).map(r => ({ ...r, service: service(r.page) })),
    sitemaps: (snapshot.sitemaps || []).filter(r => r.path),
    attribution: { status: 'Unavailable', qualified_leads: null, booked_revenue: null },
    notes: [
      'Property totals come only from property-level rows. Page impressions must not be summed into site totals.',
      'CTR is total clicks divided by impressions. Average position is weighted by impressions; it is not a local map rank.',
      'Missing dates, queries and pages remain unavailable. An empty query response is not zero search demand.',
      'Search Console can omit anonymized queries and detailed rows. Query tables are not a complete keyword census.',
      'No lighting or gutter opportunity is inferred from missing rows. Shared homepage/booking traffic is not assigned to a service.',
      'Lead and revenue attribution needs a verified source-to-lead-to-job link. A call click or form click is not a qualified lead.',
      'This is a dated snapshot. Refresh through the connected Search Console source; this file does not poll or run in the background.'
    ] };
}

const metric = (v, digits = 0) => v == null ? 'Unavailable' : Number(v).toLocaleString('en-US', { maximumFractionDigits: digits });
const percent = v => v == null ? 'Unavailable' : `${metric(v * 100, 2)}%`;
function table(headers, rows) {
  return `<div class="scroll"><table><thead><tr>${headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r=>`<tr>${r.map(c=>`<td>${escape(c)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}">No rows returned. Details unavailable.</td></tr>`}</tbody></table></div>`;
}

export function renderHTML(report) {
  const t = report.totals;
  const cards = [['Impressions', metric(t.impressions)], ['Clicks', metric(t.clicks)], ['Click-through rate', percent(t.ctr)], ['Average position', metric(t.position, 2)]];
  const services = ['Christmas lighting', 'Gutters', 'Windows', 'Roofs', 'Shared / booking'];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Trinity SEO measurement</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f4f6f9;color:#17263a;font:16px/1.55 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:38px 22px 60px}h1{font-size:clamp(28px,5vw,44px);line-height:1.15;margin:10px 0}h2{font-size:23px;margin-top:0}.eyebrow{font-weight:700;color:#546b83;letter-spacing:.08em;font-size:12px;text-transform:uppercase}.muted{color:#536375}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:28px 0}.card,section{border:1px solid #dbe1e8;background:#fff;border-radius:12px;padding:22px}.card strong{display:block;font-size:32px;margin-top:6px}section{margin-top:22px}.notice{border-left:4px solid #b17e14;background:#fff8e8;padding:16px 20px}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:12px 10px;text-align:left;border-bottom:1px solid #e3e7ed;vertical-align:top}td{overflow-wrap:anywhere;min-width:80px}th{color:#536375;white-space:nowrap}input,select{font:inherit;padding:10px;border:1px solid #aeb9c7;border-radius:6px;max-width:100%}.filters{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:18px}label{display:flex;flex-direction:column;gap:5px}.tag{display:inline-block;border-radius:20px;background:#e7eef7;padding:4px 12px;font-size:13px}li{margin:8px 0}@media(max-width:640px){main{padding:24px 14px}.cards{grid-template-columns:repeat(2,1fr)}.card,section{padding:16px}.card strong{font-size:25px}}@media print{body{background:white}.filters{display:none}section{break-inside:avoid}}
  </style></head><body><main><div class="eyebrow">Trinity Exterior Co. · Organic search</div><h1>SEO measurement</h1><p class="muted">Requested period: ${escape(report.date_from)} to ${escape(report.date_to)} · ${t.days} reported days.<br>Captured ${escape(report.captured_at)} · ${escape(report.property)}</p><span class="tag">Local snapshot · no live connection in this file</span><div class="cards">${cards.map(([label,value])=>`<div class="card">${label}<strong>${value}</strong></div>`).join('')}</div>
  <p class="notice">${t.impressions == null || t.impressions < 100 ? 'Early baseline: the available sample is too small for confident page or keyword priorities. ' : ''}Qualified organic leads and booked revenue: <b>unavailable</b>. Search clicks are not leads.</p>
  <section><h2>Site performance by day</h2>${table(['Date','Impressions','Clicks','CTR','Average position'], report.daily.map(r=>[r.date,metric(r.impressions),metric(r.clicks),percent(r.impressions ? r.clicks/r.impressions : null),metric(r.position,2)]))}</section>
  <section id="pages"><h2>Landing pages</h2><p class="muted">Page-level data. These impressions can overlap across pages and do not add up to the site total.</p><div class="filters"><label>Service<select id="service"><option value="">All services</option>${services.map(s=>`<option>${s}</option>`).join('')}</select></label></div>${table(['Page','Service','Impressions','Clicks','CTR','Average position'],report.pages.map(r=>[r.page,r.service,metric(r.impressions),metric(r.clicks),percent(r.ctr),metric(r.position,2)]))}<p id="page-empty" hidden>No reported pages match this service. This is not proof of zero traffic or missing indexing.</p></section>
  <section id="queries"><h2>Queries and pages</h2><label>Find a query or page<input id="query" type="search" placeholder="Search the available rows"></label>${table(['Query','Page','Service','Impressions','Clicks','CTR','Average position'],report.queries.map(r=>[r.query,r.page,r.service,metric(r.impressions),metric(r.clicks),percent(r.ctr),metric(r.position,2)]))}<p id="query-empty" hidden>No matching reported queries.</p></section>
  <section><h2>Sitemap health</h2>${table(['Sitemap','Submitted URLs','Errors','Warnings','Last downloaded'],report.sitemaps.map(r=>[r.path,metric(r.submitted),metric(r.errors),metric(r.warnings),r.last_downloaded || 'Unavailable']))}<p class="muted">Submitted URLs are not an indexed-page count. Use Google URL Inspection for indexing evidence.</p></section>
  <section><h2>How to read this</h2><ul>${report.notes.map(n=>`<li>${escape(n)}</li>`).join('')}</ul></section></main><script>
  document.getElementById('service').addEventListener('change',function(){let count=0;document.querySelectorAll('#pages tbody tr').forEach(row=>{const cells=row.querySelectorAll('td');row.hidden=cells.length>1&&this.value&&cells[1].textContent!==this.value;if(!row.hidden)count++});document.getElementById('page-empty').hidden=count>0});
  document.getElementById('query').addEventListener('input',function(){let count=0;const term=this.value.toLowerCase();document.querySelectorAll('#queries tbody tr').forEach(row=>{row.hidden=!row.textContent.toLowerCase().includes(term);if(!row.hidden)count++});document.getElementById('query-empty').hidden=count>0});
  </script></body></html>`;
}

function csv(rows, columns) {
  const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, m => "'" + m).replace(/"/g,'""') + '"';
  return [columns, ...rows.map(row=>columns.map(c=>row[c]))].map(row=>row.map(cell).join(',')).join('\r\n') + '\r\n';
}

export function writeReport(snapshot, outputDir) {
  const report = buildReport(snapshot);
  fs.mkdirSync(outputDir, {recursive:true});
  fs.writeFileSync(path.join(outputDir,'dashboard.html'), renderHTML(report));
  fs.writeFileSync(path.join(outputDir,'summary.json'), JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(outputDir,'pages.csv'), csv(report.pages,['page','service','impressions','clicks','ctr','position','days']));
  fs.writeFileSync(path.join(outputDir,'queries.csv'), csv(report.queries,['query','page','service','impressions','clicks','ctr','position','days']));
  fs.writeFileSync(path.join(outputDir,'daily.csv'), csv(report.daily,['date','impressions','clicks','ctr','position']));
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [input, out] = process.argv.slice(2);
    if (!input || !out) throw Error('Usage: node seo-measure.mjs <snapshot.json> <private-output-directory>');
    const report = writeReport(JSON.parse(fs.readFileSync(input,'utf8')), out);
    console.log(JSON.stringify({output:path.resolve(out),totals:report.totals,pages:report.pages.length,queryPages:report.queries.length}));
  } catch(error) { console.error(error.message); process.exitCode=1; }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, buildReport, renderHTML, validate } from './seo-measure.mjs';

const row = (date, impressions, clicks, position) => ({date, impressions, clicks, position});
const snapshot = () => ({property:'https://trinityexteriorco.com/',captured_at:'2026-09-26T00:00:00Z',date_from:'2026-09-01',date_to:'2026-09-25',property_daily:[row('2026-09-22',2,0,1.5),row('2026-09-23',7,1,1.8571)],page_daily:[],query_page_daily:[]});

test('weights average position and recomputes CTR from totals',()=>{
  const result=aggregate([row('2026-09-22',1,1,1),row('2026-09-23',9,0,10)]);
  assert.equal(result.ctr,.1);assert.equal(result.position,9.1);
});
test('empty responses remain unavailable while actual zero rows stay zero',()=>{
  assert.equal(aggregate([]).impressions,null);
  assert.equal(aggregate([row('2026-09-22',0,0,null)]).impressions,0);
  assert.equal(aggregate([row('2026-09-22',0,0,null)]).position,null);
});
test('page overlap cannot inflate property totals or invent service attribution',()=>{
  const data=snapshot();
  data.page_daily=[{...row('2026-09-23',7,1,2),page:data.property},{...row('2026-09-23',7,0,2),page:data.property+'book/'}];
  const report=buildReport(data);
  assert.equal(report.totals.impressions,9);assert.equal(report.pages.reduce((s,r)=>s+r.impressions,0),14);
  assert.equal(report.pages[0].service,'Shared / booking');assert.equal(report.attribution.booked_revenue,null);
});
test('rejects duplicate rows, wrong accounts, out-of-window rows and missing grains',()=>{
  let data=snapshot();data.property_daily.push(data.property_daily[0]);assert.throws(()=>validate(data),/Duplicate/);
  data=snapshot();data.property='https://example.com/';assert.throws(()=>validate(data),/property/);
  data=snapshot();data.property_daily[0].date='2026-08-31';assert.throws(()=>validate(data),/outside/);
  data=snapshot();delete data.query_page_daily;assert.throws(()=>validate(data),/Missing/);
  data=snapshot();data.property_daily[0].clicks=null;assert.throws(()=>validate(data),/metrics/);
});
test('query/page groups keep distinct pages and escape imported HTML',()=>{
  const data=snapshot();
  data.query_page_daily=[{...row('2026-09-22',2,0,5),query:'<script>alert(1)</script>',page:data.property+'lights/'},{...row('2026-09-22',2,0,4),query:'<script>alert(1)</script>',page:data.property+'lights/monroe/'}];
  const report=buildReport(data);assert.equal(report.queries.length,2);assert.equal(report.queries[0].service,'Christmas lighting');
  const html=renderHTML(report);assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes('<script>alert(1)</script>'));
});

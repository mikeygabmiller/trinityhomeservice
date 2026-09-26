import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {estimateBudget,gutterPlan,lightingPriceDisplay} from './homeowner-tools.mjs';
import {service} from './seo-measure.mjs';
import {draftStory} from './job-story.mjs';
// Synthetic numbers ONLY for arithmetic tests; these are not Trinity prices.
const rules={approved:true,approvedOn:'2026-09-26',currency:'USD',scope:'TEST ONLY',minimum:50,rates:{one:{low:2,high:3}}};
test('unapproved or incomplete prices never produce a range',()=>{
  assert.equal(estimateBudget({stories:'one',feet:100},{...rules,approved:false}),null);
  assert.equal(estimateBudget({stories:'one',feet:100},{...rules,minimum:null}),null);
  assert.equal(estimateBudget({stories:'one',feet:100},{...rules,rates:{one:{low:5,high:2}}}),null);
  const html=fs.readFileSync(new URL('./christmas-lighting-cost/index.html',import.meta.url),'utf8');
  const liveRules=JSON.parse(html.match(/id="budget-rules">([^<]+)</)[1]);
  assert.equal(estimateBudget({stories:'one story',feet:100,access:'standard'},{...liveRules,approved:false}),null);
});
test('published owner-approved prices honor the floor, rates and custom-quote exclusions',()=>{
  const html=fs.readFileSync(new URL('./christmas-lighting-cost/index.html',import.meta.url),'utf8');
  const published=JSON.parse(html.match(/id="budget-rules">([^<]+)</)[1]);
  assert.equal(published.approved,true);assert.equal(published.minimum,600);
  const input={stories:'one story',feet:150,access:'standard'};
  assert.equal(lightingPriceDisplay(input,published).amount,'$750–$1,200');
  assert.equal(lightingPriceDisplay({...input,stories:'two stories'},published).amount,'$1,050–$1,500');
  assert.equal(lightingPriceDisplay({...input,feet:50},published).amount,'$600');
  assert.equal(lightingPriceDisplay({...input,feet:''},published).amount,'From $600');
  assert.equal(lightingPriceDisplay({...input,access:'unknown'},published).estimate,null);
  assert.equal(lightingPriceDisplay({...input,access:'custom'},published).amount,'Custom quote');
  assert.equal(lightingPriceDisplay({...input,stories:'three or more stories'},published).estimate,null);
});
test('range arithmetic respects minimums and rejects unknown or invalid footage',()=>{
  assert.deepEqual(estimateBudget({stories:'one',feet:100},rules),{low:200,high:300,scope:'TEST ONLY'});
  assert.equal(estimateBudget({stories:'one',feet:10},rules).low,50);
  for(const feet of ['',0,-1,'bad',Infinity,1001])assert.equal(estimateBudget({stories:'one',feet},rules),null);
  assert.equal(estimateBudget({stories:'unknown',feet:100},rules),null);
});
test('every gutter combination yields a useful plan; invalid inputs fail',()=>{
  for(const s of ['overflow','behind','corner','debris','unsure'])for(const t of ['evergreen','deciduous','mixed','few'])for(const g of ['yes','no','unknown']){
    const plan=gutterPlan(s,t,g);assert.ok(plan.observation.length>60);assert.ok(plan.timing.length>60);assert.ok(plan.summary.includes('Gutter guards:'));
  }
  assert.throws(()=>gutterPlan('broken','evergreen','no'));
  assert.match(gutterPlan('behind','evergreen','yes').observation,/roofing professional/);
});
test('new service tools flow into correct measurement groups',()=>{
  const base='https://trinityexteriorco.com';
  assert.equal(service(base+'/christmas-lighting-cost/'),'Christmas lighting');
  assert.equal(service(base+'/christmas-lighting-ideas/'),'Christmas lighting');
  assert.equal(service(base+'/gutter-help/'),'Gutters');
  assert.equal(service(base+'/projects/'),'Shared / booking');
});
test('job drafts reject unconfirmed facts and locations and escape supplied copy',()=>{
  const input={service:'Christmas lighting',photosApproved:true,facts:[{text:'<script>unsafe</script>',ownerConfirmed:true}]};
  assert.match(draftStory(input),/&lt;script&gt;/);
  assert.throws(()=>draftStory({...input,photosApproved:false}));
  assert.throws(()=>draftStory({...input,town:'Snohomish'}));
  assert.throws(()=>draftStory({...input,facts:[{text:'Unconfirmed result'}]}));
});

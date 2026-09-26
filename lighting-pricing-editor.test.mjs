import test from 'node:test';
import assert from 'node:assert/strict';
import {recommended,validateSettings,draftRules,previewEstimate,renderEditor} from './lighting-pricing-editor.mjs';
import {estimateBudget} from './homeowner-tools.mjs';
test('recommendations and exported edits never activate website prices',()=>{
  const draft=draftRules(recommended);assert.equal(draft.approved,false);assert.equal(draft.approvedOn,null);
  assert.equal(estimateBudget({feet:150,stories:'one story'},draft),null);
  assert.equal(draftRules({...recommended,minimum:900}).minimum,900);
});
test('preview uses same minimum and rate math as the public calculator',()=>{
  assert.equal(previewEstimate(recommended,75,'one story').low,750);
  assert.equal(previewEstimate(recommended,75,'one story').high,750);
  assert.equal(previewEstimate(recommended,150,'one story').low,900);
  assert.equal(previewEstimate(recommended,150,'two stories').high,1500);
  assert.equal(previewEstimate({...recommended,minimum:1100},100,'one story').high,1100);
});
test('unknown footage or unsupported access does not produce an estimate',()=>{
  for(const feet of ['',0,-1,NaN,1001])assert.equal(previewEstimate(recommended,feet,'one story'),null);
  assert.equal(previewEstimate(recommended,150,'three stories'),null);
  assert.equal(previewEstimate(recommended,150,'one story','custom'),null);
  const approved={...draftRules(recommended),approved:true,approvedOn:'2026-09-26'};
  assert.equal(estimateBudget({feet:150,stories:'one story'},approved),null);
  assert.equal(estimateBudget({feet:150,stories:'one story',access:'unknown'},approved),null);
  assert.equal(estimateBudget({feet:150,stories:'one story',access:'standard'},approved).low,900);
});
test('invalid or reversed settings are rejected instead of retained silently',()=>{
  for(const value of [null,NaN,Infinity,'750',-1,0])assert.throws(()=>validateSettings({...recommended,minimum:value}));
  assert.throws(()=>validateSettings({...recommended,oneLow:12,oneHigh:6}));
  assert.throws(()=>validateSettings({...recommended,scope:''}));
  assert.equal(validateSettings({...recommended,minimum:750.125}).minimum,750.13);
});
test('HTML export embeds copy safely and carries no network or publication action',()=>{
  const html=renderEditor({...recommended,scope:'</script><script>bad()</script>'});
  assert.ok(!html.includes('</script><script>bad()'));
  assert.ok(html.includes('\\u003c/script\\u003e'));
  assert.ok(!html.includes('fetch('));assert.ok(!html.includes('XMLHttpRequest'));
  assert.ok(html.includes('Draft · not published'));
});

// Creates a portable owner-only draft editor in ignored seo-output/. It does not
// send requests, change the website, or turn recommendations into approved prices.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {estimateBudget} from './homeowner-tools.mjs';

export const recommended = {
  minimum:750, oneLow:6, oneHigh:8, twoLow:8, twoHigh:10,
  scope:'Proposed seasonal roofline lighting range before any applicable tax. Includes supplied commercial-grade LEDs, custom cutting, clip installation, mid-season repairs, takedown and off-season storage. Standard access only; trees, wreaths, other decorations, steep or difficult access and three-story work require a separate quote. Final price follows a property-specific assessment.'
};
export function validateSettings(value) {
  if(!value || typeof value!=='object')throw Error('Open a saved pricing settings file.');
  const clean={};
  for(const key of ['minimum','oneLow','oneHigh','twoLow','twoHigh']){
    const n=value[key];
    if(typeof n!=='number'||!Number.isFinite(n)||n<=0||n>(key==='minimum'?50000:100))throw Error('Enter positive prices: minimum up to $50,000; rates up to $100 per foot.');
    clean[key]=Math.round(n*100)/100;
  }
  if(clean.oneLow>clean.oneHigh||clean.twoLow>clean.twoHigh)throw Error('Each low rate must be no higher than its high rate.');
  if(typeof value.scope!=='string'||!value.scope.trim()||value.scope.length>1800)throw Error('Include a scope note of 1–1,800 characters.');
  clean.scope=value.scope.trim();return clean;
}
export function draftRules(value) {
  const s=validateSettings(value);
  return {approved:false,approvedOn:null,currency:'USD',standardAccessOnly:true,minimum:s.minimum,scope:s.scope,rates:{'one story':{low:s.oneLow,high:s.oneHigh},'two stories':{low:s.twoLow,high:s.twoHigh}}};
}
export function previewEstimate(value,feet,stories,access='standard') {
  if(access!=='standard'||!['one story','two stories'].includes(stories))return null;
  // Approval is a calculation-only flag in this local preview; every export stays
  // unapproved. Nothing produced here is automatically installed on the website.
  return estimateBudget({feet,stories,access},{...draftRules(value),approved:true,approvedOn:'preview-only'});
}
const embed=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
export function renderEditor(initial=recommended) {
  const clean=validateSettings(initial);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Trinity lighting pricing — owner draft</title>
<style>
:root{--ink:#17223a;--blue:#2e3eb0;--muted:#556078;--line:#dce2ee;--soft:#f4f6fb;--gold:#ffb400}*{box-sizing:border-box}body{margin:0;background:var(--soft);color:var(--ink);font:16px/1.55 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:36px 24px 60px}h1{font-size:clamp(30px,4vw,46px);line-height:1.1;margin:12px 0 16px;letter-spacing:-.03em}h2{font-size:23px;margin:0 0 18px;line-height:1.2}h3{font-size:18px;margin:24px 0 12px}p{margin:0 0 16px}.eyebrow{font-size:12px;letter-spacing:.12em;font-weight:800;text-transform:uppercase;color:var(--blue)}.intro{max-width:800px;color:var(--muted)}.badge{display:inline-block;background:#fff0ca;color:#634606;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:750}.layout{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;margin:26px 0}.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:28px}.preview{border-top:5px solid var(--gold)}.fields{display:grid;grid-template-columns:1fr 1fr;gap:18px}.full{grid-column:1/-1}label{display:block;font-weight:700;font-size:14px}label span{display:block;font-weight:400;color:var(--muted);font-size:13px;margin-top:5px}input,select,textarea{font:inherit;border:1px solid #a4afc3;border-radius:7px;background:#fff;color:var(--ink);width:100%;margin-top:7px;padding:10px 12px;min-height:46px}textarea{resize:vertical;font-size:14px;line-height:1.5}.rate-title{font-weight:800;font-size:16px;border-top:1px solid var(--line);padding-top:18px;margin-top:4px}.range{font-size:clamp(29px,4vw,43px);font-weight:800;letter-spacing:-.02em;margin:22px 0 4px;color:#1a2360}.hint{font-size:13px;color:var(--muted)}.notice{background:#fff8e7;border-left:4px solid var(--gold);padding:13px 16px;margin:18px 0;font-size:14px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}button,.file-button{font:inherit;font-weight:700;background:white;border:1px solid #b5bfd0;color:var(--ink);border-radius:7px;padding:10px 14px;min-height:44px;cursor:pointer;text-decoration:none;display:inline-block}button.primary{color:#fff;background:var(--blue);border-color:var(--blue)}button:disabled{opacity:.5;cursor:not-allowed}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--gold);outline-offset:3px}a{color:var(--blue)}.status{font-size:13px;color:var(--muted);min-height:21px;margin:12px 0 0}.error{color:#9b231e;font-weight:700}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:11px 8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}th{font-size:12px;color:var(--muted)}.preview-note{font-size:14px;color:var(--muted)}details{margin-top:20px}summary{font-weight:750;cursor:pointer}details p{margin-top:12px}.sources{margin-top:22px;color:var(--muted);font-size:14px}.sources li{margin:10px 0}.small{font-size:13px}.readonly{background:#f8f9fd}.footer{font-size:13px;color:var(--muted);margin-top:24px}[hidden]{display:none!important}@media(max-width:780px){main{padding:24px 16px}.layout{grid-template-columns:1fr}.card{padding:22px}}@media(max-width:420px){.fields{gap:13px}.actions button{width:100%}.card{padding:18px}.range{font-size:32px}}@media print{body{background:white}.actions,.status,#import-file{display:none}.layout{display:block}.card{margin:16px 0;break-inside:avoid}}
</style></head><body><main>
<span class="eyebrow">Trinity Exterior Co. · Owner pricing controls</span><h1>Set your lighting numbers.</h1><p class="intro">Adjust the proposed rates and see the effect on example jobs. Changes here are drafts for your review; they do not change customer-facing prices.</p><span class="badge">Draft · not published</span>
<div class="layout"><section class="card"><h2>Your pricing controls</h2><form id="settings"><div class="fields">
<label class="full">Minimum job price ($)<input id="minimum" type="number" min="0.01" max="50000" step="0.01" required><span>Applied to both ends of the range, including small jobs.</span></label>
<div class="rate-title full">One story · standard access</div><label>Low rate ($ / foot)<input id="oneLow" type="number" min="0.01" max="100" step="0.25" required></label><label>High rate ($ / foot)<input id="oneHigh" type="number" min="0.01" max="100" step="0.25" required></label>
<div class="rate-title full">Two stories · standard access</div><label>Low rate ($ / foot)<input id="twoLow" type="number" min="0.01" max="100" step="0.25" required></label><label>High rate ($ / foot)<input id="twoHigh" type="number" min="0.01" max="100" step="0.25" required></label>
<label class="full">Scope shown with the estimate<textarea id="scope" rows="7" maxlength="1800" required></textarea><span>Edit the wording as needed. Any new service promise also needs your approval before publication.</span></label></div></form>
<p id="validation" class="status error" role="alert"></p><p id="saved" class="status" role="status"></p>
<div class="actions"><button id="copy" class="primary" type="button">Copy my numbers</button><button id="download" type="button">Save settings file</button><button id="portable" type="button">Save this editor</button><button id="import" type="button">Load saved settings</button><button id="reset" type="button">Restore recommendations</button></div><input id="import-file" type="file" accept=".json,application/json" hidden><p id="action-status" class="status" role="status"></p>
<label id="copy-fallback" hidden class="full">Select and copy your numbers<textarea id="copy-text" rows="7" readonly></textarea></label>
<p class="hint" style="margin-top:18px">Edits save in this browser when local storage is available. Save a settings file or a copy of this editor to keep a portable backup.</p></section>
<div><section class="card preview"><h2>Try a job</h2><div class="fields"><label>Roofline length (feet)<input id="feet" type="number" min="1" max="1000" step="1" value="150"></label><label>Home height<select id="stories"><option value="one story">One story</option><option value="two stories">Two stories</option><option value="three stories">Three or more stories</option><option value="unknown">Unknown</option></select></label><label class="full">Access and scope<select id="access"><option value="standard">Standard roofline access</option><option value="custom">Steep / difficult access / added decorations</option></select></label></div><div aria-live="polite"><p id="range" class="range"></p><p id="range-note" class="preview-note"></p></div><p class="notice">Sample budget before any applicable tax. No automatic price for difficult access, extra decorations or three-story work.</p><p class="hint">Use feet of roof edge being lit, not home floor area. The range uses your minimum or footage × rate, whichever is higher.</p></section>
<section class="card" style="margin-top:24px"><h2>What these numbers produce</h2><div class="scroll"><table><thead><tr><th scope="col">Roofline</th><th scope="col">One story</th><th scope="col">Two stories</th></tr></thead><tbody id="examples"></tbody></table></div><p class="hint" style="margin-top:14px">Illustrative roofline lengths, not promises that a house style contains a particular amount of lighting.</p></section></div></div>
<section class="card"><h2>Why start here?</h2><p>Start with a $750 minimum, $6–$8 per foot for straightforward one-story work and $8–$10 for two-story work. This is a proposed full-season roofline model, not a measured local market average or a profit guarantee.</p><p>The minimum helps allow for travel, setup, removal, storage and service visits. The two-story band is a proposed allowance for added access effort. Review your actual material cost and all-season labor on early jobs before tightening the ranges.</p><p>Keep returning-customer discounts and trees, wreaths or other extras outside the automatic calculator until you choose their pricing. Do not carry another installer’s inclusions into Trinity’s offer.</p>
<div class="sources"><strong>Advertised market references · checked September 26, 2026</strong><ul><li><a href="https://majesticwashnorthwest.com/services/christmas-light-installation" target="_blank" rel="noopener noreferrer">Majestic Wash Northwest, Snohomish County</a>: $450–$900 for a single-story roofline; $900–$1,600 for a two-story front elevation. Their scope includes the season’s service.</li><li><a href="https://christmasnw.com/blog/how-much-does-christmas-light-installation-cost" target="_blank" rel="noopener noreferrer">Christmas Northwest, Greater Seattle</a>: straightforward roofline projects start around $800; access and scope affect the quote.</li></ul><p>These are individual companies’ advertised offers, with different scopes. The per-foot recommendations above are our proposed starting model, not rates attributed to either competitor.</p></div>
<details><summary>How to put your chosen numbers on the website</summary><p>Click “Copy my numbers” and paste them into this conversation, or attach the saved settings file. Tell me when you want that exact version published. I can then apply it through the normal site update and verify the live calculator. Editing or downloading here does not approve or publish anything.</p><p>The existing /lights/ page and its printed QR destination stay unchanged. The public lighting planner continues to request a property-specific quote until you approve a price version.</p></details></section>
<p class="footer">Local owner worksheet · no network requests, customer submissions or website write access.</p>
<script id="seed" type="application/json">${embed(clean)}</script><script id="recommendations" type="application/json">${embed(recommended)}</script>
<script>
const estimateBudget=${estimateBudget.toString()};
const validateSettings=${validateSettings.toString()};
const draftRules=${draftRules.toString()};
const previewEstimate=${previewEstimate.toString()};
const fields=['minimum','oneLow','oneHigh','twoLow','twoHigh','scope'];
const key='trinity-lighting-pricing-draft-v1';
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const format=result=>result.low===result.high ? money(result.low) : money(result.low)+'–'+money(result.high);
const byId=id=>document.getElementById(id);
let state=validateSettings(JSON.parse(byId('seed').textContent));
let valid=true;
const original=validateSettings(JSON.parse(byId('recommendations').textContent));
function populate(value){fields.forEach(id=>byId(id).value=value[id]);}
function values(){return Object.fromEntries(fields.map(id=>[id,id==='scope'?byId(id).value:(byId(id).value.trim()===''?NaN:Number(byId(id).value))]));}
function exportData(){return {version:1,kind:'trinity-lighting-pricing-draft',savedAt:new Date().toISOString(),settings:state,rules:draftRules(state)};}
function refresh(persist=true){
  byId('action-status').textContent='';byId('copy-fallback').hidden=true;
  try{state=validateSettings(values());valid=true;byId('validation').textContent='';}
  catch(e){valid=false;byId('validation').textContent=e.message;}
  ['copy','download','portable'].forEach(id=>byId(id).disabled=!valid);
  if(!valid){byId('range').textContent='Check your numbers';byId('range-note').textContent='The preview and exports are paused until the settings are valid.';byId('examples').replaceChildren();byId('saved').textContent='Invalid changes have not been saved.';return;}
  if(persist){try{localStorage.setItem(key,JSON.stringify(exportData()));byId('saved').textContent='Draft saved in this browser. Website unchanged.';}catch{byId('saved').textContent='Browser storage is unavailable. Use Save settings file or Save this editor to keep your changes.';}}
  const feet=byId('feet').value,stories=byId('stories').value,access=byId('access').value;
  const result=previewEstimate(state,feet,stories,access);
  byId('range').textContent=result?format(result):'Custom quote';
  byId('range-note').textContent=result?'Draft range for '+feet+' feet · '+stories+'. Final scope and access need confirmation.':'Use a property-specific quote for unknown measurements, difficult access, extra decorations or unsupported home heights.';
  byId('examples').replaceChildren();
  for(const length of [75,100,150,200,250]){const tr=document.createElement('tr');for(const text of [length+' ft',format(previewEstimate(state,length,'one story')),format(previewEstimate(state,length,'two stories'))]){const td=document.createElement('td');td.textContent=text;tr.append(td);}byId('examples').append(tr);}
}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function human(){return 'Trinity lighting pricing DRAFT — not yet approved for publication\\nMinimum: '+money(state.minimum)+'\\nOne story: $'+state.oneLow+'–$'+state.oneHigh+' per foot\\nTwo stories: $'+state.twoLow+'–$'+state.twoHigh+' per foot\\nThree stories / difficult access / extras: custom quote\\nScope: '+state.scope;}
populate(state);
try{const saved=localStorage.getItem(key);if(saved){const record=JSON.parse(saved);if(record.version===1&&record.kind==='trinity-lighting-pricing-draft'){state=validateSettings(record.settings);populate(state);byId('saved').textContent='Restored your last saved browser draft. Website unchanged.';}}}catch{byId('saved').textContent='Using the saved editor defaults. Browser storage is unavailable or the old draft could not be read.';}
refresh(false);
byId('settings').addEventListener('submit',e=>e.preventDefault());
fields.forEach(id=>byId(id).addEventListener('input',()=>refresh()));
['feet','stories','access'].forEach(id=>byId(id).addEventListener('input',()=>refresh(false)));
byId('copy').addEventListener('click',async()=>{if(!valid)return;try{await navigator.clipboard.writeText(human());byId('action-status').textContent='Numbers copied. Paste them into the conversation for review or approval.';}catch{byId('copy-fallback').hidden=false;byId('copy-text').value=human();byId('copy-text').focus();byId('copy-text').select();byId('action-status').textContent='Copy the selected numbers below.';}});
byId('download').addEventListener('click',()=>{if(valid){download('trinity-lighting-pricing-draft.json',JSON.stringify(exportData(),null,2),'application/json');byId('action-status').textContent='Settings download requested. Nothing was published. If your browser does not save it, use Copy my numbers.';}});
byId('portable').addEventListener('click',()=>{if(!valid)return;const copy=document.documentElement.cloneNode(true);copy.querySelector('#seed').textContent=JSON.stringify(state).replace(/</g,'\\u003c');download('trinity-lighting-pricing-editor.html','<!doctype html>\\n'+copy.outerHTML,'text/html');byId('action-status').textContent='Editor download requested with these defaults. Browser drafts still take priority on the same device.';});
byId('import').addEventListener('click',()=>byId('import-file').click());
byId('import-file').addEventListener('change',async()=>{const file=byId('import-file').files[0];if(!file)return;try{if(file.size>50000)throw Error('Settings file is too large.');const data=JSON.parse(await file.text());if(data.version!==1||data.kind!=='trinity-lighting-pricing-draft')throw Error('Choose a Trinity pricing settings file.');const next=validateSettings(data.settings);populate(next);refresh();byId('action-status').textContent='Draft settings loaded. Website unchanged.';}catch(e){byId('action-status').textContent='Could not load settings: '+e.message;}byId('import-file').value='';});
byId('reset').addEventListener('click',()=>{populate(original);refresh();byId('action-status').textContent='Recommended starting numbers restored.';});
</script></main></body></html>`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{const target=path.resolve(process.argv[2]||'seo-output/lighting-pricing-editor.html');if(!target.startsWith(path.resolve('seo-output')+path.sep))throw Error('Save the private editor under ignored seo-output/.');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,renderEditor());console.log(target);}catch(e){console.error(e.message);process.exitCode=1;}
}

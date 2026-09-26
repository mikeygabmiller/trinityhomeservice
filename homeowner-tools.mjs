// No personal data, network requests, or persistent storage. These events need an
// explicitly configured analytics listener before they can be reported centrally.
export function estimateBudget(input, rules) {
  if (!rules || rules.approved !== true || !rules.approvedOn || !rules.scope || rules.currency !== 'USD') return null;
  const rate = rules.rates?.[input.stories];
  const feet = Number(input.feet);
  if (!Number.isFinite(feet) || feet < 1 || feet > 1000 || !rate) return null;
  if (![rate.low, rate.high, rules.minimum].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0) || rate.low <= 0 || rate.high < rate.low) return null;
  // Every submitted foot must represent the selected roofline. Extras and unknown
  // measurements are quoted individually; no house-size-to-footage guesses.
  return { low: Math.ceil(Math.max(rules.minimum, feet * rate.low)), high: Math.ceil(Math.max(rules.minimum, feet * rate.high)), scope: rules.scope };
}
export const maintenance = {
  evergreen: 'Evergreens nearby: plan a check before the rainy season and after storms that drop needles or branches. Base the next cleaning on what has accumulated.',
  deciduous: 'Leaf-shedding trees nearby: plan cleaning after the main late-fall leaf drop. Recheck if more debris falls or overflow returns.',
  mixed: 'Mixed trees: include a late-fall check after leaf drop, plus a check before the rainy season and after debris-dropping storms.',
  few: 'Few nearby trees: note when debris or overflow appears and use that history to discuss a suitable maintenance interval.'
};
const symptomLabels = { overflow:'Water spilling over the front', behind:'Water behind the gutter', corner:'One corner or downspout trouble spot', debris:'Leaves or needles returning', unsure:'Not sure / routine maintenance' };
export function gutterPlan(symptom, trees, guards) {
  if (!(symptom in symptomLabels) || !(trees in maintenance) || !['yes','no','unknown'].includes(guards)) throw Error('Select a valid gutter observation.');
  const observations = {
    overflow:'From the ground, note whether water spills along a whole run or at one point. Take a short rain-time video only if safe. Ask for the cause to be assessed; cleaning alone may not resolve every overflow.',
    behind:'Note where water passes behind the gutter and whether it appears at one point or along a run. Ask a gutter or roofing professional to assess it before assuming a cleaning will fix it.',
    corner:'Identify the corner, whether water is visible at the downspout outlet, and whether the issue happens in light or heavy rain. Do not open or dismantle drainage pipes to investigate.',
    debris:'Note the type of debris and how soon it returns after cleaning. That history is more useful for planning repeat visits than choosing an arbitrary calendar interval.',
    unsure:'From the ground, look for visible debris, overflow marks or water reaching an unwanted area. You do not need to diagnose anything to request a quote.'
  };
  return { observation:observations[symptom], timing:maintenance[trees], summary:`Gutter quote notes\nObservation: ${symptomLabels[symptom]}.\nNearby trees: ${trees === 'few' ? 'few or none' : trees}.\nGutter guards: ${guards === 'unknown' ? 'not sure' : guards}.\nPlease discuss the cause, cleaning scope and a suitable repeat-maintenance interval.\nI can add my town, number of stories, last cleaning date and safe ground-level photos when requesting the quote.` };
}

if (typeof document !== 'undefined') {
  const tool = document.body.dataset.tool;
  const event = (name, choice) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event:name, tool, ...(choice ? {choice} : {}) });
  };
  let started = false;
  const start=()=>{if(!started){event('seo_tool_start');started=true;}};
  document.querySelectorAll('form input,form select').forEach(el=>el.addEventListener('change',start));
  document.querySelectorAll('[data-filter],[data-look],form button[type="submit"]').forEach(el=>el.addEventListener('click',start));
  document.getElementById('project-search')?.addEventListener('input',start);
  document.querySelectorAll('[data-quote]').forEach(el=>el.addEventListener('click',()=>event('seo_quote_click',el.dataset.quote)));
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const target=document.getElementById(button.dataset.copy);
    const status=button.parentElement.nextElementSibling;
    try { await navigator.clipboard.writeText(target.value); status.textContent='Copied. Paste these notes into a text or email to Louis.'; }
    catch { target.focus(); target.select(); status.textContent='Select and copy the notes above, then paste them into a text or email to Louis.'; }
  }));
  document.querySelectorAll('[data-email-notes]').forEach(anchor=>anchor.addEventListener('click',()=>{
    anchor.href='mailto:louis@trinityexteriorco.com?subject='+encodeURIComponent('Trinity project quote request')+'&body='+encodeURIComponent(document.getElementById(anchor.dataset.emailNotes).value);
  }));
  const search=document.getElementById('project-search');
  let filter='all';
  const filterProjects=()=>{
    let count=0;const query=(search?.value || '').trim().toLowerCase();
    document.querySelectorAll('[data-project]').forEach(card=>{
      card.hidden=!(filter==='all'||card.dataset.service===filter)||!card.textContent.toLowerCase().includes(query);
      if(!card.hidden)count++;
    });
    const countEl=document.getElementById('project-count');
    if(countEl)countEl.textContent=count ? `${count} ${count===1?'project':'projects'} shown.` : 'No matching projects. Try another service or search term.';
  };
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    filterProjects();event('seo_tool_filter',filter);
  }));
  search?.addEventListener('input',filterProjects);
  document.querySelectorAll('[data-look]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-look]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.getElementById('look-notes').value=`Christmas lighting design request\nReference: ${button.dataset.look}.\nI like the warm-white roofline treatment in this example. Please discuss which roof edges and gables would work on my home.\nI can add a front-of-house photo and my town when requesting a quote.`;
    document.getElementById('look-result').hidden=false;event('seo_tool_result',button.dataset.look);
    document.getElementById('look-result').scrollIntoView({block:'nearest'});
  }));
  const gutter=document.getElementById('gutter-form');
  gutter?.addEventListener('submit',e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(gutter));
    const plan=gutterPlan(data.symptom,data.trees,data.guards);
    document.getElementById('observation').textContent=plan.observation;
    document.getElementById('timing').textContent=plan.timing;
    document.getElementById('gutter-notes').value=plan.summary;
    document.getElementById('gutter-result').hidden=false;event('seo_tool_result',data.symptom);
    document.getElementById('gutter-result').scrollIntoView({block:'nearest'});
  });
  const lighting=document.getElementById('lighting-form');
  lighting?.addEventListener('submit',e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(lighting));
    const rules=JSON.parse(document.getElementById('budget-rules').textContent);
    const estimate=estimateBudget(data,rules);
    const budget=document.getElementById('budget-result');
    budget.textContent=estimate ? `Planning range: $${estimate.low.toLocaleString('en-US')}–$${estimate.high.toLocaleString('en-US')}. ${estimate.scope} Final pricing follows a property-specific quote.` : 'Your plan is ready for a property-specific quote. Louis will confirm measurements, access and pricing.';
    document.getElementById('lighting-notes').value=`Christmas lighting quote notes\nHome: ${data.stories}.\nCoverage to discuss: ${data.coverage}.\nLook: ${data.look}.\nRoofline length: ${data.feet ? `${data.feet} feet (my estimate; please confirm)` : 'not measured'}.\n${estimate ? budget.textContent+'\n' : ''}Please confirm which roof edges are included and the final price. I can add my town and a front-of-house photo with my quote request.`;
    document.getElementById('lighting-result').hidden=false;event('seo_tool_result','lighting-plan');
    document.getElementById('lighting-result').scrollIntoView({block:'nearest'});
  });
  document.querySelectorAll('[data-enhanced]').forEach(el=>el.hidden=false);
}

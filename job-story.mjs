// Local-only drafting helper. Input and output belong in ignored seo-data/ and
// seo-output/. No upload, transcription, publishing or CRM connection is performed.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const services=new Set(['Christmas lighting','Gutter cleaning','Window cleaning','Roof cleaning']);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function draftStory(data) {
  if(!services.has(data.service))throw Error('Choose a supported service.');
  if(!Array.isArray(data.facts)||!data.facts.length)throw Error('Supply owner-confirmed facts.');
  if(data.facts.some(f=>typeof f.text!=='string'||!f.text.trim()||f.ownerConfirmed!==true))throw Error('Every fact needs explicit owner confirmation.');
  if(data.town && data.townConfirmed!==true)throw Error('Confirm the town or leave it blank.');
  if(data.photosApproved!==true)throw Error('Confirm permission to use the job photos.');
  const title=`${data.service}${data.town ? ` in ${data.town}` : ' project'}`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Local draft — ${escape(title)}</title><main><p>LOCAL DRAFT — REVIEW BEFORE PUBLICATION</p><h1>${escape(title)}</h1><ul>${data.facts.map(f=>`<li>${escape(f.text)}</li>`).join('')}</ul><h2>Publication review</h2><p>Check the original photos and facts. Remove customer names, exact addresses, identifying details and private quote amounts. Do not infer treatments, outcomes, towns or before/after comparisons from an image. Add approved public photos and a relevant service link before integrating the story into the existing project library.</p></main></html>\n`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  try{
    const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node job-story.mjs seo-data/job.json seo-output/job-draft.html');
    const out=path.resolve(output);const allowed=path.resolve('seo-output')+path.sep;
    if(!out.startsWith(allowed))throw Error('Keep drafts inside the ignored seo-output directory.');
    const draft=draftStory(JSON.parse(fs.readFileSync(input,'utf8')));fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,draft);console.log('Local draft created. Not published.');
  }catch(e){console.error(e.message);process.exitCode=1;}
}

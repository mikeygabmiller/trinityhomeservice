// This optional form submits only on an explicit request. No unload listeners,
// contact storage, customer auto-replies, or personal data in analytics events.
export function callbackPayload({name,phone,consent,notes,honey=''}) {
  if(honey)throw Error('Unable to submit this request. Please call Louis.');
  if(typeof name!=='string'||!name.trim()||name.trim().length>100)throw Error('Please enter your name.');
  if(typeof phone!=='string'||phone.length>30||!/^\+?[\d\s().-]+$/.test(phone.trim())||phone.replace(/\D/g,'').length<10||phone.replace(/\D/g,'').length>15)throw Error('Please enter a valid phone number, including the area code.');
  if(consent!==true)throw Error('Please confirm that Louis may contact you about this quote.');
  if(typeof notes!=='string'||!notes.trim()||notes.length>5000)throw Error('Please refresh your estimate before requesting a callback.');
  return {name:name.trim(),phone:phone.trim(),message:notes,contact_permission:'Please call or text me about this Christmas lighting quote.',source:'Christmas lighting estimator (/christmas-lighting-cost/)',_subject:'Christmas lighting estimator — callback request',_template:'table',_captcha:'false',_honey:''};
}
export async function sendCallback(input,fetcher=fetch) {
  const payload=callbackPayload(input);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetcher('https://formsubmit.co/ajax/louisroymiller@gmail.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    if(!response.ok)throw Error('Request not accepted');
    const result=await response.json();
    if(result.success!==true&&result.success!=='true')throw Error('Request not confirmed');
    return {accepted:true};
  }finally{clearTimeout(timeout);}
}
if(typeof document!=='undefined'){
  const form=document.getElementById('estimator-callback');
  if(form){
    let sending=false,submitted=false;
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(sending||submitted)return;
      const status=document.getElementById('callback-status');
      const button=form.querySelector('button[type="submit"]');
      const data=new FormData(form);
      const input={name:data.get('name'),phone:data.get('phone'),consent:data.get('contact_permission')==='yes',honey:data.get('_honey'),notes:document.getElementById('lighting-notes').value};
      try{callbackPayload(input);}catch(error){status.textContent=error.message;return;}
      sending=true;button.disabled=true;button.textContent='Sending request…';status.textContent='';
      try{
        await sendCallback(input);submitted=true;
        form.hidden=true;
        status.textContent='Request received. Louis can call or text you about this lighting quote. Your estimate details were included.';
        window.dataLayer=window.dataLayer||[];
        window.dataLayer.push({event:'seo_lead_accepted',tool:'lighting-planner',method:'callback-form'});
      }catch{
        status.textContent='We could not confirm your request. Please call or text 425-595-7758. If you already tried sending, mention that so Louis can check for it.';
      }finally{sending=false;if(!submitted){button.disabled=false;button.textContent='Request a callback';}}
    });
  }
}

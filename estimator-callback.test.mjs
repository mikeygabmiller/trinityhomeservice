import test from 'node:test';
import assert from 'node:assert/strict';
import {callbackPayload,sendCallback} from './estimator-callback.mjs';
const sample={name:'Test visitor',phone:'202-555-0104',consent:true,notes:'Synthetic quote notes — test fixture only.'};
test('callback payload includes explicit contact permission, phone and estimate snapshot',()=>{
  const data=callbackPayload(sample);
  assert.equal(data.phone,sample.phone);assert.equal(data.message,sample.notes);
  assert.match(data.contact_permission,/this Christmas lighting quote/);
  assert.ok(!Object.hasOwn(data,'_autoresponse'));
});
test('no request is sent for absent consent, invalid phone/name, missing notes or honeypot',async()=>{
  let calls=0;const never=()=>{calls++;throw Error('Unexpected network request');};
  for(const change of [{consent:false},{phone:'123'},{phone:'abc2025550104'},{name:''},{notes:''},{honey:'spam'}])await assert.rejects(sendCallback({...sample,...change},never));
  assert.equal(calls,0);
});
test('uses POST body, one request, and requires provider acceptance',async()=>{
  let calls=0;
  const fake=async(url,options)=>{
    calls++;assert.equal(url,'https://formsubmit.co/ajax/louisroymiller@gmail.com');
    assert.equal(options.method,'POST');assert.ok(!url.includes(sample.phone));
    assert.equal(JSON.parse(options.body).phone,sample.phone);
    return {ok:true,json:async()=>({success:'true'})};
  };
  assert.deepEqual(await sendCallback(sample,fake),{accepted:true});assert.equal(calls,1);
  for(const response of [{ok:false},{ok:true,json:async()=>({success:false})},{ok:true,json:async()=>({})},{ok:true,json:async()=>{throw Error('Not JSON');}}])await assert.rejects(sendCallback(sample,async()=>response));
  await assert.rejects(sendCallback(sample,async()=>{throw Error('Offline');}));
});

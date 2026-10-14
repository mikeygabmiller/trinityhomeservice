import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the shipped handlers with a deliberately small DOM and captured fetch.
// No test makes an HTTP request or creates a real lead/conversion.
const endpoint = 'https://formsubmit.co/ajax/louisroymiller@gmail.com';
const pages = [
  { name: 'Govee', path: 'govee-installation/', required: ['name', 'phone', 'city'] },
  { name: 'Holiday lights', path: 'lights/', required: ['name', 'phone'] },
].map(page => {
  const html = readFileSync(new URL(`${page.path}index.html`, import.meta.url), 'utf8');
  const source = page.path === 'lights/'
    ? html.slice(html.indexOf('/* ---- Lead form:'), html.indexOf('/* ---- Keep the mobile CTA'))
    : readFileSync(new URL(`${page.path}lead.js`, import.meta.url), 'utf8');
  assert.ok(source.includes("addEventListener('submit'"), `${page.name}: handler found`);
  return { ...page, html, source };
});

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1]] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

function element(overrides = {}) {
  const listeners = new Map();
  const classes = new Set();
  return {
    value: '', name: '', type: 'text', disabled: false, checked: false,
    required: false, hidden: false, style: {}, dataset: {}, textContent: '',
    className: '', validationMessage: '', focused: false, scrolled: false,
    classList: {
      add: value => classes.add(value),
      contains: value => classes.has(value),
      toggle(value, on) { if (on) classes.add(value); else classes.delete(value); },
    },
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    async emit(type, event = {}) {
      return Promise.all((listeners.get(type) ?? []).map(callback => callback(event)));
    },
    setCustomValidity(message) { this.validationMessage = message; },
    focus() { this.focused = true; },
    scrollIntoView() { this.scrolled = true; },
    ...overrides,
  };
}

function response(result = { success: true }, ok = true) {
  return { ok, json: async () => result };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness(page, options = {}) {
  const formMarkup = page.html.match(/<form\b[^>]*\bid="quoteForm"[^>]*>[\s\S]*?<\/form>/)?.[0];
  assert.ok(formMarkup, `${page.name}: actual form found`);
  const formAttrs = attributes(formMarkup.match(/<form\b[^>]*>/)[0]);
  const controls = [...formMarkup.matchAll(/<input\b[^>]*>/g)].map(([tag]) => {
    const attrs = attributes(tag);
    return element({ ...attrs, required: Object.hasOwn(attrs, 'required') });
  });
  const button = element({ textContent: formMarkup.match(/<button\b[^>]*>([\s\S]*?)<\/button>/)[1] });
  const originalButton = button.textContent;
  const status = element();
  const success = element();
  const form = element({ action: formAttrs.action });
  form.appendChild = control => controls.push(control);
  form.querySelectorAll = selector => {
    if (selector === '[required]') return controls.filter(control => control.required);
    if (selector === 'input') return controls;
    throw new Error(`Unhandled form selector: ${selector}`);
  };
  form.querySelector = selector => {
    if (selector.startsWith('button')) return button;
    const name = selector.match(/\[name=["']([^"']+)["']\]/)?.[1];
    if (name) return controls.find(control => control.name === name) ?? null;
    throw new Error(`Unhandled form selector: ${selector}`);
  };
  form.reportValidity = () => {
    const invalid = controls.find(control => control.validationMessage || (control.required && !control.value));
    if (invalid) invalid.focus();
    return !invalid;
  };
  const field = name => controls.find(control => control.name === name);
  for (const [name, value] of Object.entries({ name: 'Taylor Test', phone: '425-555-0100', city: 'Bothell' })) {
    if (field(name)) field(name).value = value;
  }
  class CapturedFormData extends FormData {
    constructor(sourceForm) {
      super();
      assert.equal(sourceForm, form);
      for (const control of controls) {
        if (!control.name || control.disabled || (control.type === 'checkbox' && !control.checked)) continue;
        this.append(control.name, control.value);
      }
    }
  }
  const requests = [];
  const timers = new Map();
  const clearedTimers = [];
  let timerId = 0;
  const conversions = [];
  const historyCalls = [];
  const window = { dataLayer: [] };
  let fetchImplementation = options.fetch ?? (() => Promise.resolve(response()));
  const context = {
    window,
    document: {
      getElementById: id => ({ quoteForm: form, formStatus: status, formSuccess: success })[id],
      querySelectorAll: () => [],
      querySelector: () => element(),
      createElement: () => element(),
    },
    location: { pathname: `/${page.path}`, search: options.search ?? '' },
    history: { replaceState: (...args) => historyCalls.push(args) },
    reportConversion: kind => conversions.push(kind),
    URLSearchParams, AbortController, FormData: CapturedFormData,
    fetch(url, init) {
      requests.push({ url, init });
      return fetchImplementation(url, init);
    },
    setTimeout(callback, delay) {
      timers.set(++timerId, { callback, delay });
      return timerId;
    },
    clearTimeout(id) { clearedTimers.push(id); timers.delete(id); },
  };
  vm.runInNewContext(page.source, context, { filename: `${page.path}lead-handler.js` });
  return {
    form, controls, field, button, originalButton, status, success, requests,
    timers, clearedTimers, historyCalls, window, CapturedFormData,
    setFetch(implementation) { fetchImplementation = implementation; },
    conversionCount() {
      return conversions.filter(kind => kind === 'form').length
        + window.dataLayer.filter(event => event.event === 'govee_form_success').length;
    },
    async submit() {
      let prevented = false;
      await form.emit('submit', { preventDefault() { prevented = true; } });
      assert.ok(prevented, 'native navigation is prevented');
    },
    async input(name, value) {
      const target = field(name);
      target.value = value;
      await target.emit('input', { target });
      await form.emit('input', { target });
    },
    values() { return controls.map(control => [control.name, control.value, control.checked]); },
  };
}

function assertSuccess(h) {
  assert.ok(h.form.hidden || h.form.style.display === 'none', 'form hidden only after confirmation');
  assert.ok(h.success.classList.contains('show'));
  assert.ok(h.success.focused, 'success message receives keyboard focus');
  assert.equal(h.conversionCount(), 1);
  assert.equal(h.timers.size, 0, 'timeout cleared');
  assert.equal(h.clearedTimers.length, 1);
}

function assertFailure(h) {
  assert.equal(h.form.hidden, false);
  assert.notEqual(h.form.style.display, 'none');
  assert.equal(h.success.classList.contains('show'), false);
  assert.equal(h.conversionCount(), 0);
  assert.equal(h.button.disabled, false, 'retry button re-enabled');
  assert.equal(h.button.textContent, h.originalButton);
  assert.notEqual(h.form.dataset.sending, 'true', 'in-flight guard released');
  assert.match(h.status.textContent, /could not confirm/i);
  assert.match(h.status.textContent, /425-595-7758/);
  assert.match(h.status.className, /error/);
  assert.equal(h.requests.length, 1, 'no automatic retry');
  assert.equal(h.timers.size, 0, 'timeout cleared');
  assert.equal(h.clearedTimers.length, 1);
}

for (const page of pages) {
  test(`${page.name}: markup retains the FormSubmit recipient and required fields`, () => {
    const h = harness(page);
    assert.equal(h.form.action, 'https://formsubmit.co/louisroymiller@gmail.com');
    assert.deepEqual(h.controls.filter(control => control.required).map(control => control.name), page.required);
  });

  for (const accepted of [true, 'true']) {
    test(`${page.name}: success=${JSON.stringify(accepted)} confirms a single lead`, async () => {
      const h = harness(page, { fetch: async () => response({ success: accepted }) });
      await h.submit();
      assert.equal(h.requests.length, 1);
      assert.equal(h.requests[0].url, endpoint);
      assert.equal(h.requests[0].init.method, 'POST');
      assert.equal(h.requests[0].init.headers.Accept, 'application/json');
      assert.ok(h.requests[0].init.body instanceof h.CapturedFormData);
      assert.ok(h.requests[0].init.signal instanceof AbortSignal);
      assertSuccess(h);
      await h.submit();
      assert.equal(h.requests.length, 1, 'completed form cannot create a duplicate lead');
      assert.equal(h.conversionCount(), 1);
    });
  }

  test(`${page.name}: trims required fields and preserves hidden and optional values`, async () => {
    const h = harness(page, { search: '?utm_source=ad&utm_campaign=roofline&unexpected=excluded' });
    for (const name of page.required) h.field(name).value = `  ${h.field(name).value}  `;
    const checkboxes = h.controls.filter(control => control.type === 'checkbox');
    checkboxes.forEach((control, index) => { control.checked = index < 2; });
    const preserved = h.controls.filter(control => control.type === 'hidden' || control.name === '_honey')
      .map(control => [control.name, control.value]);
    await h.submit();
    const data = h.requests[0].init.body;
    for (const name of page.required) assert.equal(data.get(name), h.field(name).value.trim());
    for (const [name, value] of preserved) assert.equal(data.get(name), value, `${name} preserved`);
    assert.deepEqual(data.getAll('Lighting'), checkboxes.filter(control => control.checked).map(control => control.value));
    assert.equal(data.has('unexpected'), false);
    if (page.path === 'govee-installation/') {
      assert.equal(data.get('utm_source'), 'ad');
      assert.equal(data.get('utm_campaign'), 'roofline');
    }
    assertSuccess(h);
  });

  for (const name of page.required) {
    test(`${page.name}: whitespace-only ${name} is rejected before fetch and can be corrected`, async () => {
      const h = harness(page);
      h.field(name).value = ' \t\n ';
      await h.submit();
      assert.equal(h.requests.length, 0);
      assert.equal(h.conversionCount(), 0);
      assert.equal(h.button.disabled, false);
      assert.equal(h.timers.size, 0);
      assert.ok(h.field(name).validationMessage);
      await h.input(name, name === 'phone' ? '4255550100' : 'Corrected');
      assert.equal(h.field(name).validationMessage, '', 'input clears stale custom validity');
      await h.submit();
      assertSuccess(h);
    });
  }

  for (const phone of ['425555010', '1234567890123456', 'call 4255550100', '4255550100 ext 2', '425/555/0100']) {
    test(`${page.name}: rejects invalid phone ${JSON.stringify(phone)} without a request`, async () => {
      const h = harness(page);
      h.field('phone').value = phone;
      await h.submit();
      assert.equal(h.requests.length, 0);
      assert.equal(h.conversionCount(), 0);
      assert.ok(h.field('phone').validationMessage);
      assert.equal(h.button.disabled, false);
      assert.equal(h.timers.size, 0);
    });
  }

  for (const phone of ['4255550100', '+1 (425) 555-0100', '425.555.0100', '+123456789012345']) {
    test(`${page.name}: accepts allowed phone ${JSON.stringify(phone)}`, async () => {
      const h = harness(page);
      h.field('phone').value = phone;
      await h.submit();
      assert.equal(h.requests[0].init.body.get('phone'), phone);
      assertSuccess(h);
    });
  }

  const failures = [
    ['provider rejection', async () => response({ success: false })],
    ['provider string rejection', async () => response({ success: 'false' })],
    ['missing success flag', async () => response({})],
    ['truthy non-boolean success', async () => response({ success: 1 })],
    ['null JSON', async () => response(null)],
    ['string JSON', async () => response('true')],
    ['malformed JSON', async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } })],
    ['HTTP error despite success JSON', async () => response({ success: true }, false)],
    ['network error', async () => { throw new TypeError('Failed to fetch'); }],
  ];
  for (const [label, fetch] of failures) {
    test(`${page.name}: ${label} preserves data and permits an explicit retry`, async () => {
      const h = harness(page, { fetch });
      const checkbox = h.controls.find(control => control.type === 'checkbox');
      if (checkbox) checkbox.checked = true;
      const before = h.values();
      await h.submit();
      assertFailure(h);
      assert.deepEqual(h.values(), before, 'entered and optional values are retained');
      h.setFetch(async () => response());
      await h.submit();
      assert.equal(h.requests.length, 2, 'only explicit user retry sends again');
      assert.equal(h.conversionCount(), 1);
      assert.equal(h.status.textContent, '');
      assert.equal(h.status.className, 'form-status');
      assert.equal(h.timers.size, 0);
      assert.equal(h.clearedTimers.length, 2);
    });
  }

  test(`${page.name}: only one request runs at a time, with a 15-second deadline`, async () => {
    const pending = deferred();
    const h = harness(page, { fetch: () => pending.promise });
    const submission = h.submit();
    assert.equal(h.requests.length, 1);
    assert.equal(h.form.dataset.sending, 'true');
    assert.equal(h.button.disabled, true);
    assert.match(h.button.textContent, /Sending/);
    assert.equal(h.conversionCount(), 0);
    assert.equal(h.success.classList.contains('show'), false);
    assert.equal(h.timers.size, 1);
    assert.equal([...h.timers.values()][0].delay, 15000);
    await h.submit();
    assert.equal(h.requests.length, 1);
    pending.resolve(response());
    await submission;
    assertSuccess(h);
  });

  test(`${page.name}: HTTP OK alone cannot trigger success while JSON is still pending`, async () => {
    const body = deferred();
    const h = harness(page, { fetch: async () => ({ ok: true, json: () => body.promise }) });
    const submission = h.submit();
    await Promise.resolve();
    assert.equal(h.conversionCount(), 0);
    assert.equal(h.success.classList.contains('show'), false);
    assert.equal(h.form.hidden, false);
    assert.notEqual(h.form.style.display, 'none');
    assert.equal(h.button.disabled, true);
    assert.equal(h.timers.size, 1, 'deadline includes reading the response body');
    await h.submit();
    assert.equal(h.requests.length, 1, 'guard remains active until JSON is confirmed');
    body.resolve({ success: true });
    await submission;
    assertSuccess(h);
  });

  test(`${page.name}: timeout aborts the request, retains values, and enables retry`, async () => {
    const h = harness(page, {
      fetch: (_url, init) => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      }),
    });
    const before = h.values();
    const submission = h.submit();
    const timer = [...h.timers.values()][0];
    assert.equal(timer.delay, 15000);
    timer.callback();
    await submission;
    assert.equal(h.requests[0].init.signal.aborted, true);
    assertFailure(h);
    assert.deepEqual(h.values(), before);
    h.setFetch(async () => response());
    await h.submit();
    assert.equal(h.requests.length, 2);
    assert.equal(h.conversionCount(), 1);
  });
}

test('Govee: UTM attribution is allowlisted and bounded to 200 characters', async () => {
  const h = harness(pages[0], { search: `?utm_term=${'x'.repeat(250)}&email=private&source=override` });
  await h.submit();
  const data = h.requests[0].init.body;
  assert.equal(data.get('utm_term').length, 200);
  assert.equal(data.has('email'), false);
  assert.equal(data.get('source'), 'Govee installation (/govee-installation/)');
});

test('Holiday lights: confirmed success preserves attribution in the thank-you URL', async () => {
  const h = harness(pages[1], { search: '?utm_source=ad&gclid=example' });
  await h.submit();
  assert.equal(h.historyCalls.length, 1);
  assert.equal(h.historyCalls[0][2], '/lights/?utm_source=ad&gclid=example#thank-you');
  assert.ok(h.success.scrolled);
});

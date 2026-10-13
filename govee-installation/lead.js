/* Same FormSubmit destination as /lights/. Only confirmed submissions count as leads. */
(() => {
  const form = document.getElementById('quoteForm');
  const status = document.getElementById('formStatus');
  const success = document.getElementById('formSuccess');
  const event = kind => {
    (window.dataLayer = window.dataLayer || []).push({event: 'govee_' + kind, service: 'govee', page: location.pathname});
  };
  document.querySelectorAll('[data-call]').forEach(el => el.addEventListener('click', () => event('call_click')));
  document.querySelectorAll('[data-text]').forEach(el => el.addEventListener('click', () => event('text_click')));
  // Keep attribution bounded and free of arbitrary query parameters.
  const params = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
    if (!params.has(key)) return;
    const field = document.createElement('input');
    field.type = 'hidden'; field.name = key; field.value = params.get(key).slice(0, 200);
    form.appendChild(field);
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const btn = form.querySelector('button');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(form.action, {method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'}, signal: controller.signal});
      if (!res.ok) throw new Error('Submission failed');
      const result = await res.json();
      if (result.success !== true && result.success !== 'true') throw new Error('Submission unconfirmed');
      form.hidden = true; success.classList.add('show'); success.focus(); event('form_success');
    } catch {
      status.textContent = 'We could not confirm your request. Please call or text 425-595-7758, or try again.';
      status.className = 'form-status error'; btn.disabled = false; btn.textContent = original;
    } finally { clearTimeout(timeout); }
  });
  const bar = document.querySelector('.sticky-cta');
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => bar.classList.toggle('show', !entries[0].isIntersecting)).observe(document.querySelector('.hero'));
})();

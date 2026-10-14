/* Same FormSubmit destination as /lights/. Only confirmed submissions count as leads. */
(() => {
  const form = document.getElementById('quoteForm');
  const status = document.getElementById('formStatus');
  const success = document.getElementById('formSuccess');
  const required = form.querySelectorAll('[required]');
  const phone = form.querySelector('[name="phone"]');
  required.forEach(field => field.addEventListener('input', () => field.setCustomValidity('')));
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
    if (form.dataset.sending === 'true') return;
    required.forEach(field => {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : 'Please fill out this field.');
    });
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(/^[+()\d\s.\-]+$/.test(phone.value) && digits.length >= 10 && digits.length <= 15 ? '' : 'Please enter a phone number with 10 to 15 digits.');
    if (!form.reportValidity()) return;
    const btn = form.querySelector('button');
    const original = btn.textContent;
    form.dataset.sending = 'true';
    btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = ''; status.className = 'form-status';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('https://formsubmit.co/ajax/louisroymiller@gmail.com', {method: 'POST', body: new FormData(form), headers: {Accept: 'application/json'}, signal: controller.signal});
      if (!res.ok) throw new Error('Submission failed');
      const result = await res.json();
      if (result.success !== true && result.success !== 'true') throw new Error('Submission unconfirmed');
      form.hidden = true; success.classList.add('show'); success.focus(); event('form_success');
    } catch {
      status.textContent = 'We could not confirm your request. Please call or text 425-595-7758, or try again.';
      status.className = 'form-status error'; btn.disabled = false; btn.textContent = original;
      delete form.dataset.sending;
    } finally { clearTimeout(timeout); }
  });
  const bar = document.querySelector('.sticky-cta');
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => bar.classList.toggle('show', !entries[0].isIntersecting)).observe(document.querySelector('.hero'));
})();


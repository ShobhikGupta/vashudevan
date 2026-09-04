(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form || form.dataset.vmgReliabilityBound === 'true') return;
  form.dataset.vmgReliabilityBound = 'true';
  window.VMG_CONTACT_FORM_MANAGED = true;

  var fields = {
    fullname: document.getElementById('fullname'),
    phone: document.getElementById('contact'),
    email: document.getElementById('emailID'),
    organization: document.getElementById('organization'),
    country: document.getElementById('country'),
    type: document.getElementById('type'),
    message: document.getElementById('message'),
    privacy: document.getElementById('privacy'),
    honeypot: document.getElementById('website'),
    startedAt: document.getElementById('formStartedAt')
  };
  var result = document.getElementById('form-result');
  var submitButton = form.querySelector('.submit-btn');
  var phoneGroup = document.getElementById('contact-phone-group');
  var turnstileHost = document.getElementById('contact-turnstile');
  var turnstileError = document.getElementById('contact-turnstile-error');
  var startedAt = Date.now();
  var iti = null;
  var syncingCountry = false;
  var submitting = false;
  var turnstileWidgetId = null;
  var turnstileToken = '';

  var TYPE_VALUES = ['buyer', 'seller', 'quotation', 'partnership', 'documentation', 'callback', 'investor', 'finance', 'general'];
  var PREVIEW_TEST_HOST = 'deploy-preview-12--exquisite-hotteok-531d58.netlify.app';
  var TURNSTILE_PREVIEW_SITEKEY = '1x00000000000000000000AA';

  function countryData() {
    if (!window.intlTelInputGlobals || typeof window.intlTelInputGlobals.getCountryData !== 'function') return [];
    return window.intlTelInputGlobals.getCountryData().slice();
  }

  function populateCountries() {
    if (!fields.country) return;
    var data = countryData();
    if (!data.length) return;
    var fragment = document.createDocumentFragment();
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select country';
    fragment.appendChild(placeholder);
    data.forEach(function (item) {
      var option = document.createElement('option');
      option.value = item.iso2;
      option.textContent = item.name;
      option.dataset.dialCode = item.dialCode || '';
      fragment.appendChild(option);
    });
    fields.country.innerHTML = '';
    fields.country.appendChild(fragment);
    fields.country.value = 'in';
    fields.country.dataset.vmgCountryCount = String(data.length);
  }

  function initPhone() {
    if (!fields.phone || !window.intlTelInput) return null;
    if (fields.phone._iti) {
      iti = fields.phone._iti;
      return iti;
    }
    iti = window.intlTelInput(fields.phone, {
      initialCountry: 'in',
      separateDialCode: true,
      nationalMode: true,
      autoPlaceholder: 'aggressive',
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/utils.js'
    });
    fields.phone._iti = iti;
    return iti;
  }

  function syncCountryToPhone() {
    if (syncingCountry || !iti || !fields.country) return;
    var iso2 = fields.country.value;
    if (!iso2) return;
    syncingCountry = true;
    try {
      var selected = iti.getSelectedCountryData();
      if (!selected || selected.iso2 !== iso2) iti.setCountry(iso2);
    } finally {
      syncingCountry = false;
    }
  }

  function syncPhoneToCountry() {
    if (syncingCountry || !iti || !fields.country) return;
    var selected = iti.getSelectedCountryData();
    if (!selected || !selected.iso2 || fields.country.value === selected.iso2) return;
    var exists = Array.prototype.some.call(fields.country.options, function (option) { return option.value === selected.iso2; });
    if (!exists) return;
    syncingCountry = true;
    fields.country.value = selected.iso2;
    fields.country.dispatchEvent(new Event('change', { bubbles: true }));
    syncingCountry = false;
  }

  function countryName() {
    if (!fields.country) return '';
    var option = fields.country.options[fields.country.selectedIndex];
    return option && fields.country.value ? option.textContent.trim() : '';
  }

  function errorElement(control) {
    if (!control) return null;
    var id = control.getAttribute('aria-describedby');
    if (id) {
      var byId = document.getElementById(id.split(/\s+/)[0]);
      if (byId) return byId;
    }
    if (control === fields.privacy) return form.querySelector('.form-checkbox .error');
    var field = control.closest('.form-field');
    return field ? field.querySelector('.error') : null;
  }

  function customSelectRoot(select) {
    if (!select) return null;
    var next = select.nextElementSibling;
    return next && next.classList.contains('vmg-custom-select') ? next : null;
  }

  function setInvalid(control, message) {
    if (!control) return;
    control.setAttribute('aria-invalid', 'true');
    var field = control.closest('.form-field');
    if (field) field.classList.add('is-invalid');
    var root = customSelectRoot(control);
    if (root) root.classList.add('is-invalid');
    if (control === fields.phone && phoneGroup) phoneGroup.classList.add('is-invalid');
    if (control === fields.privacy) {
      var privacyWrap = control.closest('.form-checkbox');
      if (privacyWrap) privacyWrap.classList.add('is-invalid');
    }
    var error = errorElement(control);
    if (error) {
      error.textContent = message;
      error.classList.add('show');
    }
  }

  function clearInvalid(control) {
    if (!control) return;
    control.removeAttribute('aria-invalid');
    var field = control.closest('.form-field');
    if (field) field.classList.remove('is-invalid');
    var root = customSelectRoot(control);
    if (root) root.classList.remove('is-invalid');
    if (control === fields.phone && phoneGroup) phoneGroup.classList.remove('is-invalid');
    if (control === fields.privacy) {
      var privacyWrap = control.closest('.form-checkbox');
      if (privacyWrap) privacyWrap.classList.remove('is-invalid');
    }
    var error = errorElement(control);
    if (error) error.classList.remove('show');
  }

  function validEmail(value) {
    return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validPhone() {
    if (!fields.phone || !fields.phone.value.trim()) return false;
    if (!iti || typeof iti.isValidNumber !== 'function') return false;
    try { return iti.isValidNumber(); } catch (_) { return false; }
  }

  function fullPhone() {
    if (!iti || typeof iti.getNumber !== 'function') return '';
    try { return String(iti.getNumber() || '').replace(/\s+/g, ''); } catch (_) { return ''; }
  }

  function clearTurnstileError() {
    if (turnstileHost) turnstileHost.classList.remove('is-invalid');
    if (turnstileError) {
      turnstileError.textContent = '';
      turnstileError.classList.remove('show');
    }
  }

  function setTurnstileError(message) {
    if (turnstileHost) turnstileHost.classList.add('is-invalid');
    if (turnstileError) {
      turnstileError.textContent = message;
      turnstileError.classList.add('show');
    }
  }

  function validateAll() {
    var ok = true;
    var name = fields.fullname ? fields.fullname.value.trim() : '';
    var email = fields.email ? fields.email.value.trim() : '';
    var org = fields.organization ? fields.organization.value.trim() : '';
    var message = fields.message ? fields.message.value.trim() : '';

    if (name.length < 2 || name.length > 80) { setInvalid(fields.fullname, 'Please enter your full name (2–80 characters).'); ok = false; } else clearInvalid(fields.fullname);

    if (!fields.phone || !fields.phone.value.trim()) { setInvalid(fields.phone, 'Please enter your phone number.'); ok = false; }
    else if (!validPhone()) { setInvalid(fields.phone, 'Please enter a valid phone number.'); ok = false; }
    else clearInvalid(fields.phone);

    if (!validEmail(email)) { setInvalid(fields.email, email ? 'Please enter a valid email address.' : 'Please enter your email address.'); ok = false; } else clearInvalid(fields.email);

    if (org.length > 120) { setInvalid(fields.organization, 'Organization must be 120 characters or fewer.'); ok = false; } else clearInvalid(fields.organization);

    if (!fields.country || !fields.country.value) { setInvalid(fields.country, 'Please select a country.'); ok = false; } else clearInvalid(fields.country);

    if (!fields.type || TYPE_VALUES.indexOf(fields.type.value) === -1) { setInvalid(fields.type, 'Please select an enquiry type.'); ok = false; } else clearInvalid(fields.type);

    if (message.length < 10 || message.length > 3000) { setInvalid(fields.message, 'Please enter a message between 10 and 3000 characters.'); ok = false; } else clearInvalid(fields.message);

    if (!fields.privacy || !fields.privacy.checked) { setInvalid(fields.privacy, 'Please accept the privacy policy to continue.'); ok = false; } else clearInvalid(fields.privacy);

    if (!turnstileToken) { setTurnstileError('Please complete the security verification and try again.'); ok = false; } else clearTurnstileError();

    return ok;
  }

  function bindLiveValidation() {
    if (fields.fullname) fields.fullname.addEventListener('input', function () { var v = this.value.trim(); if (v.length >= 2 && v.length <= 80) clearInvalid(this); });
    if (fields.email) fields.email.addEventListener('input', function () { if (validEmail(this.value.trim())) clearInvalid(this); });
    if (fields.organization) fields.organization.addEventListener('input', function () { if (this.value.trim().length <= 120) clearInvalid(this); });
    if (fields.message) fields.message.addEventListener('input', function () { var n = this.value.trim().length; if (n >= 10 && n <= 3000) clearInvalid(this); });
    if (fields.privacy) fields.privacy.addEventListener('change', function () { if (this.checked) clearInvalid(this); });
    if (fields.type) fields.type.addEventListener('change', function () { if (TYPE_VALUES.indexOf(this.value) !== -1) clearInvalid(this); });
    if (fields.country) fields.country.addEventListener('change', function () {
      if (this.value) clearInvalid(this);
      syncCountryToPhone();
    });
    if (fields.phone) {
      fields.phone.addEventListener('countrychange', function () { syncPhoneToCountry(); if (validPhone()) clearInvalid(fields.phone); });
      fields.phone.addEventListener('input', function () { if (validPhone()) clearInvalid(fields.phone); });
      fields.phone.addEventListener('blur', function () { if (validPhone()) clearInvalid(fields.phone); });
    }
  }

  function isPreviewEnvironment() {
    return window.location.hostname === PREVIEW_TEST_HOST || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  function configuredTurnstileSitekey() {
    if (isPreviewEnvironment()) return TURNSTILE_PREVIEW_SITEKEY;
    return (window.AppConfig && window.AppConfig.turnstileSiteKey) || '';
  }

  function renderTurnstile() {
    if (!turnstileHost || turnstileWidgetId !== null) return;
    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      window.setTimeout(renderTurnstile, 120);
      return;
    }
    var sitekey = configuredTurnstileSitekey();
    if (!sitekey) {
      turnstileHost.classList.add('is-unconfigured');
      setTurnstileError('Security verification is not configured yet.');
      return;
    }
    turnstileWidgetId = window.turnstile.render(turnstileHost, {
      sitekey: sitekey,
      theme: 'light',
      appearance: 'interaction-only',
      action: 'contact_form',
      callback: function (token) { turnstileToken = token || ''; clearTurnstileError(); },
      'expired-callback': function () { turnstileToken = ''; setTurnstileError('Security verification expired. Please verify again.'); },
      'error-callback': function () { turnstileToken = ''; setTurnstileError('Security verification failed. Please try again.'); }
    });
  }

  function resetTurnstile() {
    turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) {
      try { window.turnstile.reset(turnstileWidgetId); } catch (_) {}
    }
  }

  function setButtonState(state) {
    if (!submitButton) return;
    submitButton.classList.remove('is-submitting', 'is-success');
    submitButton.disabled = state === 'submitting' || state === 'success';
    if (state === 'submitting') submitButton.classList.add('is-submitting');
    if (state === 'success') submitButton.classList.add('is-success');
  }

  function showResult(message, kind) {
    if (!result) return;
    result.textContent = message || '';
    result.className = 'form-result' + (kind ? ' ' + kind : '');
  }

  function resetFormAfterSuccess() {
    form.reset();
    startedAt = Date.now();
    if (fields.startedAt) fields.startedAt.value = String(startedAt);
    if (fields.country) {
      fields.country.value = 'in';
      fields.country.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (fields.type) {
      fields.type.value = '';
      fields.type.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (fields.phone) fields.phone.value = '';
    if (iti) {
      try { iti.setCountry('in'); } catch (_) {}
    }
    [fields.fullname, fields.phone, fields.email, fields.organization, fields.country, fields.type, fields.message, fields.privacy].forEach(clearInvalid);
    resetTurnstile();
  }

  function payload() {
    return {
      source: 'main',
      fullName: fields.fullname.value.trim(),
      fullname: fields.fullname.value.trim(),
      contact: fullPhone(),
      contactNumber: fullPhone(),
      phone: fullPhone(),
      email: fields.email.value.trim(),
      mailId: fields.email.value.trim(),
      country: countryName(),
      Country: countryName(),
      countryIso2: fields.country.value,
      organization: fields.organization.value.trim(),
      type: fields.type.value,
      message: fields.message.value.trim(),
      privacy: true,
      website: fields.honeypot ? fields.honeypot.value : '',
      formStartedAt: fields.startedAt ? Number(fields.startedAt.value) : startedAt,
      submittedAt: new Date().toISOString(),
      page: window.location.href,
      'cf-turnstile-response': turnstileToken
    };
  }

  async function submitContact(data) {
    var endpoint = (window.AppConfig && (window.AppConfig.contactEndpoint || window.AppConfig.googleScriptUrl)) || '';
    if (!endpoint) throw new Error('Submission endpoint is not configured.');

    // Fail closed until the Apps Script security guard has actually been deployed.
    // Set this true from trusted deployment configuration only after server-side
    // Turnstile/honeypot/timing/duplicate/rate checks are live.
    if (!(window.AppConfig && window.AppConfig.contactSecurityReady === true)) {
      throw new Error('Server-side security verification is not deployed yet.');
    }

    var response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('The server could not accept your message.');
    var body = {};
    try { body = await response.json(); } catch (_) {}
    if (body && body.success === false) throw new Error(body.message || 'Security verification failed.');
    return body;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (submitting) return;
    showResult('', '');
    if (!validateAll()) {
      showResult('Please correct the highlighted fields.', 'error');
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
      return;
    }

    submitting = true;
    setButtonState('submitting');
    showResult('Sending your message securely…', 'submitting');

    try {
      await submitContact(payload());
      setButtonState('success');
      showResult('Thank you! Your message has been sent.', 'success');
      resetFormAfterSuccess();
      window.setTimeout(function () {
        setButtonState('idle');
        showResult('', '');
      }, 1800);
    } catch (error) {
      setButtonState('idle');
      showResult(error && error.message ? error.message : 'Unable to send your message. Please try again.', 'error');
      resetTurnstile();
    } finally {
      submitting = false;
    }
  }, true);

  populateCountries();
  initPhone();
  if (fields.country) fields.country.value = 'in';
  if (iti) {
    try { iti.setCountry('in'); } catch (_) {}
  }
  if (fields.startedAt) fields.startedAt.value = String(startedAt);
  bindLiveValidation();
  renderTurnstile();
})();

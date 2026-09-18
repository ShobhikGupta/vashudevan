(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  var countryPhone = window.VMGCountryPhone;
  if (!form || !countryPhone || form.dataset.vmgV2Bound === 'true') return;
  form.dataset.vmgV2Bound = 'true';

  var PREVIEW_HOST = 'deploy-preview-12--exquisite-hotteok-531d58.netlify.app';
  var PREVIEW_SITEKEY = '1x00000000000000000000AA';
  var MAX_FILES = 10;
  var MAX_TOTAL = 25 * 1024 * 1024;
  var MAX_FILE = 10 * 1024 * 1024;
  var ALLOWED = {
    'image/jpeg': true, 'image/png': true, 'image/webp': true,
    'image/heic': true, 'image/heif': true, 'application/pdf': true
  };
  var TYPE_VALUES = ['buyer','seller','quotation','partnership','documentation','callback','investor','finance','general'];

  function ensureMarkup() {
    var phone = document.getElementById('contact');
    var group = document.getElementById('contact-phone-group');
    if (phone && group && !document.getElementById('contact-dial-code')) {
      var dial = document.createElement('span');
      dial.className = 'contact-dial-code';
      dial.id = 'contact-dial-code';
      dial.setAttribute('aria-hidden', 'true');
      dial.textContent = '+91';
      group.insertBefore(dial, phone);
      phone.placeholder = 'Phone number';
      phone.setAttribute('autocomplete', 'tel-national');
    }
    if (!document.getElementById('attachments')) {
      var privacy = form.querySelector('.form-checkbox');
      if (privacy) {
        var field = document.createElement('div');
        field.className = 'form-field full-width vmg-attachments-field';
        field.innerHTML = '<label for="attachments">Attachments (optional)</label>' +
          '<button type="button" class="vmg-attachment-picker" id="attachment-picker" aria-controls="attachments">' +
          '<span class="vmg-attachment-icon" aria-hidden="true">↥</span>' +
          '<span><span class="vmg-attachment-title">Add photos or documents</span>' +
          '<span class="vmg-attachment-support">Material photos, specifications or supporting documents</span></span>' +
          '<span class="vmg-attachment-rules">JPG, PNG, WEBP, HEIC or PDF · Up to 10 files · 25 MB total</span></button>' +
          '<input class="vmg-attachment-input" type="file" id="attachments" name="attachments" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" aria-describedby="attachments-error">' +
          '<div class="vmg-attachment-list" id="attachment-list" aria-live="polite"></div>' +
          '<span class="error" id="attachments-error" aria-live="polite"></span>';
        privacy.parentNode.insertBefore(field, privacy);
      }
    }
  }
  ensureMarkup();

  var fields = {
    fullName: document.getElementById('fullname'), phone: document.getElementById('contact'),
    email: document.getElementById('emailID'), organization: document.getElementById('organization'),
    country: document.getElementById('country'), type: document.getElementById('type'),
    message: document.getElementById('message'), privacy: document.getElementById('privacy'),
    attachments: document.getElementById('attachments'), honeypot: document.getElementById('website'),
    startedAt: document.getElementById('formStartedAt')
  };
  var result = document.getElementById('form-result');
  var submit = form.querySelector('.submit-btn');
  var phoneGroup = document.getElementById('contact-phone-group');
  var dialEl = document.getElementById('contact-dial-code');
  var attachmentPicker = document.getElementById('attachment-picker');
  var attachmentList = document.getElementById('attachment-list');
  var attachmentError = document.getElementById('attachments-error');
  var turnstileHost = document.getElementById('contact-turnstile');
  var turnstileError = document.getElementById('contact-turnstile-error');

  var selectedFiles = [];
  var startedAt = Date.now();
  var submitting = false;
  var phoneConflict = false;
  var iti = null;
  var itiInput = null;
  var itiReady = false;
  var turnstileToken = '';
  var turnstileWidgetId = null;

  function setSubmitState(state) {
    if (window.VMGSubmitState && submit) window.VMGSubmitState.set(submit, state);
    else if (submit) submit.disabled = state === 'loading' || state === 'success';
  }

  function selectedCountry() { return countryPhone.getByValue(fields.country && fields.country.value); }
  function countryName() { var entry = selectedCountry(); return entry ? entry.name : ''; }

  function populateCountries() {
    fields.country.innerHTML = countryPhone.optionMarkup('india');
    fields.country.value = 'india';
    fields.country.dataset.vmgCountryReady = 'true';
    fields.country.dataset.vmgCountryCount = String(countryPhone.count);
    document.dispatchEvent(new CustomEvent('vmg:contact-countries-ready', { detail: { count: countryPhone.count } }));
  }

  function syncCountry() {
    var entry = selectedCountry();
    if (!entry) return;
    dialEl.textContent = '+' + entry.dialCode;
    phoneGroup.setAttribute('aria-label', entry.name + ' +' + entry.dialCode + ', phone number');
    try { if (iti) iti.setCountry(entry.iso2); } catch (_) {}
  }

  function initEnhancedPhone() {
    if (!window.intlTelInput || iti) return;
    itiInput = document.createElement('input');
    itiInput.type = 'tel';
    itiInput.tabIndex = -1;
    itiInput.setAttribute('aria-hidden', 'true');
    itiInput.className = 'vmg-phone-validation-engine';
    form.appendChild(itiInput);
    try {
      iti = window.intlTelInput(itiInput, {
        initialCountry: 'in', allowDropdown: false, separateDialCode: false,
        nationalMode: false, autoPlaceholder: 'off',
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/utils.js'
      });
      var wrapper = itiInput.closest('.iti');
      if (wrapper) wrapper.classList.add('vmg-phone-validation-engine-wrap');
      if (iti.promise && typeof iti.promise.then === 'function') {
        iti.promise.then(function () { itiReady = true; }).catch(function () { itiReady = false; });
      } else if (window.intlTelInputUtils) itiReady = true;
    } catch (_) { iti = null; itiReady = false; }
  }

  function errorElement(control) {
    if (!control) return null;
    var ids = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (ids.length) return document.getElementById(ids[0]);
    return control === fields.privacy ? form.querySelector('.form-checkbox .error') : null;
  }
  function customSelect(select) {
    var next = select && select.nextElementSibling;
    return next && next.classList.contains('vmg-custom-select') ? next : null;
  }
  function invalid(control, message) {
    if (!control) return;
    control.setAttribute('aria-invalid', 'true');
    var parent = control.closest('.form-field'); if (parent) parent.classList.add('is-invalid');
    var custom = customSelect(control); if (custom) custom.classList.add('is-invalid');
    if (control === fields.phone) phoneGroup.classList.add('is-invalid');
    if (control === fields.privacy) control.closest('.form-checkbox').classList.add('is-invalid');
    var error = errorElement(control); if (error) { error.textContent = message; error.classList.add('show'); }
  }
  function valid(control) {
    if (!control) return;
    control.removeAttribute('aria-invalid');
    var parent = control.closest('.form-field'); if (parent) parent.classList.remove('is-invalid');
    var custom = customSelect(control); if (custom) custom.classList.remove('is-invalid');
    if (control === fields.phone) phoneGroup.classList.remove('is-invalid');
    if (control === fields.privacy) control.closest('.form-checkbox').classList.remove('is-invalid');
    var error = errorElement(control); if (error) { error.textContent = ''; error.classList.remove('show'); }
  }

  function normalizePhoneInput() {
    var raw = fields.phone.value.trim();
    if (!raw) { phoneConflict = false; delete fields.phone.dataset.invalidChars; valid(fields.phone); return; }
    if (/[A-Za-z]/.test(raw) || /[^0-9+\-()\s]/.test(raw)) {
      fields.phone.dataset.invalidChars = 'true';
      invalid(fields.phone, 'Please enter a valid phone number for ' + (countryName() || 'the selected country') + '.');
      return;
    }
    delete fields.phone.dataset.invalidChars;
    var entry = selectedCountry();
    if (!entry) return;
    if (raw.charAt(0) === '+') {
      var compact = '+' + countryPhone.nationalDigits(raw);
      var expected = '+' + entry.dialCode;
      if (compact.indexOf(expected) === 0) {
        fields.phone.value = compact.slice(expected.length);
        phoneConflict = false;
        valid(fields.phone);
      } else {
        phoneConflict = true;
        invalid(fields.phone, 'The number includes a different country code. Change Country first.');
      }
    } else {
      phoneConflict = false;
      valid(fields.phone);
    }
  }

  function basicPhoneParts() {
    var entry = selectedCountry();
    var raw = fields.phone.value.trim();
    if (!entry || !raw || phoneConflict || fields.phone.dataset.invalidChars === 'true') return null;
    if (/[A-Za-z]/.test(raw) || /[^0-9\-()\s]/.test(raw)) return null;
    var national = countryPhone.nationalDigits(raw);
    if (national.length < 6 || national.length > 14) return null;
    var canonical = '+' + entry.dialCode + national;
    if (canonical.length - 1 < 7 || canonical.length - 1 > 15) return null;
    return { entry: entry, national: national, e164: canonical };
  }

  function enhancedParts(basic) {
    if (!basic || !iti || !itiReady) return null;
    try {
      iti.setCountry(basic.entry.iso2);
      iti.setNumber(basic.e164);
      if (!iti.isValidNumber()) return { invalid: true };
      var e164 = String(iti.getNumber() || '').replace(/\s+/g, '');
      if (!/^\+[1-9]\d{6,14}$/.test(e164)) return null;
      var prefix = '+' + basic.entry.dialCode;
      var national = e164.indexOf(prefix) === 0 ? e164.slice(prefix.length) : basic.national;
      return { e164: e164, national: national, display: prefix + ' ' + national, dialCode: prefix };
    } catch (_) { return null; }
  }

  function phoneParts() {
    var basic = basicPhoneParts();
    if (!basic) return null;
    var enhanced = enhancedParts(basic);
    if (enhanced && enhanced.invalid) return null;
    if (enhanced) return enhanced;
    return {
      e164: basic.e164,
      dialCode: '+' + basic.entry.dialCode,
      national: basic.national,
      display: '+' + basic.entry.dialCode + ' ' + basic.national
    };
  }

  function readableBytes(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '') + ' MB';
  }
  function attachmentFail(message) {
    var field = fields.attachments.closest('.vmg-attachments-field'); if (field) field.classList.add('is-invalid');
    attachmentError.textContent = message; attachmentError.classList.add('show');
  }
  function attachmentClear() {
    var field = fields.attachments.closest('.vmg-attachments-field'); if (field) field.classList.remove('is-invalid');
    attachmentError.textContent = ''; attachmentError.classList.remove('show');
  }
  function renderAttachments() {
    attachmentList.innerHTML = '';
    selectedFiles.forEach(function (file, index) {
      var chip = document.createElement('div');
      chip.className = 'vmg-attachment-chip';
      chip.innerHTML = '<span class="vmg-attachment-chip-name"></span><span class="vmg-attachment-chip-size"></span><button type="button" aria-label="Remove attachment">×</button>';
      chip.querySelector('.vmg-attachment-chip-name').textContent = file.name;
      chip.querySelector('.vmg-attachment-chip-size').textContent = readableBytes(file.size);
      chip.querySelector('button').addEventListener('click', function () { selectedFiles.splice(index, 1); renderAttachments(); attachmentClear(); });
      attachmentList.appendChild(chip);
    });
  }
  function addAttachments(files) {
    var incoming = Array.prototype.slice.call(files || []);
    var next = selectedFiles.slice();
    for (var i = 0; i < incoming.length; i++) {
      var file = incoming[i];
      if (!ALLOWED[file.type]) { attachmentFail('Unsupported file type. Use JPG, PNG, WEBP, HEIC or PDF.'); fields.attachments.value = ''; return; }
      if (file.size > MAX_FILE) { attachmentFail('Each attachment must be 10 MB or less.'); fields.attachments.value = ''; return; }
      if (!next.some(function (x) { return x.name === file.name && x.size === file.size && x.lastModified === file.lastModified; })) next.push(file);
    }
    if (next.length > MAX_FILES) { attachmentFail('You can attach up to 10 files.'); fields.attachments.value = ''; return; }
    var total = next.reduce(function (sum, file) { return sum + file.size; }, 0);
    if (total > MAX_TOTAL) { attachmentFail('Attachments must be 25 MB total or less.'); fields.attachments.value = ''; return; }
    selectedFiles = next; fields.attachments.value = ''; attachmentClear(); renderAttachments();
  }
  function filePayload(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var value = String(reader.result || '');
        resolve({ name:file.name, mimeType:file.type, size:file.size, base64:value.split(',')[1] || '' });
      };
      reader.onerror = function () { reject(new Error('An attachment could not be read.')); };
      reader.readAsDataURL(file);
    });
  }

  function turnstileErrorSet(message) {
    if (turnstileHost) turnstileHost.classList.add('is-invalid');
    if (turnstileError) { turnstileError.textContent = message; turnstileError.classList.add('show'); }
  }
  function turnstileErrorClear() {
    if (turnstileHost) turnstileHost.classList.remove('is-invalid');
    if (turnstileError) { turnstileError.textContent = ''; turnstileError.classList.remove('show'); }
  }
  function renderTurnstile() {
    if (!turnstileHost || turnstileWidgetId !== null) return;
    if (!window.turnstile || typeof window.turnstile.render !== 'function') { window.setTimeout(renderTurnstile, 120); return; }
    var preview = window.location.hostname === PREVIEW_HOST || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    var sitekey = preview ? PREVIEW_SITEKEY : ((window.AppConfig && window.AppConfig.turnstileSiteKey) || '');
    if (!sitekey) { turnstileErrorSet('Security verification is not configured yet.'); return; }
    var options = {
      sitekey:sitekey, theme:'light', appearance:'always', size:'flexible', action:'contact_form',
      callback:function(token){ turnstileToken=token||''; turnstileErrorClear(); },
      'expired-callback':function(){ turnstileToken=''; turnstileErrorSet('Security verification expired. Please verify again.'); },
      'error-callback':function(){ turnstileToken=''; turnstileErrorSet('Security verification failed. Please try again.'); }
    };
    try { turnstileWidgetId = window.turnstile.render(turnstileHost, options); }
    catch (_) { delete options.size; turnstileWidgetId = window.turnstile.render(turnstileHost, options); }
  }
  function resetTurnstile() {
    turnstileToken = '';
    try { if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId); } catch (_) {}
  }

  function emailOkay(value) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
  function validateAll() {
    var ok = true;
    var name = fields.fullName.value.trim(), email = fields.email.value.trim(), org = fields.organization.value.trim(), message = fields.message.value.trim();
    if (name.length < 2 || name.length > 80) { invalid(fields.fullName, 'Please enter your full name (2–80 characters).'); ok=false; } else valid(fields.fullName);
    if (!selectedCountry()) { invalid(fields.country, 'Please select a country.'); ok=false; } else valid(fields.country);
    if (!emailOkay(email)) { invalid(fields.email, 'Please enter a valid email address.'); ok=false; } else valid(fields.email);
    if (!fields.phone.value.trim()) { invalid(fields.phone, 'Please enter your phone number.'); ok=false; }
    else if (phoneConflict) { invalid(fields.phone, 'The number includes a different country code. Change Country first.'); ok=false; }
    else if (!phoneParts()) { invalid(fields.phone, 'Please enter a valid phone number for ' + (countryName() || 'the selected country') + '.'); ok=false; }
    else valid(fields.phone);
    if (org.length > 120) { invalid(fields.organization, 'Organization must be 120 characters or fewer.'); ok=false; } else valid(fields.organization);
    if (TYPE_VALUES.indexOf(fields.type.value) === -1) { invalid(fields.type, 'Please select an enquiry type.'); ok=false; } else valid(fields.type);
    if (message.length < 10 || message.length > 3000) { invalid(fields.message, 'Please enter a message between 10 and 3000 characters.'); ok=false; } else valid(fields.message);
    if (!fields.privacy.checked) { invalid(fields.privacy, 'Please accept the privacy policy to continue.'); ok=false; } else valid(fields.privacy);
    if (!turnstileToken) { turnstileErrorSet('Please complete the security verification and try again.'); ok=false; } else turnstileErrorClear();
    return ok;
  }

  function showResult(message, kind) {
    if (!result) return;
    result.textContent = message || '';
    result.className = 'form-result' + (kind ? ' ' + kind : '');
  }

  function payload() {
    var parts = phoneParts();
    return Promise.all(selectedFiles.map(filePayload)).then(function (attachments) {
      return {
        source:'main', fullName:fields.fullName.value.trim(), fullname:fields.fullName.value.trim(),
        contact:parts.e164, contactNumber:parts.e164, phone:parts.e164, phoneE164:parts.e164,
        phoneDialCode:parts.dialCode, phoneNational:parts.national, phoneDisplay:parts.display, 'PHONE NUMBER':parts.display,
        email:fields.email.value.trim(), mailId:fields.email.value.trim(), country:countryName(), Country:countryName(),
        countryIso2:(selectedCountry() || {}).iso2 || '', organization:fields.organization.value.trim(),
        type:fields.type.value, message:fields.message.value.trim(), privacy:true,
        attachments:attachments, attachmentCount:attachments.length,
        website:fields.honeypot ? fields.honeypot.value : '', formStartedAt:Number(fields.startedAt.value || startedAt),
        submittedAt:new Date().toISOString(), page:window.location.href, 'cf-turnstile-response':turnstileToken
      };
    });
  }

  function send(data) {
    var endpoint = (window.AppConfig && (window.AppConfig.contactEndpoint || window.AppConfig.googleScriptUrl)) || '';
    if (!endpoint) return Promise.reject(new Error('Submission endpoint is not configured.'));
    if (!(window.AppConfig && window.AppConfig.contactSecurityReady === true)) return Promise.reject(new Error('Server-side security and attachment handling are not deployed yet.'));
    return fetch(endpoint, { method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8','Accept':'application/json'}, body:JSON.stringify(data) }).then(function (response) {
      if (!response.ok) throw new Error('The server could not accept your message.');
      return response.json().catch(function () { return {}; });
    }).then(function (body) {
      if (!body || body.success !== true) throw new Error((body && body.message) || 'The server did not confirm your submission.');
      return body;
    });
  }

  function resetSuccess() {
    form.reset();
    startedAt = Date.now(); fields.startedAt.value = String(startedAt);
    selectedFiles = []; fields.attachments.value = ''; renderAttachments(); attachmentClear();
    fields.country.value = 'india'; fields.phone.value = ''; phoneConflict = false; syncCountry();
    fields.country.dispatchEvent(new Event('change', { bubbles:true }));
    fields.type.value = ''; fields.type.dispatchEvent(new Event('change', { bubbles:true }));
    resetTurnstile();
  }

  populateCountries();
  fields.startedAt.value = String(startedAt);
  fields.country.value = 'india';
  syncCountry();
  initEnhancedPhone();
  renderAttachments();
  renderTurnstile();

  fields.country.addEventListener('change', function () { valid(fields.country); syncCountry(); normalizePhoneInput(); });
  fields.phone.addEventListener('input', normalizePhoneInput);
  fields.phone.addEventListener('blur', normalizePhoneInput);
  fields.fullName.addEventListener('input', function(){ if (this.value.trim().length >= 2) valid(this); });
  fields.email.addEventListener('input', function(){ if (emailOkay(this.value.trim())) valid(this); });
  fields.organization.addEventListener('input', function(){ if (this.value.trim().length <= 120) valid(this); });
  fields.message.addEventListener('input', function(){ var n=this.value.trim().length; if(n>=10&&n<=3000) valid(this); });
  fields.type.addEventListener('change', function(){ if(TYPE_VALUES.indexOf(this.value)!==-1) valid(this); });
  fields.privacy.addEventListener('change', function(){ if(this.checked) valid(this); });
  attachmentPicker.addEventListener('click', function(){ fields.attachments.click(); });
  fields.attachments.addEventListener('change', function(){ addAttachments(this.files); });

  form.addEventListener('submit', function (event) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (submitting) return;
    showResult('', '');
    if (!validateAll()) {
      setSubmitState('error'); showResult('Please correct the highlighted fields.', 'error');
      window.setTimeout(function(){ setSubmitState('idle'); }, 280); return;
    }
    submitting = true; setSubmitState('loading'); showResult('Sending your message securely…', 'submitting');
    payload().then(send).then(function(){
      setSubmitState('success'); showResult('Thank you! Your message has been sent.', 'success'); resetSuccess();
      window.setTimeout(function(){ setSubmitState('idle'); showResult('', ''); }, 1800);
    }).catch(function(error){
      setSubmitState('error'); showResult(error && error.message ? error.message : 'Unable to send your message. Please try again.', 'error');
      resetTurnstile(); window.setTimeout(function(){ setSubmitState('idle'); }, 280);
    }).finally(function(){ submitting=false; });
  }, true);
})();

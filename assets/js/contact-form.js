(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form || form.dataset.vmgReliabilityBound === 'true') return;
  form.dataset.vmgReliabilityBound = 'true';
  window.VMG_CONTACT_FORM_MANAGED = true;

  function ensureContactMarkup() {
    var phone = document.getElementById('contact');
    var phoneGroup = document.getElementById('contact-phone-group');
    if (phone && phoneGroup && !document.getElementById('contact-dial-code')) {
      var dial = document.createElement('span');
      dial.className = 'contact-dial-code';
      dial.id = 'contact-dial-code';
      dial.setAttribute('aria-hidden', 'true');
      dial.textContent = '+91';
      phoneGroup.insertBefore(dial, phone);
      phone.placeholder = 'Phone number';
      phone.setAttribute('autocomplete', 'tel-national');
      phoneGroup.setAttribute('aria-label', 'India +91, phone number');
    }

    if (!document.getElementById('attachments')) {
      var message = document.getElementById('message');
      var messageField = message && message.closest('.form-field');
      var privacy = form.querySelector('.form-checkbox');
      if (messageField && privacy) {
        var field = document.createElement('div');
        field.className = 'form-field full-width vmg-attachments-field';
        field.innerHTML = '' +
          '<label for="attachments">Attachments (optional)</label>' +
          '<button type="button" class="vmg-attachment-picker" id="attachment-picker" aria-controls="attachments">' +
            '<span class="vmg-attachment-icon" aria-hidden="true">↥</span>' +
            '<span><span class="vmg-attachment-title">Add photos or documents</span>' +
            '<span class="vmg-attachment-support">Material photos, specifications or supporting documents</span></span>' +
            '<span class="vmg-attachment-rules">JPG, PNG, WEBP, HEIC or PDF · Up to 5 files · 10 MB total</span>' +
          '</button>' +
          '<input class="vmg-attachment-input" type="file" id="attachments" name="attachments" multiple ' +
            'accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" aria-describedby="attachments-error">' +
          '<div class="vmg-attachment-list" id="attachment-list" aria-live="polite"></div>' +
          '<span class="error" id="attachments-error" aria-live="polite"></span>';
        privacy.parentNode.insertBefore(field, privacy);
      }
    }
  }

  ensureContactMarkup();

  var fields = {
    fullname: document.getElementById('fullname'),
    phone: document.getElementById('contact'),
    email: document.getElementById('emailID'),
    organization: document.getElementById('organization'),
    country: document.getElementById('country'),
    type: document.getElementById('type'),
    message: document.getElementById('message'),
    privacy: document.getElementById('privacy'),
    attachments: document.getElementById('attachments'),
    honeypot: document.getElementById('website'),
    startedAt: document.getElementById('formStartedAt')
  };

  var result = document.getElementById('form-result');
  var submitButton = form.querySelector('.submit-btn');
  var phoneGroup = document.getElementById('contact-phone-group');
  var dialCodeEl = document.getElementById('contact-dial-code');
  var attachmentPicker = document.getElementById('attachment-picker');
  var attachmentList = document.getElementById('attachment-list');
  var attachmentError = document.getElementById('attachments-error');
  var turnstileHost = document.getElementById('contact-turnstile');
  var turnstileError = document.getElementById('contact-turnstile-error');

  var TYPE_VALUES = ['buyer', 'seller', 'quotation', 'partnership', 'documentation', 'callback', 'investor', 'finance', 'general'];
  var PREVIEW_TEST_HOST = 'deploy-preview-12--exquisite-hotteok-531d58.netlify.app';
  var TURNSTILE_PREVIEW_SITEKEY = '1x00000000000000000000AA';
  var MAX_ATTACHMENTS = 5;
  var MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
  var ALLOWED_ATTACHMENT_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/webp': true,
    'image/heic': true,
    'image/heif': true,
    'application/pdf': true
  };

  var startedAt = Date.now();
  var phoneEngineInput = null;
  var iti = null;
  var countryByIso2 = {};
  var phoneConflict = false;
  var selectedFiles = [];
  var submitting = false;
  var turnstileWidgetId = null;
  var turnstileToken = '';

  function countryData() {
    if (!window.intlTelInputGlobals || typeof window.intlTelInputGlobals.getCountryData !== 'function') return [];
    return window.intlTelInputGlobals.getCountryData().slice();
  }

  function populateCountries() {
    if (!fields.country) return;
    var data = countryData();
    if (!data.length) return;
    countryByIso2 = {};
    var fragment = document.createDocumentFragment();
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select country';
    fragment.appendChild(placeholder);
    data.forEach(function (item) {
      countryByIso2[item.iso2] = item;
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

  function initPhoneEngine() {
    if (!fields.phone || !window.intlTelInput) return null;
    phoneEngineInput = document.createElement('input');
    phoneEngineInput.type = 'tel';
    phoneEngineInput.tabIndex = -1;
    phoneEngineInput.setAttribute('aria-hidden', 'true');
    phoneEngineInput.className = 'vmg-phone-validation-engine';
    form.appendChild(phoneEngineInput);
    iti = window.intlTelInput(phoneEngineInput, {
      initialCountry: 'in',
      allowDropdown: false,
      separateDialCode: false,
      nationalMode: true,
      autoPlaceholder: 'off',
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/utils.js'
    });
    var wrapper = phoneEngineInput.closest('.iti');
    if (wrapper) wrapper.classList.add('vmg-phone-validation-engine-wrap');
    return iti;
  }

  function selectedCountryMeta() {
    var iso2 = fields.country ? fields.country.value : '';
    if (iso2 && countryByIso2[iso2]) return countryByIso2[iso2];
    if (fields.country && fields.country.selectedIndex >= 0) {
      var option = fields.country.options[fields.country.selectedIndex];
      return option && option.value ? { iso2: option.value, name: option.textContent.trim(), dialCode: option.dataset.dialCode || '' } : null;
    }
    return null;
  }

  function countryName() {
    var meta = selectedCountryMeta();
    return meta ? meta.name : '';
  }

  function updateDialCode() {
    var meta = selectedCountryMeta();
    var dial = meta && meta.dialCode ? '+' + meta.dialCode : '—';
    if (dialCodeEl) dialCodeEl.textContent = dial;
    if (phoneGroup) phoneGroup.setAttribute('aria-label', (meta ? meta.name + ' ' + dial : 'Country dial code') + ', phone number');
  }

  function setPhoneEngineCountry() {
    var meta = selectedCountryMeta();
    updateDialCode();
    if (!iti || !meta || !meta.iso2) return;
    try { iti.setCountry(meta.iso2); } catch (_) {}
  }

  function digitsOnly(value) { return String(value || '').replace(/\D/g, ''); }

  function clearPhoneConflict() {
    phoneConflict = false;
    if (fields.phone && fields.phone.dataset.phoneConflict) delete fields.phone.dataset.phoneConflict;
  }

  function setPhoneConflict() {
    phoneConflict = true;
    if (fields.phone) fields.phone.dataset.phoneConflict = 'true';
    setInvalid(fields.phone, 'The number includes a different country code. Change Country first.');
  }

  function normalizeVisiblePhone() {
    if (!fields.phone) return;
    var raw = fields.phone.value.trim();
    if (!raw) { clearPhoneConflict(); return; }
    var meta = selectedCountryMeta();
    if (raw.charAt(0) === '+') {
      if (!meta || !meta.dialCode) { setPhoneConflict(); return; }
      var matchingPrefix = '+' + meta.dialCode;
      if (raw.indexOf(matchingPrefix) === 0) {
        fields.phone.value = digitsOnly(raw.slice(matchingPrefix.length));
        clearPhoneConflict();
        clearInvalid(fields.phone);
      } else {
        setPhoneConflict();
        return;
      }
    } else {
      fields.phone.value = digitsOnly(raw);
      clearPhoneConflict();
    }
  }

  function syncCountryToPhoneEngine() {
    setPhoneEngineCountry();
    normalizeVisiblePhone();
    if (fields.phone && fields.phone.value.trim() && !phoneConflict) {
      if (validPhone()) clearInvalid(fields.phone);
      else setInvalid(fields.phone, 'Please enter a valid phone number for ' + countryName() + '.');
    }
  }

  function setEngineNumber() {
    if (!phoneEngineInput || !fields.phone) return '';
    var national = digitsOnly(fields.phone.value);
    phoneEngineInput.value = national;
    return national;
  }

  function validPhone() {
    if (!fields.phone || !fields.phone.value.trim() || phoneConflict) return false;
    if (!iti || typeof iti.isValidNumber !== 'function') return false;
    setEngineNumber();
    try { return iti.isValidNumber(); } catch (_) { return false; }
  }

  function fullPhone() {
    if (!fields.phone || phoneConflict) return '';
    var national = setEngineNumber();
    if (!national) return '';
    if (iti && typeof iti.getNumber === 'function') {
      try {
        var number = String(iti.getNumber() || '').replace(/\s+/g, '');
        if (/^\+[1-9]\d{6,14}$/.test(number)) return number;
      } catch (_) {}
    }
    var meta = selectedCountryMeta();
    return meta && meta.dialCode ? '+' + meta.dialCode + national : '';
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
    if (error) { error.textContent = message; error.classList.add('show'); }
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

  function validEmail(value) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

  function setAttachmentError(message) {
    var field = fields.attachments ? fields.attachments.closest('.vmg-attachments-field') : null;
    if (field) field.classList.add('is-invalid');
    if (attachmentError) { attachmentError.textContent = message; attachmentError.classList.add('show'); }
  }

  function clearAttachmentError() {
    var field = fields.attachments ? fields.attachments.closest('.vmg-attachments-field') : null;
    if (field) field.classList.remove('is-invalid');
    if (attachmentError) { attachmentError.textContent = ''; attachmentError.classList.remove('show'); }
  }

  function readableBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function attachmentKey(file) { return [file.name, file.size, file.lastModified].join('|'); }

  function renderAttachments() {
    if (!attachmentList) return;
    attachmentList.innerHTML = '';
    selectedFiles.forEach(function (file, index) {
      var item = document.createElement('div');
      item.className = 'vmg-attachment-chip';
      var icon = document.createElement('span');
      icon.className = 'vmg-attachment-chip-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = file.type.indexOf('image/') === 0 ? '▧' : 'PDF';
      var name = document.createElement('span');
      name.className = 'vmg-attachment-chip-name';
      name.textContent = file.name;
      name.title = file.name;
      var size = document.createElement('span');
      size.className = 'vmg-attachment-chip-size';
      size.textContent = readableBytes(file.size);
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'vmg-attachment-remove';
      remove.setAttribute('aria-label', 'Remove ' + file.name);
      remove.textContent = '×';
      remove.addEventListener('click', function () { selectedFiles.splice(index, 1); clearAttachmentError(); renderAttachments(); });
      item.appendChild(icon); item.appendChild(name); item.appendChild(size); item.appendChild(remove);
      attachmentList.appendChild(item);
    });
  }

  function addAttachments(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;
    var unsupported = incoming.find(function (file) { return !ALLOWED_ATTACHMENT_TYPES[file.type]; });
    if (unsupported) {
      setAttachmentError('Unsupported file type: ' + unsupported.name + '. Use JPG, PNG, WEBP, HEIC or PDF.');
      if (fields.attachments) fields.attachments.value = '';
      return;
    }
    var currentKeys = {};
    selectedFiles.forEach(function (file) { currentKeys[attachmentKey(file)] = true; });
    var combined = selectedFiles.slice();
    incoming.forEach(function (file) {
      var key = attachmentKey(file);
      if (!currentKeys[key]) { currentKeys[key] = true; combined.push(file); }
    });
    if (combined.length > MAX_ATTACHMENTS) {
      setAttachmentError('You can attach up to 5 files.');
      if (fields.attachments) fields.attachments.value = '';
      return;
    }
    var total = combined.reduce(function (sum, file) { return sum + file.size; }, 0);
    if (total > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('Attachments must be 10 MB total or less.');
      if (fields.attachments) fields.attachments.value = '';
      return;
    }
    selectedFiles = combined;
    clearAttachmentError();
    renderAttachments();
    if (fields.attachments) fields.attachments.value = '';
  }

  function fileToPayload(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = String(reader.result || '');
        var comma = dataUrl.indexOf(',');
        if (comma === -1) { reject(new Error('Could not read ' + file.name + '.')); return; }
        resolve({ name: file.name, mimeType: file.type, size: file.size, base64: dataUrl.slice(comma + 1) });
      };
      reader.onerror = function () { reject(new Error('Could not read ' + file.name + '.')); };
      reader.readAsDataURL(file);
    });
  }

  function serializeAttachments() { return Promise.all(selectedFiles.map(fileToPayload)); }

  function clearTurnstileError() {
    if (turnstileHost) turnstileHost.classList.remove('is-invalid');
    if (turnstileError) { turnstileError.textContent = ''; turnstileError.classList.remove('show'); }
  }

  function setTurnstileError(message) {
    if (turnstileHost) turnstileHost.classList.add('is-invalid');
    if (turnstileError) { turnstileError.textContent = message; turnstileError.classList.add('show'); }
  }

  function validateAll() {
    var ok = true;
    var name = fields.fullname ? fields.fullname.value.trim() : '';
    var email = fields.email ? fields.email.value.trim() : '';
    var org = fields.organization ? fields.organization.value.trim() : '';
    var message = fields.message ? fields.message.value.trim() : '';
    if (name.length < 2 || name.length > 80) { setInvalid(fields.fullname, 'Please enter your full name (2–80 characters).'); ok = false; } else clearInvalid(fields.fullname);
    if (!fields.country || !fields.country.value) { setInvalid(fields.country, 'Please select a country.'); ok = false; } else clearInvalid(fields.country);
    if (!validEmail(email)) { setInvalid(fields.email, email ? 'Please enter a valid email address.' : 'Please enter your email address.'); ok = false; } else clearInvalid(fields.email);
    if (!fields.phone || !fields.phone.value.trim()) { setInvalid(fields.phone, 'Please enter your phone number.'); ok = false; }
    else if (phoneConflict) { setInvalid(fields.phone, 'The number includes a different country code. Change Country first.'); ok = false; }
    else if (!validPhone()) { setInvalid(fields.phone, 'Please enter a valid phone number for ' + (countryName() || 'the selected country') + '.'); ok = false; }
    else clearInvalid(fields.phone);
    if (org.length > 120) { setInvalid(fields.organization, 'Organization must be 120 characters or fewer.'); ok = false; } else clearInvalid(fields.organization);
    if (!fields.type || TYPE_VALUES.indexOf(fields.type.value) === -1) { setInvalid(fields.type, 'Please select an enquiry type.'); ok = false; } else clearInvalid(fields.type);
    if (message.length < 10 || message.length > 3000) { setInvalid(fields.message, 'Please enter a message between 10 and 3000 characters.'); ok = false; } else clearInvalid(fields.message);
    var totalBytes = selectedFiles.reduce(function (sum, file) { return sum + file.size; }, 0);
    if (selectedFiles.length > MAX_ATTACHMENTS || totalBytes > MAX_ATTACHMENT_BYTES || selectedFiles.some(function (file) { return !ALLOWED_ATTACHMENT_TYPES[file.type]; })) { setAttachmentError('Please review the selected attachments.'); ok = false; } else clearAttachmentError();
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
    if (fields.country) fields.country.addEventListener('change', function () { if (this.value) clearInvalid(this); syncCountryToPhoneEngine(); });
    if (fields.phone) {
      fields.phone.addEventListener('input', function () { normalizeVisiblePhone(); if (!phoneConflict && this.value.trim() && validPhone()) clearInvalid(this); });
      fields.phone.addEventListener('blur', function () {
        normalizeVisiblePhone();
        if (!this.value.trim()) return;
        if (phoneConflict) setPhoneConflict();
        else if (validPhone()) clearInvalid(this);
        else setInvalid(this, 'Please enter a valid phone number for ' + (countryName() || 'the selected country') + '.');
      });
    }
    if (attachmentPicker && fields.attachments) attachmentPicker.addEventListener('click', function () { fields.attachments.click(); });
    if (fields.attachments) fields.attachments.addEventListener('change', function () { addAttachments(this.files); });
  }

  function isPreviewEnvironment() { return window.location.hostname === PREVIEW_TEST_HOST || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'; }
  function configuredTurnstileSitekey() { if (isPreviewEnvironment()) return TURNSTILE_PREVIEW_SITEKEY; return (window.AppConfig && window.AppConfig.turnstileSiteKey) || ''; }

  function renderTurnstile() {
    if (!turnstileHost || turnstileWidgetId !== null) return;
    if (!window.turnstile || typeof window.turnstile.render !== 'function') { window.setTimeout(renderTurnstile, 120); return; }
    var sitekey = configuredTurnstileSitekey();
    if (!sitekey) { turnstileHost.classList.add('is-unconfigured'); setTurnstileError('Security verification is not configured yet.'); return; }
    var options = {
      sitekey: sitekey,
      theme: 'light',
      appearance: 'always',
      size: 'flexible',
      action: 'contact_form',
      callback: function (token) { turnstileToken = token || ''; clearTurnstileError(); },
      'expired-callback': function () { turnstileToken = ''; setTurnstileError('Security verification expired. Please verify again.'); },
      'error-callback': function () { turnstileToken = ''; setTurnstileError('Security verification failed. Please try again.'); }
    };
    try { turnstileWidgetId = window.turnstile.render(turnstileHost, options); }
    catch (_) { delete options.size; turnstileWidgetId = window.turnstile.render(turnstileHost, options); }
  }

  function resetTurnstile() {
    turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) { try { window.turnstile.reset(turnstileWidgetId); } catch (_) {} }
  }

  function setButtonState(state) {
    if (!submitButton) return;
    submitButton.classList.remove('is-submitting', 'is-success');
    submitButton.disabled = state === 'submitting' || state === 'success';
    submitButton.setAttribute('aria-label', state === 'submitting' ? 'Sending message' : state === 'success' ? 'Message sent' : 'Submit');
    if (state === 'submitting') submitButton.classList.add('is-submitting');
    if (state === 'success') submitButton.classList.add('is-success');
  }

  function showResult(message, kind) {
    if (!result) return;
    result.textContent = message || '';
    result.className = 'form-result' + (kind ? ' ' + kind : '');
  }

  function resetAttachments() {
    selectedFiles = [];
    if (fields.attachments) fields.attachments.value = '';
    clearAttachmentError();
    renderAttachments();
  }

  function resetFormAfterSuccess() {
    form.reset();
    startedAt = Date.now();
    if (fields.startedAt) fields.startedAt.value = String(startedAt);
    resetAttachments();
    if (fields.country) { fields.country.value = 'in'; fields.country.dispatchEvent(new Event('change', { bubbles: true })); }
    if (fields.type) { fields.type.value = ''; fields.type.dispatchEvent(new Event('change', { bubbles: true })); }
    if (fields.phone) fields.phone.value = '';
    clearPhoneConflict();
    setPhoneEngineCountry();
    [fields.fullname, fields.phone, fields.email, fields.organization, fields.country, fields.type, fields.message, fields.privacy].forEach(clearInvalid);
    resetTurnstile();
  }

  async function payload() {
    var attachments = await serializeAttachments();
    var phone = fullPhone();
    return {
      source: 'main', fullName: fields.fullname.value.trim(), fullname: fields.fullname.value.trim(),
      contact: phone, contactNumber: phone, phone: phone,
      email: fields.email.value.trim(), mailId: fields.email.value.trim(),
      country: countryName(), Country: countryName(), countryIso2: fields.country.value,
      organization: fields.organization.value.trim(), type: fields.type.value, message: fields.message.value.trim(),
      privacy: true, attachments: attachments, attachmentCount: attachments.length,
      website: fields.honeypot ? fields.honeypot.value : '',
      formStartedAt: fields.startedAt ? Number(fields.startedAt.value) : startedAt,
      submittedAt: new Date().toISOString(), page: window.location.href,
      'cf-turnstile-response': turnstileToken
    };
  }

  async function submitContact(data) {
    var endpoint = (window.AppConfig && (window.AppConfig.contactEndpoint || window.AppConfig.googleScriptUrl)) || '';
    if (!endpoint) throw new Error('Submission endpoint is not configured.');
    if (!(window.AppConfig && window.AppConfig.contactSecurityReady === true)) throw new Error('Server-side security and attachment handling are not deployed yet.');
    var response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Accept': 'application/json' }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('The server could not accept your message.');
    var body = {};
    try { body = await response.json(); } catch (_) {}
    if (body && body.success === false) throw new Error(body.message || 'Submission could not be accepted.');
    if (!body || body.success !== true) throw new Error('The server did not confirm your submission.');
    return body;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (submitting) return;
    showResult('', '');
    if (!validateAll()) {
      showResult('Please correct the highlighted fields.', 'error');
      var firstInvalid = form.querySelector('[aria-invalid="true"], .vmg-turnstile.is-invalid');
      if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
      return;
    }
    submitting = true;
    setButtonState('submitting');
    showResult('Sending your message securely…', 'submitting');
    try {
      var data = await payload();
      await submitContact(data);
      setButtonState('success');
      showResult('Thank you! Your message has been sent.', 'success');
      resetFormAfterSuccess();
      window.setTimeout(function () { setButtonState('idle'); showResult('', ''); }, 1800);
    } catch (error) {
      setButtonState('idle');
      showResult(error && error.message ? error.message : 'Unable to send your message. Please try again.', 'error');
      resetTurnstile();
    } finally { submitting = false; }
  }, true);

  populateCountries();
  initPhoneEngine();
  if (fields.country) fields.country.value = 'in';
  setPhoneEngineCountry();
  if (fields.phone) fields.phone.value = '';
  if (fields.startedAt) fields.startedAt.value = String(startedAt);
  bindLiveValidation();
  renderAttachments();
  renderTurnstile();
})();

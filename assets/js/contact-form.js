(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form || form.dataset.vmgReliabilityBound === 'true') return;
  form.dataset.vmgReliabilityBound = 'true';
  window.VMG_CONTACT_FORM_MANAGED = true;

  var DEFAULT_COUNTRY = { iso2: 'in', name: 'India', dialCode: '91' };
  var TYPE_VALUES = ['buyer', 'seller', 'quotation', 'partnership', 'documentation', 'callback', 'investor', 'finance', 'general'];
  var PREVIEW_TEST_HOST = 'deploy-preview-12--exquisite-hotteok-531d58.netlify.app';
  var TURNSTILE_PREVIEW_SITEKEY = '1x00000000000000000000AA';
  var MAX_ATTACHMENTS = 10;
  var MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
  var MAX_SINGLE_ATTACHMENT_BYTES = 10 * 1024 * 1024;
  var ALLOWED_ATTACHMENT_TYPES = {
    'image/jpeg': true,
    'image/png': true,
    'image/webp': true,
    'image/heic': true,
    'image/heif': true,
    'application/pdf': true
  };

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
      var privacy = form.querySelector('.form-checkbox');
      if (privacy) {
        var field = document.createElement('div');
        field.className = 'form-field full-width vmg-attachments-field';
        field.innerHTML = '' +
          '<label for="attachments">Attachments (optional)</label>' +
          '<button type="button" class="vmg-attachment-picker" id="attachment-picker" aria-controls="attachments">' +
            '<span class="vmg-attachment-icon" aria-hidden="true">↥</span>' +
            '<span><span class="vmg-attachment-title">Add photos or documents</span>' +
            '<span class="vmg-attachment-support">Material photos, specifications or supporting documents</span></span>' +
            '<span class="vmg-attachment-rules">JPG, PNG, WEBP, HEIC or PDF · Up to 10 files · 25 MB total</span>' +
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

  var startedAt = Date.now();
  var countryByIso2 = {};
  var selectedFiles = [];
  var phoneEngineInput = null;
  var iti = null;
  var phoneConflict = false;
  var phoneReady = false;
  var countryReady = false;
  var submitting = false;
  var turnstileWidgetId = null;
  var turnstileToken = '';

  function setSubmitState(state) {
    if (window.VMGSubmitState && submitButton) {
      window.VMGSubmitState.set(submitButton, state);
      return;
    }
    if (submitButton) submitButton.disabled = state === 'loading' || state === 'success';
  }

  function countryData() {
    if (!window.intlTelInputGlobals || typeof window.intlTelInputGlobals.getCountryData !== 'function') return [];
    try { return window.intlTelInputGlobals.getCountryData().slice(); } catch (_) { return []; }
  }

  function setHardIndiaDefault(clearPhone) {
    if (dialCodeEl) dialCodeEl.textContent = '+91';
    if (phoneGroup) phoneGroup.setAttribute('aria-label', 'India +91, phone number');
    if (clearPhone !== false && fields.phone) fields.phone.value = '';
    if (!fields.country) return;

    var india = Array.prototype.slice.call(fields.country.options || []).find(function (option) {
      return option.value === 'in' || option.textContent.trim().toLowerCase() === 'india';
    });
    if (india) {
      india.value = 'in';
      india.dataset.dialCode = '91';
      india.selected = true;
      fields.country.value = 'in';
    }
  }

  function populateCountriesFromLibrary() {
    if (!fields.country) return false;
    var data = countryData();
    if (!data.length) return false;

    var nextByIso2 = {};
    var fragment = document.createDocumentFragment();
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select country';
    fragment.appendChild(placeholder);

    data.forEach(function (item) {
      if (!item || !item.iso2 || !item.name || !item.dialCode) return;
      nextByIso2[item.iso2] = item;
      var option = document.createElement('option');
      option.value = item.iso2;
      option.textContent = item.name;
      option.dataset.dialCode = item.dialCode;
      fragment.appendChild(option);
    });

    if (!nextByIso2.in || !nextByIso2.in.dialCode) return false;
    countryByIso2 = nextByIso2;
    fields.country.innerHTML = '';
    fields.country.appendChild(fragment);
    fields.country.value = DEFAULT_COUNTRY.iso2;
    fields.country.dataset.vmgCountryReady = 'true';
    fields.country.dataset.vmgCountryCount = String(Object.keys(countryByIso2).length);
    countryReady = true;
    return true;
  }

  function waitForCountryData() {
    var delays = [0, 16, 100, 250, 500];
    return new Promise(function (resolve) {
      var attempt = 0;
      function tryNow() {
        if (populateCountriesFromLibrary()) { resolve(true); return; }
        if (attempt >= delays.length - 1) {
          countryReady = false;
          if (fields.country) fields.country.dataset.vmgCountryReady = 'error';
          resolve(false);
          return;
        }
        attempt += 1;
        if (attempt === 1 && window.requestAnimationFrame) {
          window.requestAnimationFrame(function () { window.setTimeout(tryNow, delays[attempt]); });
        } else {
          window.setTimeout(tryNow, delays[attempt]);
        }
      }
      tryNow();
    });
  }

  function initPhoneEngine() {
    if (!window.intlTelInput) return false;
    phoneEngineInput = document.createElement('input');
    phoneEngineInput.type = 'tel';
    phoneEngineInput.tabIndex = -1;
    phoneEngineInput.setAttribute('aria-hidden', 'true');
    phoneEngineInput.className = 'vmg-phone-validation-engine';
    form.appendChild(phoneEngineInput);

    iti = window.intlTelInput(phoneEngineInput, {
      initialCountry: DEFAULT_COUNTRY.iso2,
      allowDropdown: false,
      separateDialCode: false,
      nationalMode: false,
      autoPlaceholder: 'off',
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/utils.js'
    });
    var wrapper = phoneEngineInput.closest('.iti');
    if (wrapper) wrapper.classList.add('vmg-phone-validation-engine-wrap');
    return true;
  }

  function waitForPhoneReady() {
    if (!iti) return Promise.resolve(false);

    // intl-tel-input v18 exposes iti.promise for async utils loading. This is authoritative.
    if (iti.promise && typeof iti.promise.then === 'function') {
      return iti.promise.then(function () {
        phoneReady = true;
        return true;
      }).catch(function () {
        phoneReady = false;
        return false;
      });
    }

    // Legacy/fallback path: wait for the actual utils global, never method existence alone.
    return new Promise(function (resolve) {
      var delays = [0, 50, 120, 250, 500, 900];
      var attempt = 0;
      function check() {
        if (window.intlTelInputUtils) {
          phoneReady = true;
          resolve(true);
          return;
        }
        if (attempt >= delays.length - 1) {
          phoneReady = false;
          resolve(false);
          return;
        }
        attempt += 1;
        window.setTimeout(check, delays[attempt]);
      }
      check();
    });
  }

  function selectedCountryMeta() {
    if (!fields.country) return null;
    var iso2 = fields.country.value;
    if (iso2 && countryByIso2[iso2]) return countryByIso2[iso2];
    var option = fields.country.options[fields.country.selectedIndex];
    if (option && option.value && option.dataset.dialCode) {
      return { iso2: option.value, name: option.textContent.trim(), dialCode: option.dataset.dialCode };
    }
    return null;
  }

  function countryName() {
    var meta = selectedCountryMeta();
    return meta ? meta.name : '';
  }

  function updateDialCode() {
    var meta = selectedCountryMeta();
    if (!meta || !meta.dialCode) {
      if (fields.country && fields.country.value === DEFAULT_COUNTRY.iso2) {
        if (dialCodeEl) dialCodeEl.textContent = '+91';
        return true;
      }
      return false;
    }
    if (dialCodeEl) dialCodeEl.textContent = '+' + meta.dialCode;
    if (phoneGroup) phoneGroup.setAttribute('aria-label', meta.name + ' +' + meta.dialCode + ', phone number');
    return true;
  }

  function setPhoneEngineCountry() {
    var meta = selectedCountryMeta();
    if (!meta || !iti) return false;
    try { iti.setCountry(meta.iso2); } catch (_) { return false; }
    return updateDialCode();
  }

  function digitsOnly(value) { return String(value || '').replace(/\D/g, ''); }

  function clearPhoneConflict() {
    phoneConflict = false;
    if (fields.phone) delete fields.phone.dataset.phoneConflict;
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
    if (!meta || !meta.dialCode) return;

    if (raw.charAt(0) === '+') {
      var prefix = '+' + meta.dialCode;
      if (raw.indexOf(prefix) === 0) {
        fields.phone.value = digitsOnly(raw.slice(prefix.length));
        clearPhoneConflict();
        clearInvalid(fields.phone);
      } else {
        setPhoneConflict();
      }
    } else {
      fields.phone.value = digitsOnly(raw);
      clearPhoneConflict();
    }
  }

  function canonicalPhone() {
    var meta = selectedCountryMeta();
    var national = fields.phone ? digitsOnly(fields.phone.value) : '';
    if (!meta || !meta.dialCode || !national) return '';
    return '+' + meta.dialCode + national;
  }

  async function validatePhone() {
    if (!fields.phone || !fields.phone.value.trim() || phoneConflict) return false;
    var ready = phoneReady || await waitForPhoneReady();
    if (!ready || !iti) return null;

    var meta = selectedCountryMeta();
    var canonical = canonicalPhone();
    if (!meta || !canonical) return false;

    try {
      iti.setCountry(meta.iso2);
      iti.setNumber(canonical);
      return iti.isValidNumber();
    } catch (_) {
      return null;
    }
  }

  async function fullPhone() {
    var valid = await validatePhone();
    if (valid !== true) return '';
    try {
      var number = String(iti.getNumber() || '').replace(/\s+/g, '');
      if (/^\+[1-9]\d{6,14}$/.test(number)) return number;
    } catch (_) {}
    return canonicalPhone();
  }

  function errorElement(control) {
    if (!control) return null;
    var id = control.getAttribute('aria-describedby');
    if (id) {
      var element = document.getElementById(id.split(/\s+/)[0]);
      if (element) return element;
    }
    return control === fields.privacy ? form.querySelector('.form-checkbox .error') : null;
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
    var custom = customSelectRoot(control);
    if (custom) custom.classList.add('is-invalid');
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
    var custom = customSelectRoot(control);
    if (custom) custom.classList.remove('is-invalid');
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
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function attachmentKey(file) {
    return [file.name, file.size, file.lastModified].join('|');
  }

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

      var size = document.createElement('span');
      size.className = 'vmg-attachment-chip-size';
      size.textContent = readableBytes(file.size);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'vmg-attachment-remove';
      remove.setAttribute('aria-label', 'Remove ' + file.name);
      remove.textContent = '×';
      remove.addEventListener('click', function () {
        selectedFiles.splice(index, 1);
        clearAttachmentError();
        renderAttachments();
      });

      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(size);
      item.appendChild(remove);
      attachmentList.appendChild(item);
    });
  }

  function addAttachments(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []);
    if (!incoming.length) return;

    var unsupported = incoming.find(function (file) { return !ALLOWED_ATTACHMENT_TYPES[file.type]; });
    if (unsupported) {
      setAttachmentError('Unsupported file type: ' + unsupported.name + '. Use JPG, PNG, WEBP, HEIC or PDF.');
      fields.attachments.value = '';
      return;
    }

    var oversized = incoming.find(function (file) { return file.size > MAX_SINGLE_ATTACHMENT_BYTES; });
    if (oversized) {
      setAttachmentError(oversized.name + ' is larger than the 10 MB per-file limit.');
      fields.attachments.value = '';
      return;
    }

    var existing = {};
    selectedFiles.forEach(function (file) { existing[attachmentKey(file)] = true; });
    var combined = selectedFiles.slice();
    incoming.forEach(function (file) {
      var key = attachmentKey(file);
      if (!existing[key]) { existing[key] = true; combined.push(file); }
    });

    if (combined.length > MAX_ATTACHMENTS) {
      setAttachmentError('You can attach up to 10 files.');
      fields.attachments.value = '';
      return;
    }

    var total = combined.reduce(function (sum, file) { return sum + file.size; }, 0);
    if (total > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('Attachments must be 25 MB total or less.');
      fields.attachments.value = '';
      return;
    }

    selectedFiles = combined;
    clearAttachmentError();
    renderAttachments();
    fields.attachments.value = '';
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

  function serializeAttachments() {
    return Promise.all(selectedFiles.map(fileToPayload));
  }

  function clearTurnstileError() {
    if (turnstileHost) turnstileHost.classList.remove('is-invalid');
    if (turnstileError) { turnstileError.textContent = ''; turnstileError.classList.remove('show'); }
  }

  function setTurnstileError(message) {
    if (turnstileHost) turnstileHost.classList.add('is-invalid');
    if (turnstileError) { turnstileError.textContent = message; turnstileError.classList.add('show'); }
  }

  async function validateAll() {
    var ok = true;
    var name = fields.fullname.value.trim();
    var email = fields.email.value.trim();
    var organization = fields.organization.value.trim();
    var message = fields.message.value.trim();

    if (name.length < 2 || name.length > 80) { setInvalid(fields.fullname, 'Please enter your full name (2–80 characters).'); ok = false; } else clearInvalid(fields.fullname);
    if (!countryReady || !fields.country.value || !selectedCountryMeta()) { setInvalid(fields.country, countryReady ? 'Please select a country.' : 'Country list is still initializing. Please try again.'); ok = false; } else clearInvalid(fields.country);
    if (!validEmail(email)) { setInvalid(fields.email, 'Please enter a valid email address.'); ok = false; } else clearInvalid(fields.email);

    if (!fields.phone.value.trim()) {
      setInvalid(fields.phone, 'Please enter your phone number.');
      ok = false;
    } else if (phoneConflict) {
      setInvalid(fields.phone, 'The number includes a different country code. Change Country first.');
      ok = false;
    } else {
      var phoneValid = await validatePhone();
      if (phoneValid === null) { setInvalid(fields.phone, 'Phone validation is still loading. Please try again.'); ok = false; }
      else if (!phoneValid) { setInvalid(fields.phone, 'Please enter a valid phone number for ' + (countryName() || 'the selected country') + '.'); ok = false; }
      else clearInvalid(fields.phone);
    }

    if (organization.length > 120) { setInvalid(fields.organization, 'Organization must be 120 characters or fewer.'); ok = false; } else clearInvalid(fields.organization);
    if (TYPE_VALUES.indexOf(fields.type.value) === -1) { setInvalid(fields.type, 'Please select an enquiry type.'); ok = false; } else clearInvalid(fields.type);
    if (message.length < 10 || message.length > 3000) { setInvalid(fields.message, 'Please enter a message between 10 and 3000 characters.'); ok = false; } else clearInvalid(fields.message);

    var totalBytes = selectedFiles.reduce(function (sum, file) { return sum + file.size; }, 0);
    var invalidAttachment = selectedFiles.some(function (file) {
      return !ALLOWED_ATTACHMENT_TYPES[file.type] || file.size > MAX_SINGLE_ATTACHMENT_BYTES;
    });
    if (selectedFiles.length > MAX_ATTACHMENTS || totalBytes > MAX_ATTACHMENT_BYTES || invalidAttachment) {
      setAttachmentError('Please review the selected attachments.');
      ok = false;
    } else clearAttachmentError();

    if (!fields.privacy.checked) { setInvalid(fields.privacy, 'Please accept the privacy policy to continue.'); ok = false; } else clearInvalid(fields.privacy);
    if (!turnstileToken) { setTurnstileError('Please complete the security verification and try again.'); ok = false; } else clearTurnstileError();
    return ok;
  }

  function bindLiveValidation() {
    fields.fullname.addEventListener('input', function () { if (this.value.trim().length >= 2) clearInvalid(this); });
    fields.email.addEventListener('input', function () { if (validEmail(this.value.trim())) clearInvalid(this); });
    fields.organization.addEventListener('input', function () { if (this.value.trim().length <= 120) clearInvalid(this); });
    fields.message.addEventListener('input', function () { var n = this.value.trim().length; if (n >= 10 && n <= 3000) clearInvalid(this); });
    fields.country.addEventListener('change', function () {
      if (this.value) clearInvalid(this);
      setPhoneEngineCountry();
      normalizeVisiblePhone();
    });
    fields.phone.addEventListener('input', normalizeVisiblePhone);
    fields.phone.addEventListener('blur', normalizeVisiblePhone);
    fields.type.addEventListener('change', function () { if (TYPE_VALUES.indexOf(this.value) !== -1) clearInvalid(this); });
    fields.privacy.addEventListener('change', function () { if (this.checked) clearInvalid(this); });
    attachmentPicker.addEventListener('click', function () { fields.attachments.click(); });
    fields.attachments.addEventListener('change', function () { addAttachments(this.files); });
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
    if (window.turnstile && turnstileWidgetId !== null) {
      try { window.turnstile.reset(turnstileWidgetId); } catch (_) {}
    }
  }

  function showResult(message, kind) {
    if (!result) return;
    result.textContent = message || '';
    result.className = 'form-result' + (kind ? ' ' + kind : '');
  }

  function resetAttachments() {
    selectedFiles = [];
    fields.attachments.value = '';
    clearAttachmentError();
    renderAttachments();
  }

  function resetFormAfterSuccess() {
    form.reset();
    startedAt = Date.now();
    fields.startedAt.value = String(startedAt);
    resetAttachments();
    fields.country.value = DEFAULT_COUNTRY.iso2;
    fields.country.dispatchEvent(new Event('change', { bubbles: true }));
    fields.type.value = '';
    fields.type.dispatchEvent(new Event('change', { bubbles: true }));
    fields.phone.value = '';
    clearPhoneConflict();
    setPhoneEngineCountry();
    resetTurnstile();
  }

  async function payload() {
    var attachments = await serializeAttachments();
    var phone = await fullPhone();
    return {
      source: 'main',
      fullName: fields.fullname.value.trim(),
      fullname: fields.fullname.value.trim(),
      contact: phone,
      contactNumber: phone,
      phone: phone,
      email: fields.email.value.trim(),
      mailId: fields.email.value.trim(),
      country: countryName(),
      Country: countryName(),
      countryIso2: fields.country.value,
      organization: fields.organization.value.trim(),
      type: fields.type.value,
      message: fields.message.value.trim(),
      privacy: true,
      attachments: attachments,
      attachmentCount: attachments.length,
      website: fields.honeypot ? fields.honeypot.value : '',
      formStartedAt: Number(fields.startedAt.value || startedAt),
      submittedAt: new Date().toISOString(),
      page: window.location.href,
      'cf-turnstile-response': turnstileToken
    };
  }

  async function submitContact(data) {
    var endpoint = (window.AppConfig && (window.AppConfig.contactEndpoint || window.AppConfig.googleScriptUrl)) || '';
    if (!endpoint) throw new Error('Submission endpoint is not configured.');
    if (!(window.AppConfig && window.AppConfig.contactSecurityReady === true)) {
      throw new Error('Server-side security and attachment handling are not deployed yet.');
    }

    var response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('The server could not accept your message.');

    var body = {};
    try { body = await response.json(); } catch (_) {}
    if (!body || body.success !== true) throw new Error((body && body.message) || 'The server did not confirm your submission.');
    return body;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (submitting) return;
    showResult('', '');

    if (!(await validateAll())) {
      setSubmitState('error');
      showResult('Please correct the highlighted fields.', 'error');
      window.setTimeout(function () { setSubmitState('idle'); }, 260);
      return;
    }

    submitting = true;
    setSubmitState('loading');
    showResult('Sending your message securely…', 'submitting');
    try {
      var data = await payload();
      await submitContact(data);
      setSubmitState('success');
      showResult('Thank you! Your message has been sent.', 'success');
      resetFormAfterSuccess();
      window.setTimeout(function () { setSubmitState('idle'); showResult('', ''); }, 1800);
    } catch (error) {
      setSubmitState('error');
      showResult(error && error.message ? error.message : 'Unable to send your message. Please try again.', 'error');
      resetTurnstile();
      window.setTimeout(function () { setSubmitState('idle'); }, 280);
    } finally {
      submitting = false;
    }
  }, true);

  async function initializeContact() {
    // Hard visual default before any async/library-dependent work.
    setHardIndiaDefault(true);
    fields.startedAt.value = String(startedAt);
    bindLiveValidation();
    renderAttachments();
    renderTurnstile();

    // Canonical country data first. The visible custom Country UI is gated in config.js
    // and is not constructed until the ready event below.
    var countriesLoaded = await waitForCountryData();
    if (!countriesLoaded) {
      setInvalid(fields.country, 'Country list could not initialize. Please refresh and try again.');
      return;
    }

    fields.country.value = DEFAULT_COUNTRY.iso2;
    setHardIndiaDefault(true);

    if (!initPhoneEngine()) {
      setInvalid(fields.phone, 'Phone validation could not initialize. Please refresh and try again.');
      return;
    }

    setPhoneEngineCountry();
    updateDialCode();
    document.dispatchEvent(new CustomEvent('vmg:contact-countries-ready', {
      detail: { count: Object.keys(countryByIso2).length }
    }));

    // Utils load may complete later; validation awaits this promise/state before judging a number.
    waitForPhoneReady();
  }

  initializeContact();
})();

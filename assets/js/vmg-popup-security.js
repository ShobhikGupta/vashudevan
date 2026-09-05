(function () {
  'use strict';

  var ELIGIBLE_PATHS = ['/', '/index.html', '/market-prices', '/market-prices/', '/market-prices/index.html'];
  var PREVIEW_SITEKEY = '1x00000000000000000000AA';
  var PROJECT_SUFFIX = '--exquisite-hotteok-531d58.netlify.app';
  var observer = null;
  var realFetch = window.fetch ? window.fetch.bind(window) : null;

  function isEligiblePage() {
    return ELIGIBLE_PATHS.indexOf(window.location.pathname || '/') !== -1;
  }

  function isPreviewHost() {
    var host = String(window.location.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host.slice(-PROJECT_SUFFIX.length) === PROJECT_SUFFIX;
  }

  function api() { return window.VMGCountryPhone || null; }

  function currentForm() {
    return document.querySelector('.opening-popup-form[data-vmg-popup-security-bound="true"]');
  }

  function setDialText(dial, value) {
    if (dial && dial.textContent !== value) dial.textContent = value;
  }

  function ensureTurnstileApi(done) {
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      done();
      return;
    }

    var existing = document.querySelector('script[data-vmg-turnstile-api]') || document.querySelector('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]');
    if (existing) {
      existing.addEventListener('load', done, { once: true });
      window.setTimeout(function () {
        if (window.turnstile && typeof window.turnstile.render === 'function') done();
      }, 250);
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-vmg-turnstile-api', 'true');
    script.addEventListener('load', done, { once: true });
    document.head.appendChild(script);
  }

  function ensureSecurityStyles() {
    if (document.getElementById('vmg-popup-security-style')) return;
    var style = document.createElement('style');
    style.id = 'vmg-popup-security-style';
    style.textContent = [
      '.vmg-popup-honeypot{position:absolute!important;left:-10000px!important;top:auto!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}',
      '.opening-popup-turnstile-field{position:absolute;left:0;bottom:0;width:1px;height:1px;overflow:visible;pointer-events:none}',
      '.opening-popup-turnstile{width:1px;height:1px;overflow:visible}',
      '.opening-popup-turnstile-error{position:absolute;left:0;top:8px;width:min(340px,80vw);font-size:12px;line-height:1.35;color:#b42318;pointer-events:none}',
      '.opening-popup-turnstile-error:empty{display:none}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureHiddenFields(form) {
    var honeypot = form.querySelector('input[name="website"]');
    if (!honeypot) {
      honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website';
      honeypot.className = 'vmg-popup-honeypot';
      honeypot.tabIndex = -1;
      honeypot.autocomplete = 'off';
      honeypot.setAttribute('aria-hidden', 'true');
      form.appendChild(honeypot);
    }

    var started = form.querySelector('input[name="formStartedAt"]');
    if (!started) {
      started = document.createElement('input');
      started.type = 'hidden';
      started.name = 'formStartedAt';
      form.appendChild(started);
    }
    started.value = String(Date.now());
  }

  function ensureTurnstileField(form) {
    var existing = form.querySelector('.opening-popup-turnstile-field');
    if (existing) return existing;

    var field = document.createElement('div');
    field.className = 'opening-popup-turnstile-field';
    field.setAttribute('aria-live', 'polite');
    field.innerHTML = '<div class="opening-popup-turnstile" data-vmg-popup-turnstile></div>' +
      '<div class="opening-popup-turnstile-error" data-vmg-popup-turnstile-error role="alert"></div>';
    form.appendChild(field);
    return field;
  }

  function setTurnstileError(form, message) {
    var error = form.querySelector('[data-vmg-popup-turnstile-error]');
    if (error) error.textContent = message || '';
  }

  function resetTurnstile(form) {
    form.dataset.vmgPopupTurnstileToken = '';
    form.dataset.vmgPopupTurnstilePendingSubmit = 'false';
    var widgetId = form.dataset.vmgPopupTurnstileWidgetId;
    try {
      if (window.turnstile && widgetId !== undefined && widgetId !== '') window.turnstile.reset(widgetId);
    } catch (_) {}
  }

  function continuePendingSubmit(form) {
    if (form.dataset.vmgPopupTurnstilePendingSubmit !== 'true') return;
    form.dataset.vmgPopupTurnstilePendingSubmit = 'false';
    window.setTimeout(function () {
      if (!document.documentElement.contains(form)) return;
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else {
        var event;
        try { event = new Event('submit', { bubbles: true, cancelable: true }); }
        catch (_) { event = document.createEvent('Event'); event.initEvent('submit', true, true); }
        form.dispatchEvent(event);
      }
    }, 0);
  }

  function popupSiteKey() {
    if (isPreviewHost()) return PREVIEW_SITEKEY;
    return (window.AppConfig && window.AppConfig.popupTurnstileSiteKey) || '';
  }

  function renderTurnstile(form) {
    var host = form.querySelector('[data-vmg-popup-turnstile]');
    if (!host || host.dataset.rendered === 'true') return;

    ensureTurnstileApi(function () {
      if (!document.documentElement.contains(form) || !window.turnstile || typeof window.turnstile.render !== 'function') return;
      if (host.dataset.rendered === 'true') return;

      var sitekey = popupSiteKey();
      if (!sitekey) {
        form.dataset.vmgPopupTurnstileReady = 'false';
        setTurnstileError(form, 'Security verification is not configured yet.');
        return;
      }

      var options = {
        sitekey: sitekey,
        theme: 'light',
        appearance: 'interaction-only',
        execution: 'execute',
        action: 'popup_form',
        callback: function (token) {
          form.dataset.vmgPopupTurnstileToken = token || '';
          setTurnstileError(form, '');
          continuePendingSubmit(form);
        },
        'expired-callback': function () {
          form.dataset.vmgPopupTurnstileToken = '';
        },
        'timeout-callback': function () {
          form.dataset.vmgPopupTurnstileToken = '';
          form.dataset.vmgPopupTurnstilePendingSubmit = 'false';
          setTurnstileError(form, 'Security verification timed out. Please try again.');
        },
        'error-callback': function () {
          form.dataset.vmgPopupTurnstileToken = '';
          form.dataset.vmgPopupTurnstilePendingSubmit = 'false';
          setTurnstileError(form, 'Security verification failed. Please try again.');
        }
      };

      try {
        var id = window.turnstile.render(host, options);
        form.dataset.vmgPopupTurnstileWidgetId = String(id);
        form.dataset.vmgPopupTurnstileReady = 'true';
        host.dataset.rendered = 'true';
      } catch (error) {
        form.dataset.vmgPopupTurnstileReady = 'false';
        setTurnstileError(form, 'Security verification could not be loaded. Please try again.');
      }
    });
  }

  function executeTurnstile(form) {
    var widgetId = form.dataset.vmgPopupTurnstileWidgetId;
    if (form.dataset.vmgPopupTurnstileReady !== 'true' || widgetId === undefined || widgetId === '') {
      setTurnstileError(form, 'Security verification is still loading. Please try again.');
      renderTurnstile(form);
      return false;
    }
    try {
      form.dataset.vmgPopupTurnstilePendingSubmit = 'true';
      setTurnstileError(form, '');
      window.turnstile.execute(widgetId);
      return true;
    } catch (_) {
      form.dataset.vmgPopupTurnstilePendingSubmit = 'false';
      setTurnstileError(form, 'Security verification failed. Please try again.');
      return false;
    }
  }

  function syncSharedCountry(form) {
    var shared = api();
    var country = form.querySelector('#op-country');
    var phone = form.querySelector('#op-phone');
    var dial = form.querySelector('#op-dial-code');
    if (!shared || !country || !phone || !dial) return;

    var previous = shared.getByValue(country.value) ? country.value : 'india';
    country.innerHTML = shared.optionMarkup(previous);
    country.value = shared.getByValue(previous) ? previous : 'india';
    country.dataset.vmgSharedCountry = 'true';
    country.dataset.vmgCountryCount = String(shared.count);

    function sync() {
      var entry = shared.getByValue(country.value || 'india');
      if (!entry) return;
      setDialText(dial, '+' + entry.dialCode);
      try {
        if (phone._iti && typeof phone._iti.setCountry === 'function') phone._iti.setCountry(entry.iso2);
      } catch (_) {}
      window.setTimeout(function () {
        var current = shared.getByValue(country.value || 'india');
        if (current) setDialText(dial, '+' + current.dialCode);
      }, 30);
    }

    country.addEventListener('change', sync);
    country.addEventListener('input', sync);
    sync();
  }

  function popupPhoneParts(form) {
    var shared = api();
    var country = form && form.querySelector('#op-country');
    var phone = form && form.querySelector('#op-phone');
    if (!shared || !country || !phone) return null;
    var entry = shared.getByValue(country.value || 'india');
    if (!entry) return null;
    var national = shared.nationalDigits(phone.value);
    if (!national || national.length < 6 || national.length > 14) return null;
    var e164 = '+' + entry.dialCode + national;
    if (!/^\+[1-9]\d{6,14}$/.test(e164)) return null;
    return {
      e164: e164,
      dialCode: '+' + entry.dialCode,
      national: national,
      display: '+' + entry.dialCode + ' ' + national,
      country: entry.name,
      iso2: entry.iso2
    };
  }

  function augmentPopupData(data, form) {
    if (!data || String(data.source || '').toLowerCase() !== 'popup' || !form) return data;
    var parts = popupPhoneParts(form);
    if (parts) {
      data.phone = parts.e164;
      data.contact = parts.e164;
      data.contactNumber = parts.e164;
      data.phoneE164 = parts.e164;
      data.phoneDialCode = parts.dialCode;
      data.phoneNational = parts.national;
      data.phoneDisplay = parts.display;
      data['PHONE NUMBER'] = parts.display;
      data.country = parts.country;
      data.Country = parts.country;
      data.countryIso2 = parts.iso2;
    }
    var hp = form.querySelector('input[name="website"]');
    var started = form.querySelector('input[name="formStartedAt"]');
    data.website = hp ? hp.value : '';
    data.formStartedAt = Number(started && started.value ? started.value : Date.now());
    data['cf-turnstile-response'] = form.dataset.vmgPopupTurnstileToken || '';
    return data;
  }

  function augmentFeedbackData(data) {
    if (!data || String(data.source || '').toLowerCase() !== 'website-feedback') return data;
    var form = document.getElementById('vmg-feedback-form');
    if (!form) return data;
    var hp = form.querySelector('input[name="website"]');
    var started = form.querySelector('input[name="formStartedAt"]');
    data.website = hp ? hp.value : '';
    data.formStartedAt = Number(started && started.value ? started.value : Date.now());
    return data;
  }

  function augmentJsonBody(body) {
    if (typeof body !== 'string') return body;
    var data;
    try { data = JSON.parse(body); } catch (_) { return body; }
    var source = String((data && data.source) || '').toLowerCase();
    if (source === 'popup') data = augmentPopupData(data, currentForm());
    else if (source === 'website-feedback') data = augmentFeedbackData(data);
    else if (source === 'trade-updates-subscription' && data.email) {
      data.email = String(data.email).trim().toLowerCase();
      data['MAIL ID'] = data.email;
    }
    return JSON.stringify(data);
  }

  function augmentFormBody(body) {
    if (typeof body !== 'string') return body;
    var params;
    try { params = new URLSearchParams(body); } catch (_) { return body; }
    if (String(params.get('source') || '').toLowerCase() !== 'popup') return body;
    var form = currentForm();
    if (!form) return body;
    var parts = popupPhoneParts(form);
    if (parts) {
      params.set('phone', parts.e164);
      params.set('contact', parts.e164);
      params.set('contactNumber', parts.e164);
      params.set('phoneE164', parts.e164);
      params.set('phoneDialCode', parts.dialCode);
      params.set('phoneNational', parts.national);
      params.set('phoneDisplay', parts.display);
      params.set('PHONE NUMBER', parts.display);
      params.set('country', parts.country);
      params.set('Country', parts.country);
      params.set('countryIso2', parts.iso2);
    }
    var hp = form.querySelector('input[name="website"]');
    var started = form.querySelector('input[name="formStartedAt"]');
    params.set('website', hp ? hp.value : '');
    params.set('formStartedAt', started && started.value ? started.value : String(Date.now()));
    params.set('cf-turnstile-response', form.dataset.vmgPopupTurnstileToken || '');
    return params.toString();
  }

  function installFetchBridge() {
    if (!realFetch || window.__VMG_PUBLIC_FORM_SECURITY_FETCH__) return;
    window.__VMG_PUBLIC_FORM_SECURITY_FETCH__ = true;
    window.fetch = function (input, init) {
      if (!init || typeof init.body !== 'string') return realFetch(input, init);
      var next = Object.assign({}, init);
      var trimmed = init.body.trim();
      next.body = trimmed.charAt(0) === '{' ? augmentJsonBody(init.body) : augmentFormBody(init.body);
      return realFetch(input, next);
    };
  }

  function bindFeedbackGuard() {
    var form = document.getElementById('vmg-feedback-form');
    if (!form || form.dataset.vmgGuardBound === 'true') return;
    form.dataset.vmgGuardBound = 'true';

    var hp = document.createElement('input');
    hp.type = 'text';
    hp.name = 'website';
    hp.className = 'vmg-popup-honeypot';
    hp.tabIndex = -1;
    hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    form.appendChild(hp);

    var started = document.createElement('input');
    started.type = 'hidden';
    started.name = 'formStartedAt';
    started.value = String(Date.now());
    form.appendChild(started);
  }

  function bindPopup(form) {
    if (!form || form.dataset.vmgPopupSecurityBound === 'true') return;
    form.dataset.vmgPopupSecurityBound = 'true';
    form.dataset.vmgPopupTurnstilePendingSubmit = 'false';
    ensureSecurityStyles();
    ensureHiddenFields(form);
    ensureTurnstileField(form);
    syncSharedCountry(form);
    renderTurnstile(form);

    form.addEventListener('submit', function (event) {
      if (form.dataset.vmgPopupTurnstileToken) {
        setTurnstileError(form, '');
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (form.dataset.vmgPopupTurnstilePendingSubmit !== 'true') executeTurnstile(form);
    }, true);

    var success = form.querySelector('.opening-popup-success');
    if (success && window.MutationObserver) {
      var successObserver = new MutationObserver(function () {
        var visible = window.getComputedStyle(success).display !== 'none' && (success.textContent || '').trim();
        if (visible) resetTurnstile(form);
      });
      successObserver.observe(success, { attributes: true, childList: true, characterData: true, subtree: true });
    }
  }

  function scan() {
    bindFeedbackGuard();
    var form = document.querySelector('.opening-popup-form');
    if (form) bindPopup(form);
  }

  function init() {
    installFetchBridge();
    ensureSecurityStyles();
    bindFeedbackGuard();
    if (!isEligiblePage()) return;

    scan();
    if (!window.MutationObserver) return;
    observer = new MutationObserver(function (mutations) {
      var shouldScan = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes && mutations[i].addedNodes.length) { shouldScan = true; break; }
      }
      if (shouldScan) scan();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

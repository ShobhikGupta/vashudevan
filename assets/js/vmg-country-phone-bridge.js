(function () {
  'use strict';

  function shared() { return window.VMGCountryPhone || null; }

  function applyPopupCountry() {
    var api = shared();
    var country = document.getElementById('op-country');
    var phone = document.getElementById('op-phone');
    var dial = document.getElementById('op-dial-code');
    if (!api || !country || !phone || !dial) return false;

    if (country.dataset.vmgSharedCountry !== 'true') {
      country.innerHTML = api.optionMarkup('india');
      country.value = 'india';
      country.dataset.vmgSharedCountry = 'true';
      country.dataset.vmgCountryCount = String(api.count);

      var sync = function () {
        var entry = api.getByValue(country.value);
        if (!entry) return;
        dial.textContent = '+' + entry.dialCode;
        try { if (phone._iti && typeof phone._iti.setCountry === 'function') phone._iti.setCountry(entry.iso2); } catch (_) {}
        window.setTimeout(function () {
          var current = api.getByValue(country.value);
          if (current) dial.textContent = '+' + current.dialCode;
        }, 30);
      };
      country.addEventListener('change', sync);
      country.addEventListener('input', sync);
      sync();
    }

    var current = api.getByValue(country.value || 'india');
    if (current) dial.textContent = '+' + current.dialCode;
    return true;
  }

  function popupPhoneParts() {
    var api = shared();
    var country = document.getElementById('op-country');
    var phone = document.getElementById('op-phone');
    if (!api || !country || !phone) return null;
    var entry = api.getByValue(country.value);
    if (!entry) return null;
    var national = api.nationalDigits(phone.value);
    if (!national) return null;
    return {
      e164: '+' + entry.dialCode + national,
      dialCode: '+' + entry.dialCode,
      national: national,
      display: '+' + entry.dialCode + ' ' + national,
      country: entry.name,
      iso2: entry.iso2
    };
  }

  function augmentJsonBody(body) {
    if (typeof body !== 'string') return body;
    var data;
    try { data = JSON.parse(body); } catch (_) { return body; }
    if (!data || String(data.source || '').toLowerCase() !== 'popup') return body;
    var parts = popupPhoneParts();
    if (!parts) return body;
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
    return JSON.stringify(data);
  }

  function augmentFormBody(body) {
    if (typeof body !== 'string' || body.indexOf('source=popup') === -1) return body;
    var parts = popupPhoneParts();
    if (!parts) return body;
    var params;
    try { params = new URLSearchParams(body); } catch (_) { return body; }
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
    return params.toString();
  }

  if (!window.__VMG_POPUP_PHONE_FETCH_BRIDGE__) {
    window.__VMG_POPUP_PHONE_FETCH_BRIDGE__ = true;
    var realFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (init && typeof init.body === 'string') {
        var next = Object.assign({}, init);
        next.body = init.body.trim().charAt(0) === '{' ? augmentJsonBody(init.body) : augmentFormBody(init.body);
        return realFetch(input, next);
      }
      return realFetch(input, init);
    };
  }

  function scan() { applyPopupCountry(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once: true });
  else scan();
  if (window.MutationObserver) {
    var observer = new MutationObserver(scan);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

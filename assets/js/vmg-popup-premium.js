(function () {
  'use strict';

  var SHOW_DELAY_MS = 2000;
  var REOPEN_DELAY_MS = 45000;
  var ENTER_MS = 460;
  var EXIT_MS = 380;

  var initialTimer = null;
  var reopenTimer = null;
  var submittedThisPageLoad = false;
  var active = null;
  var initialized = false;

  function isEligiblePage() {
    var path = String((window.location && window.location.pathname) || '/').replace(/\/{2,}/g, '/');
    return path === '/' ||
      path === '/index.html' ||
      path === '/market-prices' ||
      path === '/market-prices/' ||
      path === '/market-prices/index.html';
  }

  function countryApi() {
    return window.VMGCountryPhone || null;
  }

  function ensureStyles() {
    if (document.getElementById('vmg-popup-premium-style')) return;

    var style = document.createElement('style');
    style.id = 'vmg-popup-premium-style';
    style.textContent = [
      '.opening-popup-overlay.vmg-premium-overlay{opacity:0;animation:vmgPopupBackdropIn ' + ENTER_MS + 'ms cubic-bezier(.22,.8,.28,1) forwards}',
      '.opening-popup-overlay.vmg-premium-overlay.is-closing{animation:vmgPopupBackdropOut ' + EXIT_MS + 'ms cubic-bezier(.22,.8,.28,1) forwards}',
      '.opening-popup-card.vmg-premium-card{visibility:visible!important;opacity:0;transform-origin:center center;animation:vmgOldTvOpen ' + ENTER_MS + 'ms cubic-bezier(.22,.8,.28,1) forwards;border:1px solid rgba(16,24,40,.10)!important;border-radius:14px!important;box-shadow:0 24px 70px rgba(15,23,42,.22),0 4px 14px rgba(15,23,42,.07)!important;background:#fff!important}',
      '.opening-popup-card.vmg-premium-card.is-closing{pointer-events:none;animation:vmgOldTvClose ' + EXIT_MS + 'ms cubic-bezier(.22,.8,.28,1) forwards}',
      '@keyframes vmgOldTvOpen{0%{opacity:0;transform:scaleX(.04) scaleY(.015)}34%{opacity:1;transform:scaleX(.38) scaleY(.025)}66%{opacity:1;transform:scaleX(1) scaleY(.08)}100%{opacity:1;transform:scaleX(1) scaleY(1)}}',
      '@keyframes vmgOldTvClose{0%{opacity:1;transform:scaleX(1) scaleY(1)}34%{opacity:1;transform:scaleX(1) scaleY(.08)}68%{opacity:1;transform:scaleX(.34) scaleY(.025)}100%{opacity:0;transform:scaleX(.02) scaleY(.01)}}',
      '@keyframes vmgPopupBackdropIn{from{opacity:0}to{opacity:1}}',
      '@keyframes vmgPopupBackdropOut{from{opacity:1}to{opacity:0}}',
      '.opening-popup-header{display:block!important;position:relative!important;text-align:center!important}',
      '.opening-popup-header>div:not(.opening-popup-brand){width:100%!important;text-align:center!important}',
      '.opening-popup-brand{width:100%;text-align:center;margin:0 auto 14px;padding:0 0 13px;border-bottom:1px solid #e8eaed}',
      '.opening-popup-brand-logo{display:block;width:100%;max-width:282px;height:auto;object-fit:contain;object-position:center;margin:0 auto 9px}',
      '.opening-popup-contact-row{display:flex;align-items:center;justify-content:center;gap:10px;min-width:0;color:#667085;font-size:11.5px;font-weight:500;line-height:1.2;letter-spacing:-.01em;white-space:nowrap}',
      '.opening-popup-contact-item{display:inline-flex;align-items:center;gap:6px;min-width:0}',
      '.opening-popup-contact-item svg{width:17px;height:17px;flex:0 0 17px;stroke:#b6542a;stroke-width:1.65;fill:none}',
      '.opening-popup-contact-separator{width:1px;height:17px;background:#e2e5e9;flex:0 0 1px}',
      '.opening-popup-title{margin:0 0 4px!important;color:#101828!important;font-size:18px!important;line-height:1.2!important;font-weight:750!important;letter-spacing:-.025em!important}',
      '.opening-popup-subtitle{margin:0 0 10px!important;color:#737d8d!important;font-size:12.5px!important;line-height:1.45!important;font-weight:400!important}',
      '.opening-popup-close{top:0!important;right:0!important;width:28px!important;height:28px!important;display:grid!important;place-items:center!important;padding:0!important;color:#667085!important;font-size:19px!important;border-radius:8px!important;z-index:3!important}',
      '.opening-popup-close:hover{background:#f5f6f7!important;color:#344054!important}',
      '.opening-popup-submit:disabled{background:#e9ebef!important;color:#98a2b3!important;box-shadow:none!important}',
      '.opening-popup-turnstile-field{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;margin:0!important;padding:0!important;border:0!important}',
      '@media(max-width:430px){.opening-popup-brand{margin-bottom:12px;padding-bottom:11px}.opening-popup-brand-logo{max-width:238px;height:auto;margin-bottom:8px}.opening-popup-contact-row{gap:7px;font-size:10.25px}.opening-popup-contact-item{gap:4px}.opening-popup-contact-item svg{width:15px;height:15px;flex-basis:15px}.opening-popup-contact-separator{height:15px}}',
      '@media(max-width:360px){.opening-popup-contact-row{font-size:9.7px;gap:5px}.opening-popup-contact-item{gap:3px}}',
      '@media(prefers-reduced-motion:reduce){.opening-popup-overlay.vmg-premium-overlay{animation:vmgPopupBackdropIn 120ms linear forwards}.opening-popup-overlay.vmg-premium-overlay.is-closing{animation:vmgPopupBackdropOut 120ms linear forwards}.opening-popup-card.vmg-premium-card{animation:vmgPopupFadeIn 120ms linear forwards;transform:none!important}.opening-popup-card.vmg-premium-card.is-closing{animation:vmgPopupFadeOut 120ms linear forwards;transform:none!important}@keyframes vmgPopupFadeIn{from{opacity:0}to{opacity:1}}@keyframes vmgPopupFadeOut{from{opacity:1}to{opacity:0}}}'
    ].join('');
    document.head.appendChild(style);
  }

  function buildCountryOptions() {
    var api = countryApi();
    if (api && typeof api.optionMarkup === 'function') return api.optionMarkup('india');
    return '<option value="india" selected>India</option>';
  }

  function buildMarkup() {
    return [
      '<div class="opening-popup-header">',
        '<div class="opening-popup-brand">',
          '<img class="opening-popup-brand-logo" src="/assets/img/vmg-combined-logo.png" alt="Vashudevan MetGlobal LLP" decoding="async">',
          '<div class="opening-popup-contact-row" aria-label="Vashudevan contact details">',
            '<span class="opening-popup-contact-item">',
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.75 5.75h16.5v12.5H3.75z"/><path d="m4.5 7 7.5 6 7.5-6"/></svg>',
              '<span>exim@vashudevan.com</span>',
            '</span>',
            '<span class="opening-popup-contact-separator" aria-hidden="true"></span>',
            '<span class="opening-popup-contact-item">',
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 3.75 4.8 6.15c-.6.6-.72 1.5-.3 2.25 2.55 4.55 6.1 8.1 10.65 10.65.75.42 1.65.3 2.25-.3l2.4-2.5-4-3.1-1.9 1.9c-2.2-1.25-3.95-3-5.2-5.2l1.9-1.9-3.3-4.2Z"/></svg>',
              '<span>+91 9879208178</span>',
            '</span>',
          '</div>',
        '</div>',
        '<div>',
          '<h3 class="opening-popup-title">Let\'s Stay Connected</h3>',
          '<p class="opening-popup-subtitle">Please share your details so we can reach you better.</p>',
        '</div>',
        '<button type="button" class="opening-popup-close" aria-label="Close">×</button>',
      '</div>',
      '<form class="opening-popup-form" novalidate>',
        '<div class="field">',
          '<label for="op-country">Country*</label>',
          '<select id="op-country" name="country" required aria-required="true">' + buildCountryOptions() + '</select>',
          '<div class="error-text" data-for="country"></div>',
        '</div>',
        '<div class="field">',
          '<label for="op-phone">Phone Number*</label>',
          '<div class="opening-phone-wrap">',
            '<div class="opening-dial-code" id="op-dial-code">+91</div>',
            '<input id="op-phone" name="contactNumber" type="tel" placeholder="Phone Number" inputmode="tel" required aria-required="true">',
          '</div>',
          '<div class="error-text" data-for="phone"></div>',
        '</div>',
        '<div class="field">',
          '<label for="op-email">Email ID*</label>',
          '<input id="op-email" name="EmailID" type="email" placeholder="Email ID" inputmode="email" autocomplete="email" required aria-required="true">',
          '<div class="error-text" data-for="email"></div>',
        '</div>',
        '<div class="opening-popup-actions"><button type="submit" class="opening-popup-submit" disabled>Submit</button></div>',
        '<div class="opening-popup-success" style="display:none;">Thank you! We\'ll be in touch soon.</div>',
      '</form>'
    ].join('');
  }

  function clearTimer(name) {
    if (name === 'initial' && initialTimer !== null) {
      window.clearTimeout(initialTimer);
      initialTimer = null;
    }
    if (name === 'reopen' && reopenTimer !== null) {
      window.clearTimeout(reopenTimer);
      reopenTimer = null;
    }
  }

  function scheduleReopen() {
    clearTimer('reopen');
    if (!isEligiblePage() || submittedThisPageLoad) return;
    reopenTimer = window.setTimeout(function () {
      reopenTimer = null;
      openPopup();
    }, REOPEN_DELAY_MS);
  }

  function errorEl(card, key) {
    return card.querySelector('.error-text[data-for="' + key + '"]');
  }

  function setError(card, key, message) {
    var el = errorEl(card, key);
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('show', !!message);
  }

  function validateLive(card) {
    var country = card.querySelector('#op-country');
    var phone = card.querySelector('#op-phone');
    var email = card.querySelector('#op-email');
    var button = card.querySelector('.opening-popup-submit');
    if (!country || !phone || !email || !button) return false;

    var phoneValue = phone.value.trim();
    var emailValue = email.value.trim();
    var phoneOk = !!phoneValue && /^[0-9\-()\s+]{6,20}$/.test(phoneValue);
    var emailOk = !!emailValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    if (phoneValue && !phoneOk) setError(card, 'phone', 'Not a valid phone number.');
    else setError(card, 'phone', '');
    if (emailValue && !emailOk) setError(card, 'email', 'Please enter a valid email.');
    else setError(card, 'email', '');

    button.disabled = !(country.value && phoneOk && emailOk);
    return !button.disabled;
  }

  function syncCountry(card) {
    var api = countryApi();
    var country = card.querySelector('#op-country');
    var dial = card.querySelector('#op-dial-code');
    var phone = card.querySelector('#op-phone');
    if (!api || !country || !dial) return;

    var entry = api.getByValue(country.value || 'india');
    if (!entry) return;
    dial.textContent = '+' + entry.dialCode;
    try {
      if (phone && phone._iti && typeof phone._iti.setCountry === 'function') phone._iti.setCountry(entry.iso2);
    } catch (_) {}
  }

  function finishClose(state) {
    if (!state || state.closed) return;
    state.closed = true;
    if (state.overlay && state.overlay.isConnected) state.overlay.remove();
    if (document.body) document.body.style.overflow = state.previousOverflow || '';
    if (active === state) active = null;
    scheduleReopen();
  }

  function closePopup() {
    var state = active;
    if (!state || state.closing) return;
    state.closing = true;

    var card = state.card;
    var overlay = state.overlay;
    card.classList.add('is-closing');
    overlay.classList.add('is-closing');

    var completed = false;
    function complete(event) {
      if (completed) return;
      if (event && event.target !== card) return;
      completed = true;
      card.removeEventListener('animationend', complete);
      finishClose(state);
    }

    card.addEventListener('animationend', complete);
    window.setTimeout(complete, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : EXIT_MS + 120);
  }

  function bindForm(card) {
    var form = card.querySelector('.opening-popup-form');
    var country = card.querySelector('#op-country');
    var phone = card.querySelector('#op-phone');
    var email = card.querySelector('#op-email');
    var button = card.querySelector('.opening-popup-submit');
    var success = card.querySelector('.opening-popup-success');

    function refresh() {
      syncCountry(card);
      validateLive(card);
    }

    country.addEventListener('change', refresh);
    country.addEventListener('input', refresh);
    phone.addEventListener('input', refresh);
    email.addEventListener('input', refresh);
    refresh();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validateLive(card)) return;

      var api = countryApi();
      var entry = api && api.getByValue(country.value || 'india');
      var national = api ? api.nationalDigits(phone.value) : phone.value.replace(/\D/g, '');
      var e164 = entry && national ? '+' + entry.dialCode + national : phone.value.trim();
      var countryName = entry ? entry.name : country.options[country.selectedIndex].text;

      var endpoint = (window.AppConfig && (window.AppConfig.googleScriptUrl || window.AppConfig.contactEndpoint)) || '';
      if (!endpoint) {
        success.style.display = 'block';
        success.textContent = 'Submission endpoint is not configured.';
        return;
      }

      submittedThisPageLoad = true;
      clearTimer('reopen');
      button.disabled = true;

      var payload = {
        source: 'popup',
        submittedAt: new Date().toISOString(),
        page: window.location.href,
        phone: e164,
        contact: e164,
        contactNumber: e164,
        email: email.value.trim(),
        country: countryName,
        Country: countryName,
        'PHONE NUMBER': e164,
        'MAIL ID': email.value.trim()
      };

      try {
        window.fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        success.style.display = 'block';
        success.textContent = 'Thank you! Your details have been submitted.';
        window.setTimeout(closePopup, 1400);
      } catch (_) {
        submittedThisPageLoad = false;
        success.style.display = 'block';
        success.textContent = 'Sorry, there was a problem sending your details. Please try again.';
        validateLive(card);
      }
    });
  }

  function openPopup() {
    if (!isEligiblePage() || submittedThisPageLoad || active) return;
    if (document.querySelector('.opening-popup-overlay')) return;

    ensureStyles();

    var overlay = document.createElement('div');
    overlay.className = 'opening-popup-overlay vmg-premium-overlay';
    overlay.setAttribute('aria-hidden', 'false');

    var card = document.createElement('div');
    card.className = 'opening-popup-card vmg-premium-card';
    card.dataset.vmgPremiumPopup = 'true';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', "Let's Stay Connected");
    card.innerHTML = buildMarkup();

    overlay.appendChild(card);

    var previousOverflow = document.body ? document.body.style.overflow : '';
    active = {
      overlay: overlay,
      card: card,
      previousOverflow: previousOverflow,
      closing: false,
      closed: false
    };

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    card.querySelector('.opening-popup-close').addEventListener('click', function (event) {
      event.preventDefault();
      closePopup();
    });

    bindForm(card);
  }

  function scheduleInitial() {
    if (!isEligiblePage() || submittedThisPageLoad || active) return;
    clearTimer('initial');
    initialTimer = window.setTimeout(function () {
      initialTimer = null;
      openPopup();
    }, SHOW_DELAY_MS);
  }

  function init() {
    if (initialized) return;
    initialized = true;
    ensureStyles();
    scheduleInitial();
  }

  window.initOpeningPopup = scheduleInitial;
  window.VMGOpeningPopup = {
    open: openPopup,
    close: closePopup,
    isOpen: function () { return !!active; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
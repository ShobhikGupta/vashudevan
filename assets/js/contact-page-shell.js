(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var submenuParents = document.querySelectorAll('.site-nav .has-submenu');
  var backToTop = document.getElementById('back-to-top');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    submenuParents.forEach(function (parent) {
      parent.classList.remove('open');
      var link = parent.querySelector(':scope > a');
      var submenu = parent.querySelector('.submenu');
      if (link) link.setAttribute('aria-expanded', 'false');
      if (submenu) submenu.style.maxHeight = '';
    });
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (event) {
      if (!nav.classList.contains('open')) return;
      if (event.target === nav || (!nav.contains(event.target) && !toggle.contains(event.target))) closeMenu();
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeMenu(); });
  }

  submenuParents.forEach(function (parent) {
    var link = parent.querySelector(':scope > a');
    var submenu = parent.querySelector('.submenu');
    if (!link || !submenu) return;
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');
    link.addEventListener('click', function (event) {
      if (!window.matchMedia('(max-width: 991px)').matches) return;
      event.preventDefault();
      var open = !parent.classList.contains('open');
      parent.classList.toggle('open', open);
      link.setAttribute('aria-expanded', open ? 'true' : 'false');
      submenu.style.maxHeight = open ? submenu.scrollHeight + 'px' : '0px';
    });
  });

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  }

  // Preserve the existing Contact visual field order without the old inline script.
  var form = document.getElementById('contact-form');
  if (form) {
    var rows = form.querySelectorAll('.form-row');
    var phone = form.querySelector('#contact');
    var country = form.querySelector('#country');
    if (rows.length >= 2 && phone && country) {
      var phoneField = phone.closest('.form-field');
      var countryField = country.closest('.form-field');
      if (phoneField && countryField) {
        rows[1].appendChild(phoneField);
        rows[0].appendChild(countryField);
      }
    }

    // Contact hard default: India is authoritative from first paint onward.
    // This guard runs before contact-form.js and prevents a transient metadata miss
    // from replacing a valid +91 with an em dash. It never derives Country from phone input.
    var dialCode = document.getElementById('contact-dial-code');
    var phoneGroup = document.getElementById('contact-phone-group');
    var lastValidDial = '+91';

    function indiaOption() {
      if (!country) return null;
      return Array.prototype.find.call(country.options, function (option) {
        return option.value === 'in' || option.textContent.trim().toLowerCase() === 'india';
      }) || null;
    }

    function setIndiaDefault() {
      var india = indiaOption();
      if (india) {
        india.value = 'in';
        india.dataset.dialCode = india.dataset.dialCode || '91';
        india.selected = true;
        country.value = 'in';
      }
      if (dialCode) dialCode.textContent = '+91';
      if (phoneGroup) phoneGroup.setAttribute('aria-label', 'India +91, phone number');
      var label = document.querySelector('#country + .vmg-custom-select .vmg-custom-select-label');
      if (label) label.textContent = 'India';
      if (phone) phone.value = '';
      lastValidDial = '+91';
    }

    function metadataDialForSelectedCountry() {
      if (!country || !window.intlTelInputGlobals || typeof window.intlTelInputGlobals.getCountryData !== 'function') return '';
      var iso2 = country.value;
      var data = window.intlTelInputGlobals.getCountryData() || [];
      var match = data.find(function (item) { return item.iso2 === iso2; });
      return match && match.dialCode ? '+' + match.dialCode : '';
    }

    function preserveValidDial() {
      if (!dialCode || !country) return;
      var current = String(dialCode.textContent || '').trim();
      var metadataDial = metadataDialForSelectedCountry();
      if (metadataDial) {
        dialCode.textContent = metadataDial;
        lastValidDial = metadataDial;
        return;
      }
      if (country.value === 'in' || (indiaOption() && indiaOption().selected)) {
        dialCode.textContent = '+91';
        lastValidDial = '+91';
        return;
      }
      if (/^\+[1-9]\d*$/.test(current)) {
        lastValidDial = current;
        return;
      }
      dialCode.textContent = lastValidDial || '+91';
    }

    setIndiaDefault();
    if (country) country.addEventListener('change', function () {
      window.requestAnimationFrame(preserveValidDial);
    });
    if (dialCode && window.MutationObserver) {
      var dialObserver = new MutationObserver(preserveValidDial);
      dialObserver.observe(dialCode, { childList: true, characterData: true, subtree: true });
    }
    window.setTimeout(preserveValidDial, 0);
    window.setTimeout(preserveValidDial, 100);
    window.setTimeout(preserveValidDial, 250);
  }

  // Keep the existing desktop card-height treatment, but with one observer only.
  var leftCard = document.querySelector('.contact-info-left');
  var rightCard = document.querySelector('.contact-form-new');
  var rightContainer = document.querySelector('.contact-form-container');
  function syncCardHeight() {
    if (!leftCard || !rightCard) return;
    if (window.matchMedia('(min-width: 769px)').matches) {
      leftCard.style.height = 'auto';
      leftCard.style.height = (rightContainer ? rightContainer.offsetHeight : rightCard.offsetHeight) + 'px';
    } else {
      leftCard.style.height = '';
    }
  }
  syncCardHeight();
  window.addEventListener('resize', syncCardHeight, { passive: true });
  window.addEventListener('load', syncCardHeight, { once: true });
  if (window.ResizeObserver && rightCard) {
    var ro = new ResizeObserver(syncCardHeight);
    ro.observe(rightCard);
  }

  // Contact still needs the existing floating WhatsApp utility, without loading main.js.
  if (!document.getElementById('whatsapp-float')) {
    var link = document.createElement('a');
    link.id = 'whatsapp-float';
    link.className = 'whatsapp-float';
    link.href = 'https://wa.me/919879208178?text=Hello%2C%20I%20visited%20your%20website%20and%20want%20to%20know%20more.';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Chat with us on WhatsApp');
    link.innerHTML = '<img src="/assets/img/whatsapp-logo.png" alt="WhatsApp" decoding="async"><span class="whatsapp-tooltip">Chat with us</span>';
    document.body.appendChild(link);
  }
})();

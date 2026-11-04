(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var submenuParents = document.querySelectorAll('.site-nav .has-submenu');

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

  // Back to top is owned globally by vmg-help.js.

  var form = document.getElementById('contact-form');
  if (form) {
    // Prevent the legacy library-dependent Contact controller from binding.
    // contact-form-v2.js becomes the sole Contact form owner below.
    form.dataset.vmgReliabilityBound = 'true';
    window.VMG_CONTACT_FORM_MANAGED = true;

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

    var privacyLabel = form.querySelector('label[for="privacy"]');
    if (privacyLabel) {
      privacyLabel.innerHTML = 'I have read the <a href="/privacy-policy/" class="privacy-link">Privacy Policy</a> and agree to Vashudevan MetGlobal LLP processing the information and attachments I submit to respond to my enquiry.';
    }

    function ensureScript(src, marker, done) {
      var existing = document.querySelector('script[' + marker + ']');
      if (existing) {
        if (done) {
          if (existing.dataset.loaded === 'true') done();
          else existing.addEventListener('load', done, { once: true });
        }
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.setAttribute(marker, 'true');
      script.addEventListener('load', function () { script.dataset.loaded = 'true'; if (done) done(); }, { once: true });
      document.head.appendChild(script);
    }

    function loadV2() {
      if (document.querySelector('script[data-vmg-contact-v2]')) return;
      ensureScript('/assets/js/contact-form-v2.js?v=20261027-label-rec-autogrow', 'data-vmg-contact-v2');
    }

    if (window.VMGCountryPhone) loadV2();
    else ensureScript('/assets/js/vmg-country-phone.js?v=20260905a', 'data-vmg-country-phone-contact', loadV2);
  }

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

  // One-time, in-viewport reveal of the Contact columns. Form unaffected.
  var contactSection = document.querySelector('.vmg-contact-information');
  if (contactSection && window.IntersectionObserver &&
      !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    var contactColumns = Array.prototype.slice.call(contactSection.querySelectorAll('.vmg-contact-info-column'));
    if (contactColumns.length) {
      var contactObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      contactSection.classList.add('vmg-contact-animate-ready');
      contactColumns.forEach(function (column) { contactObserver.observe(column); });
    }
  }


  // Delegate the map-app choice to the operating system where supported.
  // Android geo: links invoke a compatible map handler without any custom UI.
  // Other browsers use Google's cross-platform directions URL as fallback.
  var directionsLink = document.querySelector('[data-vmg-native-maps]');
  if (directionsLink && /Android/i.test(navigator.userAgent || '')) {
    directionsLink.setAttribute('href', 'geo:0,0?q=Vashudevan%20MetGlobal%20LLP%2C%20Vesu%2C%20Surat%2C%20Gujarat');
    directionsLink.removeAttribute('target');
  }

})();

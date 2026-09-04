// VMG static-site client configuration. Header/footer markup is hardcoded in HTML.
(function () {
  window.AppConfig = window.AppConfig || {};
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
  window.AppConfig.gaMeasurementId = 'G-6CJ7X607D5';
})();

(function () {
  'use strict';
  if (!document || !document.head) return;
  var measurementId = 'G-6CJ7X607D5';
  var publicPaths = ['/', '/index.html', '/who-we-are.html', '/our-impact.html', '/products.html', '/product.html', '/resources.html', '/faq.html', '/contact.html', '/privacy-policy.html', '/disclaimer.html', '/market-prices', '/market-prices/', '/market-prices/index.html'];
  var path = window.location.pathname || '/';
  if (publicPaths.indexOf(path) === -1) return;
  var existingGaScript = document.querySelector('script[src*="googletagmanager.com/gtag/js?id=' + measurementId + '"]');
  if (!existingGaScript) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: true });
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    gaScript.setAttribute('data-vmg-ga4-base', 'true');
    document.head.appendChild(gaScript);
  }
  if (!document.querySelector('script[data-vmg-analytics-script]')) {
    var analyticsScript = document.createElement('script');
    analyticsScript.src = '/assets/js/analytics.js?v=20260822b';
    analyticsScript.defer = true;
    analyticsScript.setAttribute('data-vmg-analytics-script', 'true');
    document.head.appendChild(analyticsScript);
  }
})();

(function () {
  if (!document || !document.head) return;
  function loadStylesheet(href, marker) {
    if (document.querySelector('link[' + marker + ']')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, 'true');
    document.head.appendChild(link);
  }
  function loadScript(src, marker) {
    if (document.querySelector('script[' + marker + ']')) return;
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(marker, 'true');
    document.head.appendChild(script);
  }
  loadStylesheet('/assets/css/vmg-market-polish.css?v=20260904b', 'data-vmg-market-polish');
  loadScript('/assets/js/skeleton-loader.js?v=20260904b', 'data-vmg-skeleton-loader-script');
  loadScript('/assets/js/vmg-feedback.js?v=20260905a', 'data-vmg-feedback-script');
  loadScript('/assets/js/vmg-help.js?v=20260904b', 'data-vmg-help-script');
})();

(function () {
  'use strict';

  var SOCIAL_ASSETS = {
    whatsapp: '/assets/img/social/whatsapp.svg', facebook: '/assets/img/social/facebook.svg',
    linkedin: '/assets/img/social/linkedin.svg', instagram: '/assets/img/social/instagram.svg'
  };

  function socialKey(link) {
    var label = (link.getAttribute('aria-label') || '').toLowerCase();
    if (label.indexOf('whatsapp') !== -1) return 'whatsapp';
    if (label.indexOf('facebook') !== -1) return 'facebook';
    if (label.indexOf('linkedin') !== -1) return 'linkedin';
    if (label.indexOf('instagram') !== -1) return 'instagram';
    return '';
  }

  function hydrateSocialIcons() {
    document.querySelectorAll('.vmg-social-link, .vmg-footer-socials a').forEach(function (link) {
      var key = socialKey(link);
      if (!key || !SOCIAL_ASSETS[key]) return;
      link.setAttribute('aria-label', 'Open VMG ' + key.charAt(0).toUpperCase() + key.slice(1));
      link.setAttribute('data-vmg-social-asset', SOCIAL_ASSETS[key]);
    });
  }

  function upgradeBenchmarkChevron() {
    var chevron = document.querySelector('.market-custom-select-chevron');
    if (!chevron || chevron.querySelector('svg')) return;
    chevron.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M6 8l4 4 4-4"/></svg>';
  }

  function ensureToast() {
    var toast = document.querySelector('.vmg-track-toast');
    if (toast) return toast;
    toast = document.createElement('div');
    toast.className = 'vmg-track-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    return toast;
  }

  function closeMobileNavBeforeToast(callback) {
    var nav = document.getElementById('site-nav');
    var toggle = document.querySelector('.nav-toggle');
    if (window.matchMedia('(max-width: 991px)').matches && nav && nav.classList.contains('open') && toggle) {
      toggle.click();
      window.setTimeout(callback, 170);
      return;
    }
    callback();
  }

  function bindTrackForms() {
    var toast = ensureToast();
    var timer = null;
    document.querySelectorAll('[data-vmg-track-form]').forEach(function (form) {
      if (form.dataset.bound === 'true') return;
      form.dataset.bound = 'true';
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('.vmg-track-input');
        var message = input && input.value.trim()
          ? 'Shipment tracking portal is coming soon. Your reference has not been submitted.'
          : 'Shipment tracking portal is coming soon.';
        closeMobileNavBeforeToast(function () {
          toast.textContent = message;
          toast.classList.add('is-visible');
          window.clearTimeout(timer);
          timer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 3200);
        });
      });
    });
  }

  function setActiveNav() {
    var path = (window.location.pathname || '/').replace(/\/$/, '') || '/';
    document.querySelectorAll('#site-nav > ul > li > a[data-vmg-nav-path]').forEach(function (link) {
      link.removeAttribute('aria-current');
      var key = link.getAttribute('data-vmg-nav-path');
      var match = (key === 'home' && (path === '/' || path === '/index.html')) ||
        (key === 'products' && (path === '/products.html' || path === '/product.html')) ||
        (key === 'market' && (path === '/market-prices' || path === '/market-prices/index.html')) ||
        (key === 'resources' && (path === '/resources.html' || path === '/faq.html')) ||
        (key === 'contact' && path === '/contact.html');
      if (match) link.setAttribute('aria-current', 'page');
    });
  }

  function routeContactIntents() {
    var intentByText = [
      [/send buying requirement|buy scrap/i, 'buyer'],
      [/submit material offer|sell scrap/i, 'seller'],
      [/partner with us|start partnership enquiry/i, 'partnership'],
      [/documentation support/i, 'documentation'],
      [/call back request/i, 'callback'],
      [/contact vmg desk/i, 'general']
    ];

    document.querySelectorAll('a[href]').forEach(function (link) {
      var text = (link.textContent || '').replace(/\s+/g, ' ').trim();
      var url;
      try { url = new URL(link.getAttribute('href'), window.location.href); } catch (_) { return; }
      if (url.origin !== window.location.origin) return;

      var type = '';
      intentByText.some(function (pair) {
        if (pair[0].test(text)) { type = pair[1]; return true; }
        return false;
      });

      if (!type && link.closest('.market-cta-card') && /contact us/i.test(text)) type = 'quotation';
      if (!type) return;
      if (!/^\/contact(?:\.html)?\/?$/.test(url.pathname)) return;

      link.setAttribute('href', '/contact.html?type=' + type + '#contact-form');
    });
  }

  function initVmgCustomSelect(nativeSelect) {
    if (!nativeSelect || nativeSelect.dataset.vmgCustomSelect === 'true') return null;
    nativeSelect.dataset.vmgCustomSelect = 'true';
    nativeSelect.classList.add('vmg-native-select-enhanced');

    var root = document.createElement('div');
    root.className = 'vmg-custom-select';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'vmg-custom-select-button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    var list = document.createElement('div');
    list.className = 'vmg-custom-select-list';
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    var label = document.createElement('span');
    label.className = 'vmg-custom-select-label';
    var chevron = document.createElement('span');
    chevron.className = 'vmg-custom-select-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 8l4 4 4-4"/></svg>';
    button.appendChild(label);
    button.appendChild(chevron);
    root.appendChild(button);
    root.appendChild(list);
    nativeSelect.insertAdjacentElement('afterend', root);

    var options = Array.prototype.slice.call(nativeSelect.options);
    var activeIndex = Math.max(0, nativeSelect.selectedIndex);
    var typeBuffer = '';
    var typeTimer = 0;

    options.forEach(function (option, index) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'vmg-custom-select-option';
      item.setAttribute('role', 'option');
      item.dataset.value = option.value;
      item.dataset.index = String(index);
      item.textContent = option.textContent;
      list.appendChild(item);
    });

    function items() { return Array.prototype.slice.call(list.querySelectorAll('.vmg-custom-select-option')); }
    function syncVisual() {
      var selected = nativeSelect.options[nativeSelect.selectedIndex] || nativeSelect.options[0];
      label.textContent = selected ? selected.textContent : '';
      activeIndex = Math.max(0, nativeSelect.selectedIndex);
      items().forEach(function (item, index) {
        item.setAttribute('aria-selected', index === activeIndex ? 'true' : 'false');
        item.classList.toggle('is-active', index === activeIndex);
      });
    }
    function open() {
      root.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      var current = items()[activeIndex];
      if (current) current.scrollIntoView({ block: 'nearest' });
    }
    function close(focusButton) {
      root.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      if (focusButton) button.focus();
    }
    function choose(index) {
      var option = nativeSelect.options[index];
      if (!option) return;
      nativeSelect.value = option.value;
      nativeSelect.selectedIndex = index;
      syncVisual();
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }
    function move(nextIndex) {
      activeIndex = Math.max(0, Math.min(options.length - 1, nextIndex));
      items().forEach(function (item, index) { item.classList.toggle('is-active', index === activeIndex); });
      var current = items()[activeIndex];
      if (current) current.scrollIntoView({ block: 'nearest' });
    }
    function typeAhead(character) {
      window.clearTimeout(typeTimer);
      typeBuffer += character.toLowerCase();
      var found = options.findIndex(function (option) { return option.textContent.trim().toLowerCase().indexOf(typeBuffer) === 0; });
      if (found >= 0) move(found);
      typeTimer = window.setTimeout(function () { typeBuffer = ''; }, 650);
    }

    button.addEventListener('click', function () { root.classList.contains('is-open') ? close(false) : open(); });
    list.addEventListener('click', function (event) {
      var item = event.target.closest('.vmg-custom-select-option');
      if (item) choose(Number(item.dataset.index));
    });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); open(); move(activeIndex + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); open(); move(activeIndex - 1); }
      else if (event.key === 'Home') { event.preventDefault(); open(); move(0); }
      else if (event.key === 'End') { event.preventDefault(); open(); move(options.length - 1); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); root.classList.contains('is-open') ? choose(activeIndex) : open(); }
      else if (event.key === 'Escape') { event.preventDefault(); close(false); }
      else if (event.key.length === 1 && /[a-z0-9]/i.test(event.key)) { open(); typeAhead(event.key); }
    });
    list.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); move(activeIndex + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); move(activeIndex - 1); }
      else if (event.key === 'Home') { event.preventDefault(); move(0); }
      else if (event.key === 'End') { event.preventDefault(); move(options.length - 1); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(activeIndex); }
      else if (event.key === 'Escape') { event.preventDefault(); close(true); }
      else if (event.key.length === 1 && /[a-z0-9]/i.test(event.key)) typeAhead(event.key);
    });
    document.addEventListener('pointerdown', function (event) { if (!root.contains(event.target)) close(false); });
    nativeSelect.addEventListener('change', syncVisual);
    syncVisual();
    return { sync: syncVisual };
  }

  function initContactTypeSelect() {
    if ((window.location.pathname || '') !== '/contact.html') return;
    var typeSelect = document.getElementById('type');
    if (!typeSelect) return;

    var typeOptions = [
      ['', 'Select enquiry type'], ['buyer', 'Buyer / Purchase Requirement'], ['seller', 'Supplier / Material Offer'],
      ['quotation', 'Bulk Quotation / Market Enquiry'], ['partnership', 'Business Partnership'],
      ['documentation', 'Documentation / Shipment Support'], ['callback', 'Call Back Request'],
      ['investor', 'Investor'], ['finance', 'Finance'], ['general', 'General Enquiry']
    ];
    typeSelect.innerHTML = '';
    typeOptions.forEach(function (pair) {
      var option = document.createElement('option');
      option.value = pair[0];
      option.textContent = pair[1];
      typeSelect.appendChild(option);
    });

    var typeUi = initVmgCustomSelect(typeSelect);
    var requestedType = new URLSearchParams(window.location.search).get('type');
    var supported = typeOptions.slice(1).map(function (pair) { return pair[0]; });
    if (requestedType && supported.indexOf(requestedType) !== -1) {
      typeSelect.value = requestedType;
      if (typeUi) typeUi.sync();
      typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function initContactCountrySelect() {
    if ((window.location.pathname || '') !== '/contact.html') return;
    var countrySelect = document.getElementById('country');
    if (!countrySelect || countrySelect.dataset.vmgCustomSelect === 'true') return;
    if (countrySelect.dataset.vmgCountryReady !== 'true') return;
    var ui = initVmgCustomSelect(countrySelect);
    if (ui) ui.sync();
  }

  function initHeaderBehavior() {
    var header = document.querySelector('.site-header.vmg-econship-header');
    var nav = header && header.querySelector('.site-nav');
    var footer = document.querySelector('footer.vmg-global-footer, footer.site-footer');
    var backToTop = document.getElementById('back-to-top');
    if (!header || !nav || !footer) return;

    var desktopQuery = window.matchMedia('(min-width: 992px)');
    var navParent = nav.parentNode;
    var rafId = 0;

    var sentinel = navParent.querySelector('.vmg-tier2-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.className = 'vmg-tier2-sentinel';
      sentinel.setAttribute('aria-hidden', 'true');
      navParent.insertBefore(sentinel, nav);
    } else if (sentinel.nextElementSibling !== nav) {
      navParent.insertBefore(sentinel, nav);
    }

    var spacer = navParent.querySelector('.vmg-tier2-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'vmg-tier2-spacer';
      spacer.setAttribute('aria-hidden', 'true');
    }
    nav.insertAdjacentElement('afterend', spacer);

    function isMenuOpen() {
      return nav.classList.contains('open') || document.body.classList.contains('menu-open');
    }

    function footerIsActuallyVisible() {
      var rect = footer.getBoundingClientRect();
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      return rect.top < viewportHeight && rect.bottom > 0;
    }

    function setDesktopPinned(desktop) {
      if (!desktop) {
        header.classList.remove('vmg-tier2-pinned');
        spacer.style.height = '0px';
        return false;
      }

      var shouldPin = sentinel.getBoundingClientRect().top <= 0;
      var navHeight = Math.max(1, Math.round(nav.getBoundingClientRect().height));
      header.style.setProperty('--vmg-tier2-height', navHeight + 'px');
      header.classList.toggle('vmg-tier2-pinned', shouldPin);
      spacer.style.height = shouldPin ? navHeight + 'px' : '0px';
      return shouldPin;
    }

    function applyState() {
      rafId = 0;
      var desktop = desktopQuery.matches;
      var pinned = setDesktopPinned(desktop);
      var menuOpen = isMenuOpen();
      var footerVisible = footerIsActuallyVisible();
      var retreat = footerVisible && !menuOpen && (!desktop || pinned);
      header.classList.toggle('vmg-footer-in-view', footerVisible);
      header.classList.toggle('vmg-menu-open', menuOpen);
      document.body.classList.toggle('vmg-footer-visible', footerVisible);
      document.body.classList.toggle('vmg-header-retreated', retreat);
      document.body.classList.remove('scroll-top-visible');
      if (backToTop) {
        backToTop.classList.toggle('visible', retreat);
        backToTop.setAttribute('aria-hidden', retreat ? 'false' : 'true');
      }
    }

    function requestState() {
      if (!rafId) rafId = window.requestAnimationFrame(applyState);
    }

    window.addEventListener('scroll', requestState, { passive: true });
    window.addEventListener('resize', requestState, { passive: true });
    window.addEventListener('orientationchange', requestState, { passive: true });
    window.addEventListener('load', requestState, { once: true });
    document.addEventListener('vmg:loader-hidden', requestState);
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', requestState);
    else if (desktopQuery.addListener) desktopQuery.addListener(requestState);
    var menuObserver = new MutationObserver(requestState);
    menuObserver.observe(nav, { attributes: true, attributeFilter: ['class'] });
    if ('ResizeObserver' in window) {
      var geometryObserver = new ResizeObserver(requestState);
      geometryObserver.observe(nav);
      geometryObserver.observe(footer);
    }
    applyState();
    window.setTimeout(requestState, 80);
    window.setTimeout(requestState, 250);
    window.setTimeout(requestState, 800);
  }

  function init() {
    hydrateSocialIcons();
    upgradeBenchmarkChevron();
    bindTrackForms();
    setActiveNav();
    routeContactIntents();
    initContactTypeSelect();
    initContactCountrySelect();
    initHeaderBehavior();
  }

  document.addEventListener('vmg:contact-countries-ready', initContactCountrySelect);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

// VMG static-site client configuration. Header/footer markup is hardcoded in HTML.
(function () {
  window.AppConfig = window.AppConfig || {};
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
  window.AppConfig.gaMeasurementId = 'G-6CJ7X607D5';
})();

// GA4 bootstrap for real public pages only.
// index.html already has the GA4 base tag, so this block reuses it there and
// installs the same property only on public pages where the base tag is missing.
(function () {
  'use strict';

  if (!document || !document.head) return;

  var measurementId = 'G-6CJ7X607D5';
  var publicPaths = [
    '/',
    '/index.html',
    '/who-we-are.html',
    '/our-impact.html',
    '/products.html',
    '/product.html',
    '/resources.html',
    '/faq.html',
    '/contact.html',
    '/privacy-policy.html',
    '/disclaimer.html',
    '/market-prices',
    '/market-prices/',
    '/market-prices/index.html'
  ];
  var path = window.location.pathname || '/';

  if (publicPaths.indexOf(path) === -1) return;

  var existingGaScript = document.querySelector(
    'script[src*="googletagmanager.com/gtag/js?id=' + measurementId + '"]'
  );

  if (!existingGaScript) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true
    });

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

// Shared shell assets. Header placement/behavior CSS is loaded by the page itself;
// do not swap those stylesheets at runtime because that causes visible layout flicker.
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

  loadStylesheet('/assets/css/vmg-market-polish.css', 'data-vmg-market-polish');
  loadScript('/assets/js/skeleton-loader.js?v=20260904b', 'data-vmg-skeleton-loader-script');
  loadScript('/assets/js/vmg-feedback.js?v=20260822j', 'data-vmg-feedback-script');
  loadScript('/assets/js/vmg-help.js?v=20260904b', 'data-vmg-help-script');
})();

(function () {
  'use strict';

  var SOCIAL_ASSETS = {
    whatsapp: '/assets/img/social/whatsapp.svg',
    facebook: '/assets/img/social/facebook.svg',
    linkedin: '/assets/img/social/linkedin.svg',
    instagram: '/assets/img/social/instagram.svg'
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
    var mobile = window.matchMedia('(max-width: 991px)').matches;
    if (mobile && nav && nav.classList.contains('open') && toggle) {
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
          timer = window.setTimeout(function () {
            toast.classList.remove('is-visible');
          }, 3200);
        });
      });
    });
  }

  function setActiveNav() {
    var path = (window.location.pathname || '/').replace(/\/$/, '') || '/';

    document.querySelectorAll('#site-nav > ul > li > a[data-vmg-nav-path]').forEach(function (link) {
      link.removeAttribute('aria-current');
      var key = link.getAttribute('data-vmg-nav-path');
      var match =
        (key === 'home' && (path === '/' || path === '/index.html')) ||
        (key === 'products' && (path === '/products.html' || path === '/product.html')) ||
        (key === 'market' && (path === '/market-prices' || path === '/market-prices/index.html')) ||
        (key === 'resources' && (path === '/resources.html' || path === '/faq.html')) ||
        (key === 'contact' && path === '/contact.html');

      if (match) link.setAttribute('aria-current', 'page');
    });
  }

  // SINGLE JS source of truth for header pinning, footer retreat and Go-To-Top visibility.
  function initHeaderBehavior() {
    var header = document.querySelector('.site-header.vmg-econship-header');
    var nav = header && header.querySelector('.site-nav');
    var footer = document.querySelector('footer.vmg-global-footer, footer.site-footer');
    var backToTop = document.getElementById('back-to-top');
    if (!header || !nav || !footer) return;

    var desktopQuery = window.matchMedia('(min-width: 992px)');
    var navParent = nav.parentNode;
    var rafId = 0;
    var isFooterVisible = false;

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
      return document.body.classList.contains('menu-open') || nav.classList.contains('open');
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
      var retreat = isFooterVisible && !menuOpen && (!desktop || pinned);

      header.classList.toggle('vmg-footer-in-view', isFooterVisible);
      header.classList.toggle('vmg-menu-open', menuOpen);
      document.body.classList.toggle('vmg-footer-visible', isFooterVisible);
      document.body.classList.toggle('vmg-header-retreated', retreat);

      if (backToTop) {
        backToTop.classList.toggle('visible', retreat);
        backToTop.setAttribute('aria-hidden', retreat ? 'false' : 'true');
      }
    }

    function requestState() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(applyState);
    }

    // Scroll answers only one question: has desktop Tier 2 reached viewport top?
    window.addEventListener('scroll', requestState, { passive: true });
    window.addEventListener('resize', requestState, { passive: true });

    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', requestState);
    else if (desktopQuery.addListener) desktopQuery.addListener(requestState);

    var menuObserver = new MutationObserver(requestState);
    menuObserver.observe(nav, { attributes: true, attributeFilter: ['class'] });
    menuObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    if ('IntersectionObserver' in window) {
      var footerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== footer) return;
          isFooterVisible = entry.isIntersecting && entry.intersectionRect.height > 0;
          requestState();
        });
      }, { root: null, rootMargin: '0px', threshold: [0, 0.001] });
      footerObserver.observe(footer);
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
    initHeaderBehavior();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

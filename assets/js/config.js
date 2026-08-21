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

  // Claim header scroll-state ownership before vmg-help.js loads.
  // vmg-help.js respects this marker and skips its older competing controller.
  var shellHeader = document.querySelector('.site-header.vmg-econship-header');
  if (shellHeader) shellHeader.dataset.vmgStickyFix = 'true';

  loadScript('/assets/js/vmg-feedback.js?v=20260822j', 'data-vmg-feedback-script');
  loadScript('/assets/js/vmg-help.js?v=20260822j', 'data-vmg-help-script');
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

      var img = document.createElement('img');
      img.src = SOCIAL_ASSETS[key];
      img.alt = '';
      img.width = link.closest('.vmg-footer-socials') ? 18 : 22;
      img.height = link.closest('.vmg-footer-socials') ? 18 : 22;
      img.decoding = 'async';
      img.setAttribute('aria-hidden', 'true');
      img.setAttribute('data-vmg-social-asset', 'true');
      img.className = link.closest('.vmg-footer-socials') ? 'vmg-footer-social-img' : 'vmg-social-icon-img';
      link.replaceChildren(img);
    });
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

  function bindTrackForms() {
    var toast = ensureToast();
    var timer = null;

    document.querySelectorAll('[data-vmg-track-form]').forEach(function (form) {
      if (form.dataset.bound === 'true') return;
      form.dataset.bound = 'true';

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('.vmg-track-input');
        toast.textContent = input && input.value.trim()
          ? 'Shipment tracking portal is coming soon. Your reference has not been submitted.'
          : 'Shipment tracking portal is coming soon.';
        toast.classList.add('is-visible');
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          toast.classList.remove('is-visible');
        }, 3200);
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

  function initHeaderBehavior() {
    var header = document.querySelector('.site-header.vmg-econship-header');
    var brandRow = header && header.querySelector('.vmg-nav-brand-row');
    var nav = header && header.querySelector('.site-nav');
    var footer = document.querySelector('footer.site-footer.vmg-global-footer[data-vmg-static-footer="true"]');
    var backToTop = document.getElementById('back-to-top');
    var navToggle = header && header.querySelector('.nav-toggle');

    if (!header || !brandRow || !nav || !footer) return;

    // Keep this as the only header/footer controller. vmg-help.js checks this marker.
    header.dataset.vmgStickyFix = 'true';

    var desktopQuery = window.matchMedia('(min-width: 992px)');
    var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var navParent = nav.parentNode;
    if (!navParent) return;

    var sentinel = navParent.querySelector('.vmg-tier2-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('span');
      sentinel.className = 'vmg-tier2-sentinel';
      sentinel.setAttribute('aria-hidden', 'true');
      navParent.insertBefore(sentinel, nav);
    }

    var spacer = navParent.querySelector('.vmg-tier2-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'vmg-tier2-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      navParent.insertBefore(spacer, nav);
    }

    var isFooterVisible = false;
    var isMobileMenuOpen = false;
    var isTier2Pinned = false;
    var rafId = 0;

    function readMobileMenuState() {
      if (desktopQuery.matches) return false;
      return (
        document.body.classList.contains('menu-open') ||
        nav.classList.contains('open') ||
        (navToggle && navToggle.getAttribute('aria-expanded') === 'true')
      );
    }

    function setTier2PinnedState() {
      if (!desktopQuery.matches) {
        isTier2Pinned = false;
        header.classList.remove('vmg-tier2-pinned');
        nav.classList.remove('tier2-retreat');
        spacer.style.height = '0px';
        return;
      }

      var shouldPin = sentinel.getBoundingClientRect().top <= 0;
      var navHeight = Math.max(1, Math.round(nav.getBoundingClientRect().height));

      isTier2Pinned = shouldPin;
      header.classList.toggle('vmg-tier2-pinned', shouldPin);
      header.style.setProperty('--vmg-tier2-height', navHeight + 'px');
      spacer.style.height = shouldPin ? navHeight + 'px' : '0px';
    }

    function updateHeaderFooterState() {
      rafId = 0;
      isMobileMenuOpen = readMobileMenuState();
      setTier2PinnedState();

      var mobileRetreated = !desktopQuery.matches && isFooterVisible && !isMobileMenuOpen;
      var desktopRetreated = desktopQuery.matches && isFooterVisible && isTier2Pinned;
      var activeHeaderHasRetreated = mobileRetreated || desktopRetreated;
      var goToTopVisible = activeHeaderHasRetreated && !isMobileMenuOpen;

      document.body.classList.toggle('footer-visible', isFooterVisible);
      header.classList.toggle('footer-visible', isFooterVisible);
      header.classList.toggle('header-retreat', mobileRetreated);
      nav.classList.toggle('tier2-retreat', desktopRetreated);

      // Remove legacy state classes so old CSS cannot become a second source of truth.
      header.classList.remove('vmg-footer-in-view', 'vmg-menu-open', 'vmg-header-retreat', 'vmg-footer-active', 'vmg-tier1-collapsed');
      document.body.classList.remove('vmg-header-retreated');

      if (backToTop) {
        backToTop.classList.toggle('vmg-retreat-visible', goToTopVisible);
        backToTop.setAttribute('aria-hidden', goToTopVisible ? 'false' : 'true');
      }
    }

    function requestStateUpdate() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateHeaderFooterState);
    }

    // Scroll is used only to determine when desktop Tier 2 reaches the viewport top.
    window.addEventListener('scroll', requestStateUpdate, { passive: true });
    window.addEventListener('resize', requestStateUpdate, { passive: true });
    window.addEventListener('orientationchange', requestStateUpdate, { passive: true });

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', requestStateUpdate);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(requestStateUpdate);
    }

    var menuObserver = new MutationObserver(function () {
      updateHeaderFooterState();
    });
    menuObserver.observe(nav, { attributes: true, attributeFilter: ['class'] });
    menuObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (navToggle) {
      menuObserver.observe(navToggle, { attributes: true, attributeFilter: ['aria-expanded', 'class'] });
    }

    // The actual final site footer is the sole footer-visibility trigger.
    if ('IntersectionObserver' in window) {
      var footerObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== footer) return;
          isFooterVisible = entry.isIntersecting && entry.intersectionRect.height > 0;
          updateHeaderFooterState();
        });
      }, {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.001]
      });
      footerObserver.observe(footer);
    }

    // The existing main.js owns the click handler. It already uses reduced-motion
    // aware smooth/instant scrolling; visibility is owned exclusively here/CSS.
    if (backToTop && reducedMotionQuery.matches) {
      backToTop.setAttribute('data-vmg-reduced-motion', 'true');
    }

    updateHeaderFooterState();
  }

  function init() {
    hydrateSocialIcons();
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

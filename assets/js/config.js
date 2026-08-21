// VMG static-site client configuration. Header/footer markup is hardcoded in HTML.
(function () {
  window.AppConfig = window.AppConfig || {};
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
})();

// Shared behavior only. This file never creates or replaces header/footer markup.
(function () {
  if (!document || !document.head) return;

  // Always use the latest shell behavior CSS even when older HTML has a cached query string.
  var stickyLink = document.querySelector('link[data-vmg-header-sticky-fix]');
  if (stickyLink) stickyLink.href = '/assets/css/vmg-header-sticky-fix.css?v=20260822e';

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
  loadScript('/assets/js/vmg-feedback.js?v=20260822e', 'data-vmg-feedback-script');
  loadScript('/assets/js/vmg-help.js?v=20260822e', 'data-vmg-help-script');
})();

(function () {
  'use strict';

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
        timer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 3200);
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
    var footer = document.querySelector('footer.vmg-global-footer, footer.site-footer');
    var backToTop = document.getElementById('back-to-top');
    if (!header || !brandRow || !nav) return;

    header.dataset.vmgStickyFix = 'true';

    var desktopQuery = window.matchMedia('(min-width: 992px)');
    var raf = 0;
    var footerObserver = null;

    // A permanent zero-height marker gives us the exact original position of Tier 2.
    var sentinel = header.querySelector('.vmg-tier2-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('span');
      sentinel.className = 'vmg-tier2-sentinel';
      sentinel.setAttribute('aria-hidden', 'true');
      header.insertBefore(sentinel, nav);
    }

    // The spacer occupies Tier 2's original height while Tier 2 is fixed.
    var spacer = header.querySelector('.vmg-tier2-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'vmg-tier2-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      header.insertBefore(spacer, nav);
    }

    function isMenuOpen() {
      return document.body.classList.contains('menu-open') || nav.classList.contains('open');
    }

    function isFooterActuallyVisible() {
      if (!footer || !footer.isConnected) {
        footer = document.querySelector('footer.vmg-global-footer, footer.site-footer');
      }
      if (!footer) return false;
      var rect = footer.getBoundingClientRect();
      // Require positive visible area. Merely touching the viewport edge is not enough.
      return rect.top < window.innerHeight && rect.bottom > 0 && Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0) > 1;
    }

    function syncFooterState(footerVisible, menuOpen) {
      var retreat = footerVisible && !menuOpen;
      header.classList.toggle('vmg-footer-in-view', retreat);
      header.classList.toggle('vmg-menu-open', menuOpen);
      document.body.classList.toggle('vmg-footer-visible', footerVisible);

      // The go-to-top control is intentionally synchronized to the exact same footer state.
      if (backToTop) {
        backToTop.classList.toggle('visible', retreat);
        backToTop.setAttribute('aria-hidden', retreat ? 'false' : 'true');
      }
    }

    function syncDesktopTier2(desktop) {
      if (!desktop) {
        header.classList.remove('vmg-tier2-pinned');
        spacer.style.height = '0px';
        return;
      }

      var shouldPin = sentinel.getBoundingClientRect().top <= 0;
      var navHeight = Math.max(1, Math.round(nav.getBoundingClientRect().height));
      header.style.setProperty('--vmg-tier2-height', navHeight + 'px');
      header.classList.toggle('vmg-tier2-pinned', shouldPin);
      spacer.style.height = shouldPin ? navHeight + 'px' : '0px';
    }

    function update() {
      raf = 0;
      var desktop = desktopQuery.matches;
      var menuOpen = isMenuOpen();
      var footerVisible = isFooterActuallyVisible();

      syncDesktopTier2(desktop);
      syncFooterState(footerVisible, menuOpen);
    }

    function requestUpdate() {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    }

    // Scroll/resize is the authoritative fallback and makes the state reversible immediately.
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });

    // Menu state can change without a scroll.
    document.addEventListener('click', function () { window.setTimeout(requestUpdate, 0); });
    document.addEventListener('keydown', function () { window.setTimeout(requestUpdate, 0); });

    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', requestUpdate);
    else if (desktopQuery.addListener) desktopQuery.addListener(requestUpdate);

    // Because the footer is now hardcoded, IntersectionObserver is stable and fires on BOTH
    // entry and exit. Scroll fallback above still verifies the geometry on every frame.
    if (footer && 'IntersectionObserver' in window) {
      footerObserver = new IntersectionObserver(function () {
        requestUpdate();
      }, { root: null, threshold: [0, 0.001, 0.05] });
      footerObserver.observe(footer);
    }

    // Re-measure after fonts/layout settle.
    update();
    window.setTimeout(requestUpdate, 80);
    window.setTimeout(requestUpdate, 300);
    window.setTimeout(requestUpdate, 900);
  }

  function init() {
    bindTrackForms();
    setActiveNav();
    initHeaderBehavior();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
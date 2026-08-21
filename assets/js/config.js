// VMG static-site client configuration. Header/footer markup is hardcoded in HTML.
(function () {
  window.AppConfig = window.AppConfig || {};
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
})();

// Shared behavior only. This file no longer creates or replaces header/footer markup.
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
  loadScript('/assets/js/vmg-feedback.js?v=20260822c', 'data-vmg-feedback-script');
  loadScript('/assets/js/vmg-help.js?v=20260822c', 'data-vmg-help-script');
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
    if (!header || !brandRow || !nav) return;

    // Prevent the older help-script implementation from attaching a second header controller.
    header.dataset.vmgStickyFix = 'true';

    var desktopQuery = window.matchMedia('(min-width: 992px)');
    var navStart = 0;
    var raf = 0;

    function measure() {
      header.classList.remove('vmg-tier2-pinned');
      header.style.removeProperty('--vmg-tier2-height');
      var headerTop = header.getBoundingClientRect().top + window.scrollY;
      navStart = headerTop + brandRow.getBoundingClientRect().height;
      header.style.setProperty('--vmg-tier2-height', Math.max(1, Math.round(nav.getBoundingClientRect().height)) + 'px');
      update();
    }

    function footerInView() {
      var footer = document.querySelector('footer.vmg-global-footer, footer.site-footer');
      if (!footer) return false;
      var rect = footer.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }

    function update() {
      raf = 0;
      var desktop = desktopQuery.matches;
      var menuOpen = document.body.classList.contains('menu-open') || nav.classList.contains('open');

      header.classList.toggle('vmg-menu-open', menuOpen);
      header.classList.toggle('vmg-footer-in-view', footerInView() && !menuOpen);

      if (desktop) {
        header.classList.toggle('vmg-tier2-pinned', window.scrollY >= navStart - 1);
      } else {
        header.classList.remove('vmg-tier2-pinned');
      }
    }

    function requestUpdate() {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', function () {
      window.clearTimeout(window.__vmgHeaderMeasureTimer);
      window.__vmgHeaderMeasureTimer = window.setTimeout(measure, 100);
    }, { passive: true });
    document.addEventListener('click', function () { window.setTimeout(requestUpdate, 0); });

    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', measure);
    else if (desktopQuery.addListener) desktopQuery.addListener(measure);

    measure();
    window.setTimeout(measure, 150);
    window.setTimeout(measure, 700);
  }

  function init() {
    bindTrackForms();
    setActiveNav();
    initHeaderBehavior();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

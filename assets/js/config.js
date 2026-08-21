// VMG static-site client configuration. Header/footer markup is hardcoded in HTML.
(function () {
  window.AppConfig = window.AppConfig || {};
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
})();

// Shared shell assets. Keep the latest header/footer behavior CSS cache-busted.
(function () {
  if (!document || !document.head) return;

  var stickyLink = document.querySelector('link[data-vmg-header-sticky-fix]');
  if (stickyLink) stickyLink.href = '/assets/css/vmg-header-sticky-fix.css?v=20260822g';

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
  loadStylesheet('/assets/css/vmg-header-layout-fix.css?v=20260822a', 'data-vmg-header-layout-fix');
  loadScript('/assets/js/vmg-feedback.js?v=20260822g', 'data-vmg-feedback-script');
  loadScript('/assets/js/vmg-help.js?v=20260822g', 'data-vmg-help-script');
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

      var current = link.querySelector('img[data-vmg-social-asset="true"]');
      if (current && current.getAttribute('src') === SOCIAL_ASSETS[key]) return;

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
    var navParent = nav.parentNode;
    if (!navParent) return;

    // These markers MUST be siblings of the nav. Previously they were inserted
    // on the header itself, even though nav lives inside .header-inner, which
    // threw NotFoundError and aborted all sticky/footer synchronization.
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

    function isMenuOpen() {
      return document.body.classList.contains('menu-open') || nav.classList.contains('open');
    }

    function isFooterActuallyVisible() {
      if (!footer || !footer.isConnected) {
        footer = document.querySelector('footer.vmg-global-footer, footer.site-footer');
      }
      if (!footer) return false;
      var rect = footer.getBoundingClientRect();
      var visiblePixels = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      return rect.top < window.innerHeight && rect.bottom > 0 && visiblePixels > 1;
    }

    function syncDesktopTier2(desktop) {
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

    function syncFooterState(footerVisible, menuOpen, desktop, tier2Pinned) {
      var retreat = footerVisible && !menuOpen && (!desktop || tier2Pinned);

      header.classList.toggle('vmg-footer-in-view', retreat);
      header.classList.toggle('vmg-menu-open', menuOpen);
      document.body.classList.toggle('vmg-footer-visible', footerVisible);
      document.body.classList.toggle('vmg-header-retreated', retreat);

      if (backToTop) {
        backToTop.classList.toggle('visible', retreat);
        backToTop.setAttribute('aria-hidden', retreat ? 'false' : 'true');
      }
    }

    function update() {
      raf = 0;
      var desktop = desktopQuery.matches;
      var menuOpen = isMenuOpen();
      var footerVisible = isFooterActuallyVisible();
      var tier2Pinned = syncDesktopTier2(desktop);
      syncFooterState(footerVisible, menuOpen, desktop, tier2Pinned);
    }

    function requestUpdate() {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    document.addEventListener('click', function () { window.setTimeout(requestUpdate, 0); });
    document.addEventListener('keydown', function () { window.setTimeout(requestUpdate, 0); });

    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', requestUpdate);
    else if (desktopQuery.addListener) desktopQuery.addListener(requestUpdate);

    if (footer && 'IntersectionObserver' in window) {
      var footerObserver = new IntersectionObserver(function () {
        requestUpdate();
      }, { root: null, threshold: [0, 0.001, 0.05] });
      footerObserver.observe(footer);
    }

    update();
    window.setTimeout(requestUpdate, 80);
    window.setTimeout(requestUpdate, 300);
    window.setTimeout(requestUpdate, 900);
  }

  function init() {
    hydrateSocialIcons();
    bindTrackForms();
    setActiveNav();
    initHeaderBehavior();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

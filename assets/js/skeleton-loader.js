(function () {
  'use strict';

  var PUBLIC_PATHS = [
    '/', '/index.html', '/who-we-are.html', '/our-impact.html', '/products.html',
    '/product.html', '/resources.html', '/faq.html', '/contact.html', '/contact', '/contact/',
    '/privacy-policy.html', '/disclaimer.html', '/market-prices',
    '/market-prices/', '/market-prices/index.html'
  ];

  if (PUBLIC_PATHS.indexOf(window.location.pathname || '/') === -1) return;

  var body = document.body;
  if (!body) return;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var minimumVisible = reducedMotion ? 80 : 250;
  var maximumVisible = reducedMotion ? 450 : 1400;
  var navigationStart = (window.performance && window.performance.timeOrigin) || Date.now();
  var hidden = false;

  function elapsed() {
    return Math.max(0, Date.now() - navigationStart);
  }

  function notifyLayoutReady() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        /* TradingView owns the widget data/DOM. We only notify host-layout stabilization. */
        window.dispatchEvent(new Event('resize'));
        document.dispatchEvent(new CustomEvent('vmg:layout-ready'));
      });
    });
  }

  function hideLoader() {
    if (hidden) return;
    hidden = true;
    body.classList.add('vmg-loader-hidden');
    body.classList.remove('vmg-loader-active');
    document.dispatchEvent(new CustomEvent('vmg:loader-hidden'));
    notifyLayoutReady();
  }

  function hideAfterMinimum() {
    var wait = Math.max(0, minimumVisible - elapsed());
    window.setTimeout(hideLoader, wait);
  }

  body.classList.add('vmg-loader-active');

  if (document.readyState === 'complete') {
    hideAfterMinimum();
  } else {
    window.addEventListener('load', hideAfterMinimum, { once: true });
  }

  /* Failsafe: loading treatment can never remain stuck. */
  window.setTimeout(hideLoader, Math.max(0, maximumVisible - elapsed()));
})();

(function () {
  'use strict';

  var CONTACT_PATH_RE = /^\/contact(?:\.html)?\/?$/;
  var countryTickerFrame = 0;

  function normalizeContactRouting() {
    document.querySelectorAll('a[href]').forEach(function (link) {
      var rawHref = link.getAttribute('href');
      if (!rawHref || /^(mailto:|tel:|javascript:|#)/i.test(rawHref)) return;

      var label = (link.textContent || '').replace(/\s+/g, ' ').trim();
      var url;

      try {
        url = new URL(rawHref, window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) return;

      var isContactDestination =
        CONTACT_PATH_RE.test(url.pathname) ||
        url.pathname === '/contact-backup.html' ||
        /^(Contact Us|Contact VMG Desk)$/i.test(label);

      if (!isContactDestination) return;

      link.setAttribute('href', '/contact.html' + (url.hash || ''));
    });

    var currentPath = window.location.pathname || '/';
    if (currentPath === '/contact' || currentPath === '/contact/') {
      window.history.replaceState(
        window.history.state,
        '',
        '/contact.html' + window.location.search + window.location.hash
      );
      currentPath = '/contact.html';
    }

    if (currentPath === '/contact.html') {
      var canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = 'https://vashudevan.com/contact.html';
    }
  }

  function measureCountryTicker(track, source, clone) {
    if (!track || !source || !clone) return false;

    var sourceWidth = source.getBoundingClientRect().width;
    var loopDistance = clone.offsetLeft - source.offsetLeft;

    if (sourceWidth <= 0 || loopDistance <= 0) {
      track.classList.remove('vmg-country-ticker-ready');
      track.style.removeProperty('--vmg-country-loop-distance');
      track.removeAttribute('data-vmg-country-loop-distance');
      return false;
    }

    track.style.setProperty('--vmg-country-group-width', sourceWidth.toFixed(3) + 'px');
    track.style.setProperty('--vmg-country-loop-distance', (-loopDistance).toFixed(3) + 'px');
    track.setAttribute('data-vmg-country-loop-distance', loopDistance.toFixed(3));
    track.classList.add('vmg-country-ticker-ready');
    return true;
  }

  function syncCountryTicker() {
    var track = document.getElementById('country-ticker-track');
    if (!track) return;

    track.classList.remove('vmg-country-ticker-ready');
    track.style.removeProperty('--vmg-country-loop-distance');
    track.removeAttribute('data-vmg-country-loop-distance');

    var groups = Array.prototype.slice.call(track.querySelectorAll('.country-ticker-group'));
    if (!groups.length) return;

    var source = groups.find(function (group) {
      return group.getAttribute('aria-hidden') !== 'true' &&
        !group.classList.contains('vmg-country-ticker-clone');
    }) || groups[0];

    var clone = groups.find(function (group) {
      return group !== source && (
        group.classList.contains('vmg-country-ticker-clone') ||
        group.getAttribute('aria-hidden') === 'true'
      );
    });

    groups.forEach(function (group) {
      if (group !== source && group !== clone) group.remove();
    });

    if (!clone) {
      clone = source.cloneNode(true);
      track.appendChild(clone);
    }

    source.removeAttribute('aria-hidden');
    source.classList.remove('vmg-country-ticker-clone');
    clone.classList.add('vmg-country-ticker-clone');
    clone.setAttribute('aria-hidden', 'true');

    if (!measureCountryTicker(track, source, clone)) {
      window.setTimeout(scheduleCountryTickerSync, 120);
    }
  }

  function scheduleCountryTickerSync() {
    if (countryTickerFrame) window.cancelAnimationFrame(countryTickerFrame);
    countryTickerFrame = window.requestAnimationFrame(function () {
      countryTickerFrame = window.requestAnimationFrame(function () {
        countryTickerFrame = 0;
        syncCountryTicker();
      });
    });
  }

  function guardHomepageTickerInstance() {
    var path = window.location.pathname || '/';
    if (path !== '/' && path !== '/index.html') return;

    var host = document.querySelector('.market-ticker-tradingview');
    if (!host) return;

    var embedScripts = Array.prototype.slice.call(
      host.querySelectorAll('script[src*="embed-widget-ticker-tape.js"]')
    );
    embedScripts.slice(1).forEach(function (script) { script.remove(); });

    var widgetRoot = host.querySelector('.tradingview-widget-container__widget');
    if (!widgetRoot) return;

    var frames = Array.prototype.slice.call(widgetRoot.children).filter(function (child) {
      return child.tagName === 'IFRAME';
    });
    frames.slice(1).forEach(function (frame) { frame.remove(); });
  }

  function ensureContactPeople() {
    if (!CONTACT_PATH_RE.test(window.location.pathname || '')) return;

    var panel = document.querySelector('.contact-info-left');
    if (!panel || panel.querySelector('[data-vmg-contact-person="sujit"]')) return;

    var headings = Array.prototype.slice.call(panel.querySelectorAll('h3'));
    var heading = headings.find(function (item) {
      return item.textContent.trim().toLowerCase() === 'contact details';
    });
    if (!heading) return;

    var existingPhone = heading.nextElementSibling;
    if (!existingPhone || !existingPhone.querySelector('a[href^="tel:"]')) return;

    existingPhone.className = 'vmg-contact-person';
    existingPhone.setAttribute('data-vmg-contact-person', 'sujit');
    existingPhone.innerHTML = '<strong>Sujit Gupta</strong><a href="tel:+919879208178">+91 9879208178</a>';

    var shobhik = document.createElement('p');
    shobhik.className = 'vmg-contact-person';
    shobhik.setAttribute('data-vmg-contact-person', 'shobhik');
    shobhik.innerHTML = '<strong>Shobhik Gupta</strong><a href="tel:+919316571362">+91 9316571362</a>';
    existingPhone.insertAdjacentElement('afterend', shobhik);
  }

  function bindExistingFeedbackTriggers() {
    var drawer = document.getElementById('vmg-feedback-drawer');
    if (!drawer) return false;

    document.querySelectorAll('.site-header .vmg-feedback-trigger').forEach(function (button) {
      if (button.dataset.vmgFeedbackHotfixBound === 'true') return;
      button.dataset.vmgFeedbackHotfixBound = 'true';

      button.addEventListener('click', function () {
        function openExistingDrawer() {
          document.body.classList.add('vmg-feedback-open');
          drawer.setAttribute('aria-hidden', 'false');
          document.querySelectorAll('.vmg-feedback-trigger').forEach(function (item) {
            item.setAttribute('aria-expanded', 'true');
          });
          window.setTimeout(function () {
            var first = drawer.querySelector('.vmg-feedback-rating');
            if (first) first.focus();
          }, 20);
        }

        if (window.innerWidth <= 991) {
          var nav = document.getElementById('site-nav');
          var toggle = document.querySelector('.nav-toggle');
          if (nav && nav.classList.contains('open') && toggle) {
            toggle.click();
            window.setTimeout(openExistingDrawer, 170);
            return;
          }
        }
        openExistingDrawer();
      });
    });
    return true;
  }

  function scheduleFeedbackBinding() {
    if (bindExistingFeedbackTriggers()) return;
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (bindExistingFeedbackTriggers() || attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  function stabilizeTradingViewHosts() {
    var hosts = document.querySelectorAll(
      '.market-ticker-tradingview, .market-widget-panel, .market-chart-widget'
    );
    if (!hosts.length) return;

    var attempts = 0;
    function check() {
      attempts += 1;
      var measurable = Array.prototype.every.call(hosts, function (host) {
        var rect = host.getBoundingClientRect();
        return rect.width > 0 && rect.height >= 0;
      });
      if (measurable || attempts >= 8) {
        window.dispatchEvent(new Event('resize'));
        return;
      }
      window.requestAnimationFrame(check);
    }
    window.requestAnimationFrame(check);
  }

  function syncFloatingStack() {
    var trigger = document.querySelector('.vmg-help-trigger');
    if (!trigger) return false;

    var height = Math.ceil(trigger.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty('--vmg-help-trigger-height', height + 'px');
    }
    return height > 0;
  }

  function scheduleFloatingStack() {
    var attempts = 0;
    function measure() {
      attempts += 1;
      if (!syncFloatingStack() && attempts < 24) {
        window.setTimeout(measure, 100);
      }
    }
    measure();
    window.setTimeout(syncFloatingStack, 400);
    window.setTimeout(syncFloatingStack, 1200);
    window.addEventListener('resize', syncFloatingStack, { passive: true });
    window.addEventListener('orientationchange', syncFloatingStack, { passive: true });
  }

  function init() {
    normalizeContactRouting();
    scheduleCountryTickerSync();
    guardHomepageTickerInstance();
    ensureContactPeople();
    scheduleFeedbackBinding();
    stabilizeTradingViewHosts();
    scheduleFloatingStack();

    window.addEventListener('load', scheduleCountryTickerSync, { once: true });
    window.addEventListener('resize', scheduleCountryTickerSync, { passive: true });
    window.addEventListener('orientationchange', scheduleCountryTickerSync, { passive: true });
    document.addEventListener('vmg:loader-hidden', function () {
      scheduleCountryTickerSync();
      guardHomepageTickerInstance();
      stabilizeTradingViewHosts();
      syncFloatingStack();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleCountryTickerSync).catch(function () {});
    }

    /* Re-normalize after shared shell helpers finish any delayed DOM work. */
    window.setTimeout(normalizeContactRouting, 350);
    window.setTimeout(normalizeContactRouting, 1200);
    window.setTimeout(guardHomepageTickerInstance, 350);
    window.setTimeout(guardHomepageTickerInstance, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

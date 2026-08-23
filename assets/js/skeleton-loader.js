(function () {
  'use strict';

  var PUBLIC_PATHS = [
    '/', '/index.html', '/who-we-are.html', '/our-impact.html', '/products.html',
    '/product.html', '/resources.html', '/faq.html', '/contact.html',
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

  function syncMobileCountryTicker() {
    var track = document.getElementById('country-ticker-track');
    if (!track) return;

    var mobile = window.matchMedia('(max-width: 768px)').matches;
    var clone = track.querySelector('.vmg-country-ticker-clone');
    var source = track.querySelector('.country-ticker-group:not(.vmg-country-ticker-clone)');

    if (mobile && source && !clone) {
      clone = source.cloneNode(true);
      clone.classList.add('vmg-country-ticker-clone');
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    } else if (!mobile && clone) {
      clone.remove();
    }
  }

  function ensureContactPeople() {
    if (!/\/contact\.html$/.test(window.location.pathname)) return;

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

  function init() {
    syncMobileCountryTicker();
    ensureContactPeople();
    scheduleFeedbackBinding();
    stabilizeTradingViewHosts();

    window.addEventListener('resize', syncMobileCountryTicker, { passive: true });
    window.addEventListener('orientationchange', syncMobileCountryTicker, { passive: true });
    document.addEventListener('vmg:loader-hidden', stabilizeTradingViewHosts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

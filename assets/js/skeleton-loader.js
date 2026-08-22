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
  var maximumVisible = reducedMotion ? 500 : 1800;
  var navigationStart = (window.performance && window.performance.timeOrigin) || Date.now();
  var hidden = false;

  function elapsed() {
    return Math.max(0, Date.now() - navigationStart);
  }

  function hideLoader() {
    if (hidden) return;
    hidden = true;
    body.classList.add('vmg-loader-hidden');
    body.classList.remove('vmg-loader-active');
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

  window.setTimeout(hideLoader, Math.max(0, maximumVisible - elapsed()));
})();

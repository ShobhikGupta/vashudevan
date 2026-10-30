// VMG Product Search: decorative odometer-style rotating examples.
// The actual input, search logic and results remain owned by main.js.
(function () {
  'use strict';

  var input = document.getElementById('product-search');
  var wrap = input && input.closest('.search-container');
  if (!input || !wrap || wrap.dataset.vmgSearchOdometer === 'true') return;

  var examples = ["6063 Extrusions (TOTO)","6061 Truck Wheels (TROMA)","Used Beverage Cans (TALDON) (UBC)","Bare Bright Wire (BARLEY)","#1 Copper (BERRY/CANDY)","HMS 1 & 2","304 Solids (SABOT)","Yellow Brass (HONEY)","Cast Aluminum (TENSE)","ZORBA","316 Solids","EC Wire (TALON)","#2 Copper (BIRCH/CLIFF)","304 Turnings (ULTRA)","Aluminum Extrusions (TATA)","Red Brass (EBONY)","ZURIK","PNS","Mixed Motors (ELMO)","Drained Lead Acid Batteries (RAINS)","AC Compressors"];
  // Quick Blinkit-inspired cadence, using the same 21 VMG material examples.
  var ROTATE_MS = 1150;
  var ROLL_MS = 240;
  var reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var currentIndex = 0;
  var timer = null, finishTimer = null, frame = null;
  wrap.dataset.vmgSearchOdometer = 'true';

  function span(classes, content) {
    var el = document.createElement('span');
    el.className = classes;
    if (content) el.textContent = content;
    return el;
  }
  var placeholder = span('vmg-search-placeholder');
  placeholder.setAttribute('aria-hidden', 'true');
  var lead = span('vmg-search-placeholder__lead', 'Search for ');
  var windowEl = span('vmg-search-placeholder__window');
  var current = span('vmg-search-placeholder__word vmg-search-placeholder__word--current', '“' + examples[0] + '”');
  var incoming = span('vmg-search-placeholder__word vmg-search-placeholder__word--next');
  windowEl.appendChild(current);
  windowEl.appendChild(incoming);
  placeholder.appendChild(lead);
  placeholder.appendChild(windowEl);
  wrap.insertBefore(placeholder, input.nextSibling);
  input.setAttribute('aria-label', 'Search VMG products and recyclable metal grades');
  wrap.classList.add('vmg-search-odometer');

  function allowed() {
    return !document.hidden && document.activeElement !== input &&
      !input.value && !(wrap.querySelector('.vmg-browse-toggle[aria-expanded="true"]')) && !(reducedMotion && reducedMotion.matches);
  }

  function stop() {
    if (timer !== null) window.clearTimeout(timer);
    if (finishTimer !== null) window.clearTimeout(finishTimer);
    if (frame !== null) window.cancelAnimationFrame(frame);
    timer = finishTimer = frame = null;
    wrap.classList.remove('vmg-search-idle');
    current.className = 'vmg-search-placeholder__word vmg-search-placeholder__word--current';
    incoming.className = 'vmg-search-placeholder__word vmg-search-placeholder__word--next';
  }

  function rotate() {
    timer = null;
    if (!allowed()) { stop(); return; }
    var nextIndex = (currentIndex + 1) % examples.length;
    incoming.textContent = '“' + examples[nextIndex] + '”';
    frame = window.requestAnimationFrame(function () {
      frame = null;
      if (!allowed()) { stop(); return; }
      current.className = 'vmg-search-placeholder__word vmg-search-placeholder__word--leaving';
      incoming.className = 'vmg-search-placeholder__word vmg-search-placeholder__word--entering';
      finishTimer = window.setTimeout(function () {
        finishTimer = null;
        var outgoing = current;
        current = incoming;
        incoming = outgoing;
        currentIndex = nextIndex;
        incoming.className = 'vmg-search-placeholder__word vmg-search-placeholder__word--next';
        current.className = 'vmg-search-placeholder__word vmg-search-placeholder__word--current';
        if (allowed()) timer = window.setTimeout(rotate, ROTATE_MS);
        else stop();
      }, ROLL_MS);
    });
  }

  function sync() {
    if (!allowed()) { stop(); return; }
    wrap.classList.add('vmg-search-idle');
    if (timer === null && finishTimer === null && frame === null) {
      timer = window.setTimeout(rotate, ROTATE_MS);
    }
  }

  input.addEventListener('focus', sync);
  var browseToggle=wrap.querySelector('.vmg-browse-toggle');
  if(browseToggle) browseToggle.addEventListener('click',function(){window.setTimeout(sync,0)});
  input.addEventListener('blur', sync);
  input.addEventListener('input', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  if (reducedMotion) {
    if (typeof reducedMotion.addEventListener === 'function') reducedMotion.addEventListener('change', sync);
    else if (typeof reducedMotion.addListener === 'function') reducedMotion.addListener(sync);
  }
  sync();
})();

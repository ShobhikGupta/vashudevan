(function () {
  'use strict';

  var ROOT_ID = 'vmg-help';
  var activeTrigger = null;
  var helpIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 1.8-2.5 2-2.5 3.6M12 17.2h.01"/></svg>';
  var brochureIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5v4h4M9 12h6M9 15h6"/></svg>';
  var callIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 3.8 9 3.2l2.1 5.1-1.6 1.5c1.1 2.2 2.9 4 5.1 5.1l1.5-1.6 5.1 2.1-.6 2.4c-.4 1.5-1.8 2.5-3.3 2.3C10.2 19.2 4.8 13.8 3.9 6.7c-.2-1.5.8-2.9 2.3-3.3l.4-.1Z"/></svg>';
  var topIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';

  function ensureFixStylesheet() {
    if (!document.head) return;

    if (!document.querySelector('link[data-vmg-chatgpt-mobile-fixes]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/assets/css/vmg-chatgpt-mobile-fixes.css?v=20260821h';
      link.setAttribute('data-vmg-chatgpt-mobile-fixes', 'true');
      document.head.appendChild(link);
    }

    if (!document.querySelector('link[data-vmg-header-sticky-fix]')) {
      var sticky = document.createElement('link');
      sticky.rel = 'stylesheet';
      sticky.href = '/assets/css/vmg-header-sticky-fix.css?v=20260822b';
      sticky.setAttribute('data-vmg-header-sticky-fix', 'true');
      document.head.appendChild(sticky);
    }

    if (!document.querySelector('link[data-vmg-header-combined]')) {
      var combined = document.createElement('link');
      combined.rel = 'stylesheet';
      combined.href = '/assets/css/vmg-header-combined.css?v=20260907a';
      combined.setAttribute('data-vmg-header-combined', 'true');
      document.head.appendChild(combined);
    }
  }

  function upgradeHeaderBrand(attempt) {
    attempt = attempt || 0;
    var brands = document.querySelectorAll('.site-header.vmg-econship-header .logo');
    if (!brands.length) {
      if (attempt < 30) window.setTimeout(function () { upgradeHeaderBrand(attempt + 1); }, 80);
      return;
    }

    brands.forEach(function (brand) {
      if (brand.dataset.vmgCombinedBrand === 'true') return;
      brand.dataset.vmgCombinedBrand = 'true';
      brand.classList.add('vmg-logo-combined');
      brand.setAttribute('aria-label', 'Vashudevan MetGlobal LLP home');

      var image = brand.querySelector('img');
      if (!image) {
        image = document.createElement('img');
        brand.insertBefore(image, brand.firstChild);
      }
      image.className = 'vmg-header-logo-combined';
      image.src = '/assets/img/vmg-combined-logo.png';
      image.alt = 'Vashudevan MetGlobal LLP';
      image.removeAttribute('width');
      image.removeAttribute('height');
      image.decoding = 'async';

      Array.prototype.slice.call(brand.children).forEach(function (child) {
        if (child !== image) brand.removeChild(child);
      });
    });
  }

  function replaceTextNodes(element, replacements) {
    if (!element) return;
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (textNode) {
      var next = textNode.nodeValue;
      replacements.forEach(function (pair) { next = next.replace(pair[0], pair[1]); });
      if (next !== textNode.nodeValue) textNode.nodeValue = next;
    });
  }

  function normalizeLegalAndBrochureLabels() {
    var brochureReplacements = [
      [/Download The VMG Company Profile/gi, 'Download The VMG Brochure'],
      [/Preview Company Profile/gi, 'Preview VMG Brochure'],
      [/Download Company Profile/gi, 'Download VMG Brochure'],
      [/View Company Profile/gi, 'View VMG Brochure'],
      [/Company Profile/gi, 'VMG Brochure']
    ];

    document.querySelectorAll('a, button, h1, h2, h3, h4, .section-label, .eyebrow').forEach(function (element) {
      replaceTextNodes(element, brochureReplacements);
      ['aria-label', 'title'].forEach(function (attribute) {
        var value = element.getAttribute && element.getAttribute(attribute);
        if (!value) return;
        brochureReplacements.forEach(function (pair) { value = value.replace(pair[0], pair[1]); });
        element.setAttribute(attribute, value);
      });
    });

    document.querySelectorAll('a').forEach(function (link) {
      var text = link.textContent.trim();
      if (/^privacy policy$/i.test(text)) link.href = '/privacy-policy.html';
      if (/^(terms\s*&\s*conditions|terms and conditions|t&c)$/i.test(text)) {
        link.textContent = 'Disclaimer';
        link.href = '/disclaimer.html';
      }
    });
  }

  function polishMobileNavUtilityLinks(attempt) {
    attempt = attempt || 0;
    var item = document.querySelector('.vmg-mobile-bottom-links');
    var row = item && item.querySelector('.vmg-mobile-bottom-links-row');
    if (!item || !row) {
      if (attempt < 25) window.setTimeout(function () { polishMobileNavUtilityLinks(attempt + 1); }, 80);
      return;
    }

    row.innerHTML = [
      '<a href="/faq.html">FAQ</a>',
      '<a href="/privacy-policy.html">Privacy Policy</a>',
      '<a href="/disclaimer.html">Disclaimer</a>'
    ].join('');
    row.setAttribute('aria-label', 'FAQ and legal links');

    var brochureCta = item.querySelector('.vmg-mobile-brochure-cta');
    if (!brochureCta) {
      brochureCta = document.createElement('a');
      brochureCta.className = 'vmg-mobile-brochure-cta';
      brochureCta.href = '/Vashudevan-MetGlobal-Company-Profile.pdf';
      brochureCta.target = '_blank';
      brochureCta.rel = 'noopener noreferrer';
      brochureCta.setAttribute('aria-label', 'View VMG brochure');
      brochureCta.innerHTML = brochureIcon + '<span>VMG BROCHURE</span><span class="vmg-mobile-brochure-arrow" aria-hidden="true">↗</span>';
      item.appendChild(brochureCta);
    }
  }

  function polishFooterLinks(attempt) {
    attempt = attempt || 0;
    var list = document.querySelector('.vmg-footer-mini-links');
    if (!list) {
      if (attempt < 30) window.setTimeout(function () { polishFooterLinks(attempt + 1); }, 100);
      return;
    }
    list.innerHTML = [
      '<li><a href="/faq.html">FAQ</a></li>',
      '<li><a href="/privacy-policy.html">Privacy Policy</a></li>',
      '<li><a href="/disclaimer.html">Disclaimer</a></li>',
      '<li><a href="/Vashudevan-MetGlobal-Company-Profile.pdf" target="_blank" rel="noopener">VMG Brochure</a></li>',
      '<li><a href="/contact.html">Contact Us</a></li>'
    ].join('');
  }

  function enhanceContactPage() {
    if (!/\/contact\.html$/.test(window.location.pathname)) return;
    var contactPanel = document.querySelector('.contact-info-left');
    if (contactPanel && !contactPanel.querySelector('[data-vmg-contact-person="sujit"]')) {
      var headings = Array.prototype.slice.call(contactPanel.querySelectorAll('h3'));
      var detailsHeading = headings.find(function (heading) { return heading.textContent.trim().toLowerCase() === 'contact details'; });
      if (detailsHeading) {
        var phoneParagraph = detailsHeading.nextElementSibling;
        if (phoneParagraph && phoneParagraph.querySelector('a[href^="tel:"]')) {
          phoneParagraph.className = 'vmg-contact-person';
          phoneParagraph.setAttribute('data-vmg-contact-person', 'sujit');
          phoneParagraph.innerHTML = '<strong>Sujit Gupta</strong><a href="tel:+919879208178">+91 9879208178</a>';
          var shobhik = document.createElement('p');
          shobhik.className = 'vmg-contact-person';
          shobhik.setAttribute('data-vmg-contact-person', 'shobhik');
          shobhik.innerHTML = '<strong>Shobhik Gupta</strong><a href="tel:+919316571362">+91 9316571362</a>';
          phoneParagraph.insertAdjacentElement('afterend', shobhik);
        }
      }
    }

    var privacyLink = document.querySelector('.privacy-link');
    if (privacyLink) privacyLink.href = '/privacy-policy.html';
    var smallNote = document.querySelector('.cta-join .small-note');
    if (smallNote) smallNote.innerHTML = 'Learn about our <a href="/privacy-policy.html">Privacy Policy</a> &amp; <a href="/disclaimer.html">Disclaimer</a>';
  }

  function closeMenu(restoreFocus) {
    var root = document.getElementById(ROOT_ID);
    if (!root || !root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    document.body.classList.remove('vmg-help-open');
    root.querySelector('.vmg-help-trigger').setAttribute('aria-expanded', 'false');
    root.querySelector('.vmg-help-menu').setAttribute('aria-hidden', 'true');
    if (restoreFocus && activeTrigger) activeTrigger.focus();
  }

  function openMenu(trigger) {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    activeTrigger = trigger;
    root.classList.add('is-open');
    document.body.classList.add('vmg-help-open');
    trigger.setAttribute('aria-expanded', 'true');
    root.querySelector('.vmg-help-menu').setAttribute('aria-hidden', 'false');
    window.setTimeout(function () { var first = root.querySelector('.vmg-help-menu a'); if (first) first.focus(); }, 20);
  }

  function resolveHero() {
    var selectors = [
      '.home-hero', '.market-page-hero', '.who-hero', '.res-hero', '.faq-hero', '.legal-hero',
      'main > .page-hero', 'main .page-hero'
    ];
    for (var i = 0; i < selectors.length; i += 1) {
      var found = document.querySelector(selectors[i]);
      if (found) return found;
    }
    var main = document.querySelector('main');
    return main ? main.querySelector(':scope > section') : null;
  }

  function ensureWhatsappFloat() {
    var existing = document.getElementById('whatsapp-float');
    if (existing) return existing;
    var link = document.createElement('a');
    link.id = 'whatsapp-float';
    link.className = 'whatsapp-float';
    link.href = 'https://wa.me/919879208178?text=Hello%2C%20I%20visited%20your%20website%20and%20want%20to%20know%20more.';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Chat with Vashudevan MetGlobal LLP on WhatsApp');
    link.innerHTML = '<img src="/assets/img/whatsapp-logo.png" alt="" decoding="async"><span class="whatsapp-tooltip">Chat with us</span>';
    document.body.appendChild(link);
    return link;
  }

  function ensureCallButton() {
    var button = document.getElementById('vmg-call-float');
    if (button) return button;
    button = document.createElement('a');
    button.id = 'vmg-call-float';
    button.className = 'vmg-floating-circle vmg-call-float';
    button.href = 'tel:+919879208178';
    button.setAttribute('aria-label', 'Call Vashudevan MetGlobal LLP');
    button.innerHTML = callIcon;
    return button;
  }

  function ensureTopButton() {
    var button = document.getElementById('back-to-top');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'back-to-top';
      button.className = 'back-to-top';
      document.body.appendChild(button);
    }
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML = topIcon;
    if (button.dataset.vmgTopBound !== 'true') {
      button.dataset.vmgTopBound = 'true';
      button.addEventListener('click', function () {
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }
    return button;
  }

  function bindHeroVisibility(button) {
    if (!button || button.dataset.vmgHeroVisibility === 'true') return;
    var hero = resolveHero();
    if (!hero) {
      button.classList.remove('visible');
      return;
    }
    button.dataset.vmgHeroVisibility = 'true';
    var sentinel = document.createElement('span');
    sentinel.className = 'vmg-hero-passed-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    hero.insertAdjacentElement('afterend', sentinel);

    function setPassed(passed) {
      button.classList.toggle('visible', !!passed);
      document.body.classList.toggle('scroll-top-visible', !!passed);
    }
    setPassed(hero.getBoundingClientRect().bottom <= 0);

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          setPassed(entry.boundingClientRect.top <= 0 && !entry.isIntersecting);
        });
      }, { root: null, threshold: 0 });
      observer.observe(sentinel);
    }

    var ticking = false;
    function syncFromHero() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        setPassed(hero.getBoundingClientRect().bottom <= 0);
        ticking = false;
      });
    }
    window.addEventListener('scroll', syncFromHero, { passive: true });
    window.addEventListener('resize', syncFromHero, { passive: true });
    window.addEventListener('orientationchange', syncFromHero, { passive: true });
  }

  function buildFloatingActions() {
    var help = document.getElementById(ROOT_ID);
    if (!help) return;
    var stack = document.querySelector('.vmg-floating-actions');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'vmg-floating-actions';
      stack.setAttribute('aria-label', 'Quick contact actions');
      document.body.appendChild(stack);
    }
    var top = ensureTopButton();
    var call = ensureCallButton();
    var whatsapp = ensureWhatsappFloat();
    whatsapp.setAttribute('aria-label', 'Chat with Vashudevan MetGlobal LLP on WhatsApp');
    [top, call, whatsapp, help].forEach(function (node) { if (node.parentNode !== stack) stack.appendChild(node); });
    bindHeroVisibility(top);
  }

  function createHelp() {
    ensureFixStylesheet();
    upgradeHeaderBrand();
    polishMobileNavUtilityLinks();
    polishFooterLinks();
    enhanceContactPage();
    normalizeLegalAndBrochureLabels();
    window.setTimeout(upgradeHeaderBrand, 350);
    window.setTimeout(upgradeHeaderBrand, 1200);
    window.setTimeout(normalizeLegalAndBrochureLabels, 350);
    window.setTimeout(normalizeLegalAndBrochureLabels, 1200);

    if (document.getElementById(ROOT_ID)) return;

    var root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'vmg-help';
    root.innerHTML = [
      '<div class="vmg-help-menu" id="vmg-help-menu" role="menu" aria-label="VMG help options" aria-hidden="true">',
        '<p>How can we help?</p>',
        '<a role="menuitem" href="https://wa.me/919879208178" target="_blank" rel="noopener noreferrer">WhatsApp VMG</a>',
        '<a role="menuitem" href="/contact.html?type=callback#contact-form">Call Back Request</a>',
        '<a role="menuitem" href="/contact.html?type=seller#contact-form">Submit Material Offer</a>',
        '<a role="menuitem" href="/contact.html?type=buyer#contact-form">Send Buying Requirement</a>',
        '<a role="menuitem" href="mailto:exim@vashudevan.com">Email Us</a>',
        '<a role="menuitem" href="/Vashudevan-MetGlobal-Company-Profile.pdf" download="Vashudevan-MetGlobal-Company-Profile.pdf">Download VMG Brochure</a>',
      '</div>',
      '<button class="vmg-help-trigger" type="button" aria-controls="vmg-help-menu" aria-expanded="false">',
        helpIcon,
        '<span>Need Help?</span>',
      '</button>'
    ].join('');

    document.body.appendChild(root);
    buildFloatingActions();
    window.setTimeout(buildFloatingActions, 250);
    window.setTimeout(buildFloatingActions, 900);
    var trigger = root.querySelector('.vmg-help-trigger');
    trigger.addEventListener('click', function () { if (root.classList.contains('is-open')) closeMenu(false); else openMenu(trigger); });
    root.querySelectorAll('.vmg-help-menu a').forEach(function (link) { link.addEventListener('click', function () { closeMenu(false); }); });
    document.addEventListener('pointerdown', function (event) { if (!root.contains(event.target)) closeMenu(false); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && root.classList.contains('is-open')) { event.preventDefault(); closeMenu(true); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createHelp, { once: true });
  else createHelp();
})();

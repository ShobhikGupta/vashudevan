(function () {
  'use strict';

  var ROOT_ID = 'vmg-help';
  var activeTrigger = null;
  var helpIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 1.8-2.5 2-2.5 3.6M12 17.2h.01"/></svg>';
  var brochureIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5v4h4M9 12h6M9 15h6"/></svg>';

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

  function createHelp() {
    ensureFixStylesheet();
    polishMobileNavUtilityLinks();
    polishFooterLinks();
    enhanceContactPage();
    normalizeLegalAndBrochureLabels();
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
    var trigger = root.querySelector('.vmg-help-trigger');
    trigger.addEventListener('click', function () { if (root.classList.contains('is-open')) closeMenu(false); else openMenu(trigger); });
    root.querySelectorAll('.vmg-help-menu a').forEach(function (link) { link.addEventListener('click', function () { closeMenu(false); }); });
    document.addEventListener('pointerdown', function (event) { if (!root.contains(event.target)) closeMenu(false); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && root.classList.contains('is-open')) { event.preventDefault(); closeMenu(true); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createHelp, { once: true });
  else createHelp();
})();

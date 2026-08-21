(function () {
  'use strict';

  var ROOT_ID = 'vmg-help';
  var activeTrigger = null;
  var helpIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 1.8-2.5 2-2.5 3.6M12 17.2h.01"/></svg>';
  var brochureIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h8l4 4V20.5H6z"/><path d="M14 3.5v4h4M9 12h6M9 15h6"/></svg>';

  function ensureFixStylesheet() {
    if (!document.head || document.querySelector('link[data-vmg-chatgpt-mobile-fixes]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/css/vmg-chatgpt-mobile-fixes.css?v=20260821d';
    link.setAttribute('data-vmg-chatgpt-mobile-fixes', 'true');
    document.head.appendChild(link);
  }

  function polishMobileNavUtilityLinks(attempt) {
    attempt = attempt || 0;
    var item = document.querySelector('.vmg-mobile-bottom-links');
    var row = item && item.querySelector('.vmg-mobile-bottom-links-row');

    if (!item || !row) {
      if (attempt < 20) {
        window.setTimeout(function () { polishMobileNavUtilityLinks(attempt + 1); }, 80);
      }
      return;
    }

    var children = Array.prototype.slice.call(row.children);
    var faq = children.find(function (node) {
      return node.tagName === 'A' && /\/faq\.html(?:$|[?#])/.test(node.getAttribute('href') || '');
    });
    var privacy = row.querySelector('[data-vmg-nav-legal="Privacy Policy"]');
    var terms = row.querySelector('[data-vmg-nav-legal="Terms & Conditions"]');
    var profileLink = children.find(function (node) {
      return node.tagName === 'A' && /Vashudevan-MetGlobal-Company-Profile\.pdf/.test(node.getAttribute('href') || '');
    });

    if (profileLink) profileLink.remove();
    [faq, privacy, terms].forEach(function (node) {
      if (node) row.appendChild(node);
    });
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
    window.setTimeout(function () {
      var first = root.querySelector('.vmg-help-menu a');
      if (first) first.focus();
    }, 20);
  }

  function createHelp() {
    ensureFixStylesheet();
    polishMobileNavUtilityLinks();

    if (document.getElementById(ROOT_ID)) return;

    var root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'vmg-help';
    root.innerHTML = [
      '<div class="vmg-help-menu" id="vmg-help-menu" role="menu" aria-label="VMG help options" aria-hidden="true">',
        '<p>How can we help?</p>',
        '<a role="menuitem" href="https://wa.me/919879208178" target="_blank" rel="noopener noreferrer">WhatsApp VMG</a>',
        '<a role="menuitem" href="/contact.html">Call Back Request</a>',
        '<a role="menuitem" href="/contact.html">Submit Material Offer</a>',
        '<a role="menuitem" href="/contact.html">Send Buying Requirement</a>',
        '<a role="menuitem" href="mailto:exim@vashudevan.com">Email Us</a>',
        '<a role="menuitem" href="/Vashudevan-MetGlobal-Company-Profile.pdf" download="Vashudevan-MetGlobal-Company-Profile.pdf">Download Company Profile</a>',
      '</div>',
      '<button class="vmg-help-trigger" type="button" aria-controls="vmg-help-menu" aria-expanded="false">',
        helpIcon,
        '<span>Need Help?</span>',
      '</button>'
    ].join('');

    document.body.appendChild(root);

    var trigger = root.querySelector('.vmg-help-trigger');
    trigger.addEventListener('click', function () {
      if (root.classList.contains('is-open')) closeMenu(false);
      else openMenu(trigger);
    });

    root.querySelectorAll('.vmg-help-menu a').forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(false); });
    });

    document.addEventListener('pointerdown', function (event) {
      if (!root.contains(event.target)) closeMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('is-open')) {
        event.preventDefault();
        closeMenu(true);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createHelp, { once: true });
  } else {
    createHelp();
  }
})();

(function () {
  'use strict';

  var ROOT_ID = 'vmg-help';
  var activeTrigger = null;
  var helpIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 0 1 4.8 1c0 1.8-2.5 2-2.5 3.6M12 17.2h.01"/></svg>';

  function closeMenu(restoreFocus) {
    var root = document.getElementById(ROOT_ID);
    if (!root || !root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    root.querySelector('.vmg-help-trigger').setAttribute('aria-expanded', 'false');
    root.querySelector('.vmg-help-menu').setAttribute('aria-hidden', 'true');
    if (restoreFocus && activeTrigger) activeTrigger.focus();
  }

  function openMenu(trigger) {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    activeTrigger = trigger;
    root.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    root.querySelector('.vmg-help-menu').setAttribute('aria-hidden', 'false');
    window.setTimeout(function () {
      var first = root.querySelector('.vmg-help-menu a');
      if (first) first.focus();
    }, 20);
  }

  function createHelp() {
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

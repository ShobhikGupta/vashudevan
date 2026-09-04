(function () {
  'use strict';

  var observer = null;

  function ensureStyles() {
    if (document.getElementById('vmg-popup-premium-style')) return;
    var style = document.createElement('style');
    style.id = 'vmg-popup-premium-style';
    style.textContent = [
      '.opening-popup-card{border:1px solid #e3e6ea!important;border-radius:14px!important;box-shadow:0 22px 60px rgba(15,23,42,.22),0 3px 12px rgba(15,23,42,.08)!important;background:#fff!important}',
      '.opening-popup-header{display:block!important;position:relative!important;text-align:center!important}',
      '.opening-popup-header>div:not(.opening-popup-brand){width:100%!important;text-align:center!important}',
      '.opening-popup-brand{width:100%;text-align:center;margin:0 auto 12px;padding:0 0 12px;border-bottom:1px solid #e8eaed}',
      '.opening-popup-brand-logo{display:block;width:100%;max-width:270px;height:82px;object-fit:contain;object-position:center;margin:0 auto 7px}',
      '.opening-popup-contact-row{display:flex;align-items:center;justify-content:center;gap:10px;min-width:0;color:#657083;font-size:11.5px;font-weight:500;letter-spacing:-.01em;white-space:nowrap}',
      '.opening-popup-contact-item{display:inline-flex;align-items:center;gap:6px;min-width:0}',
      '.opening-popup-contact-item svg{width:17px;height:17px;flex:0 0 17px;stroke:#b6542a;stroke-width:1.65;fill:none}',
      '.opening-popup-contact-separator{width:1px;height:17px;background:#e2e5e9;flex:0 0 1px}',
      '.opening-popup-title{margin:0 0 4px!important;color:#101828!important;font-size:18px!important;line-height:1.2!important;font-weight:750!important;letter-spacing:-.025em!important}',
      '.opening-popup-subtitle{margin:0 0 10px!important;color:#737d8d!important;font-size:12.5px!important;line-height:1.45!important;font-weight:400!important}',
      '.opening-popup-close{top:0!important;right:0!important;width:28px!important;height:28px!important;display:grid!important;place-items:center!important;padding:0!important;color:#667085!important;font-size:19px!important;border-radius:8px!important;z-index:3!important}',
      '.opening-popup-close:hover{background:#f5f6f7!important;color:#344054!important}',
      '.opening-popup-form .field label{color:#566174!important;font-weight:500!important}',
      '.opening-popup-form .field input,.opening-popup-form .field select,.opening-phone-wrap{border-color:#d7dce2!important;box-shadow:0 1px 2px rgba(16,24,40,.025)}',
      '.opening-popup-form .field input:focus,.opening-popup-form .field select:focus{border-color:#aeb7c3!important;outline:none!important;box-shadow:0 0 0 3px rgba(148,163,184,.11)!important}',
      '.opening-phone-wrap:focus-within{border-color:#aeb7c3!important;box-shadow:0 0 0 3px rgba(148,163,184,.11)!important}',
      '.opening-dial-code{background:#fafbfc!important;color:#344054!important;border-right-color:#e7eaee!important}',
      '.opening-popup-submit:disabled{background:#e9ebef!important;color:#98a2b3!important;box-shadow:none!important}',
      '.opening-popup-turnstile-field>label{display:none!important}',
      '.opening-popup-turnstile-field{margin:0!important;min-height:0!important}',
      '.opening-popup-turnstile{min-height:0!important}',
      '.opening-popup-turnstile-error:empty{display:none!important}',
      '@media(max-width:430px){.opening-popup-brand-logo{max-width:235px;height:72px}.opening-popup-contact-row{gap:7px;font-size:10.5px}.opening-popup-contact-item{gap:4px}.opening-popup-contact-item svg{width:15px;height:15px;flex-basis:15px}.opening-popup-contact-separator{height:15px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function enhance(card) {
    if (!card || card.dataset.vmgPremiumPopup === 'true') return true;
    var header = card.querySelector('.opening-popup-header');
    if (!header) return false;

    card.dataset.vmgPremiumPopup = 'true';
    var brand = document.createElement('div');
    brand.className = 'opening-popup-brand';
    brand.innerHTML = [
      '<img class="opening-popup-brand-logo" src="/assets/img/LOGO.png" alt="Vashudevan Met Global LLP">',
      '<div class="opening-popup-contact-row" aria-label="Vashudevan contact details">',
        '<span class="opening-popup-contact-item">',
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.75 5.75h16.5v12.5H3.75z"/><path d="m4.5 7 7.5 6 7.5-6"/></svg>',
          '<span>exim@vashudevan.com</span>',
        '</span>',
        '<span class="opening-popup-contact-separator" aria-hidden="true"></span>',
        '<span class="opening-popup-contact-item">',
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 3.75 4.8 6.15c-.6.6-.72 1.5-.3 2.25 2.55 4.55 6.1 8.1 10.65 10.65.75.42 1.65.3 2.25-.3l2.4-2.5-4-3.1-1.9 1.9c-2.2-1.25-3.95-3-5.2-5.2l1.9-1.9-3.3-4.2Z"/></svg>',
          '<span>+91 9879208178</span>',
        '</span>',
      '</div>'
    ].join('');

    var titleBlock = header.querySelector('div');
    if (titleBlock) header.insertBefore(brand, titleBlock);
    else header.insertBefore(brand, header.firstChild);
    return true;
  }

  function scan() {
    var card = document.querySelector('.opening-popup-card');
    if (card && enhance(card) && observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function init() {
    ensureStyles();
    scan();
    if (!document.querySelector('.opening-popup-card') && window.MutationObserver) {
      observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes && mutations[i].addedNodes.length) {
            scan();
            if (!observer) break;
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

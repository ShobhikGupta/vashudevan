(function () {
  'use strict';

  if (window.VMGSubmitState) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var originals = new WeakMap();

  function remember(button) {
    if (!button || originals.has(button)) return;
    originals.set(button, {
      html: button.innerHTML,
      ariaLabel: button.getAttribute('aria-label')
    });
    button.classList.add('vmg-submit-state');
  }

  function restore(button) {
    var original = originals.get(button);
    if (!original) return;
    button.innerHTML = original.html;
    if (original.ariaLabel === null) button.removeAttribute('aria-label');
    else button.setAttribute('aria-label', original.ariaLabel);
  }

  function set(button, state) {
    if (!button) return;
    remember(button);
    button.classList.remove('is-submitting', 'is-success', 'is-error');

    if (state === 'loading' || state === 'submitting') {
      button.classList.add('is-submitting');
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.setAttribute('aria-label', 'Sending');
      if (reducedMotion.matches) button.textContent = 'Sending…';
      return;
    }

    if (state === 'success') {
      button.classList.add('is-success');
      button.disabled = true;
      button.setAttribute('aria-busy', 'false');
      button.setAttribute('aria-label', 'Sent');
      if (reducedMotion.matches) button.textContent = '✓ Sent';
      return;
    }

    restore(button);
    button.setAttribute('aria-busy', 'false');
    button.disabled = false;
    if (state === 'error') button.classList.add('is-error');
  }

  function prepare(button) {
    remember(button);
    button.setAttribute('aria-busy', 'false');
    return button;
  }

  function bindOpeningPopup(form) {
    if (!form || form.dataset.vmgSubmitStateBound === 'true') return;
    var button = form.querySelector('.opening-popup-submit');
    var success = form.querySelector('.opening-popup-success');
    if (!button) return;
    form.dataset.vmgSubmitStateBound = 'true';
    prepare(button);

    form.addEventListener('submit', function () {
      window.setTimeout(function () {
        if (button.disabled) set(button, 'loading');
      }, 0);
    });

    if (success && window.MutationObserver) {
      var successObserver = new MutationObserver(function () {
        var style = window.getComputedStyle(success);
        var visible = style.display !== 'none' && style.visibility !== 'hidden' && (success.textContent || '').trim();
        if (visible) set(button, 'success');
      });
      successObserver.observe(success, { attributes: true, childList: true, characterData: true, subtree: true });
    }

    if (window.MutationObserver) {
      var buttonObserver = new MutationObserver(function () {
        if (!button.disabled && !button.classList.contains('is-success')) set(button, 'idle');
      });
      buttonObserver.observe(button, { attributes: true, attributeFilter: ['disabled'] });
    }
  }

  function scanPopup() {
    document.querySelectorAll('.opening-popup-form').forEach(bindOpeningPopup);
  }

  window.VMGSubmitState = {
    prepare: prepare,
    set: set
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scanPopup, { once: true });
  else scanPopup();

  if (window.MutationObserver) {
    var observer = new MutationObserver(scanPopup);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

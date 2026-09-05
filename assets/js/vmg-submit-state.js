(function () {
  'use strict';
  if (!document || !document.head) return;
  function load(src, marker) {
    if (document.querySelector('script[' + marker + ']')) return;
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(marker, 'true');
    document.head.appendChild(script);
  }
  load('/assets/js/vmg-country-phone.js?v=20260905a', 'data-vmg-country-phone');
  load('/assets/js/vmg-popup-security.js?v=20260905c', 'data-vmg-popup-security');
  load('/assets/js/vmg-popup-premium.js?v=20260905c', 'data-vmg-popup-premium');
})();

(function () {
  'use strict';

  if (window.VMGSubmitState) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var originals = new WeakMap();
  var resetTimers = new WeakMap();

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
    var existingTimer = resetTimers.get(button);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      resetTimers.delete(button);
    }
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

  function idleAfter(button, delay) {
    var timer = window.setTimeout(function () {
      resetTimers.delete(button);
      set(button, 'idle');
    }, delay);
    resetTimers.set(button, timer);
  }

  function prepare(button) {
    remember(button);
    button.setAttribute('aria-busy', 'false');
    return button;
  }

  function bindStatusDrivenForm(form, buttonSelector, statusSelector) {
    if (!form || form.dataset.vmgSubmitStateBound === 'true') return;
    var button = form.querySelector(buttonSelector);
    var status = form.querySelector(statusSelector);
    if (!button || !status) return;
    form.dataset.vmgSubmitStateBound = 'true';
    prepare(button);

    form.addEventListener('submit', function () {
      window.setTimeout(function () {
        if (button.disabled) set(button, 'loading');
      }, 0);
    }, true);

    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function () {
      var text = (status.textContent || '').trim();
      if (status.classList.contains('is-success') && text) {
        set(button, 'success');
        idleAfter(button, 1300);
      } else if (status.classList.contains('is-error') && text) {
        set(button, 'error');
        idleAfter(button, 260);
      } else if (/sending/i.test(text)) {
        set(button, 'loading');
      }
    });
    observer.observe(status, { attributes: true, childList: true, characterData: true, subtree: true });
  }

  function bindOpeningPopup(form) {
    if (!form || form.dataset.vmgSubmitStateBound === 'true') return;
    var button = form.querySelector('.opening-popup-submit');
    var success = form.querySelector('.opening-popup-success');
    if (!button || !success) return;
    form.dataset.vmgSubmitStateBound = 'true';
    prepare(button);

    form.addEventListener('submit', function () {
      window.setTimeout(function () {
        if (button.disabled) set(button, 'loading');
      }, 0);
    }, true);

    if (window.MutationObserver) {
      var successObserver = new MutationObserver(function () {
        var style = window.getComputedStyle(success);
        var visible = style.display !== 'none' && style.visibility !== 'hidden' && (success.textContent || '').trim();
        if (visible) set(button, 'success');
      });
      successObserver.observe(success, { attributes: true, childList: true, characterData: true, subtree: true });
    }
  }

  function scan() {
    document.querySelectorAll('.opening-popup-form').forEach(bindOpeningPopup);
    document.querySelectorAll('#vmg-feedback-form').forEach(function (form) {
      bindStatusDrivenForm(form, '.vmg-feedback-submit', '.vmg-feedback-status');
    });
    document.querySelectorAll('[data-vmg-subscribe-form]').forEach(function (form) {
      bindStatusDrivenForm(form, '.vmg-footer-subscribe-button', '.vmg-footer-subscribe-status');
    });
    document.querySelectorAll('#contact-form .submit-btn').forEach(prepare);
  }

  window.VMGSubmitState = {
    prepare: prepare,
    set: set,
    idleAfter: idleAfter
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once: true });
  else scan();

  if (window.MutationObserver) {
    var pageObserver = new MutationObserver(scan);
    pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

(function () {
  'use strict';

  function initTabs() {
    var tablists = document.querySelectorAll('[role="tablist"]');
    tablists.forEach(function (tablist) {
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;

      function activate(tab, moveFocus) {
        tabs.forEach(function (item) {
          var selected = item === tab;
          var panel = document.getElementById(item.getAttribute('aria-controls'));
          item.setAttribute('aria-selected', selected ? 'true' : 'false');
          item.tabIndex = selected ? 0 : -1;
          if (panel) {
            panel.hidden = !selected;
            panel.classList.toggle('active', selected);
          }
        });
        if (moveFocus) tab.focus();
      }

      tabs.forEach(function (tab, index) {
        tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
        tab.addEventListener('click', function () { activate(tab, false); });
        tab.addEventListener('keydown', function (event) {
          var nextIndex = null;
          if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = tabs.length - 1;
          if (nextIndex !== null) {
            event.preventDefault();
            activate(tabs[nextIndex], true);
          }
        });
      });
    });
  }

  function initReveals(reducedMotion) {
    var reveals = document.querySelectorAll('.res-reveal');
    if (!reveals.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (element) { element.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (element) { observer.observe(element); });
  }

  function initTradeDocket() {
    var docket = document.querySelector('[data-trade-docket]');
    if (!docket) return;
    var status = docket.querySelector('[data-docket-status]');
    docket.setAttribute('data-stage', 'complete');
    if (status) status.textContent = 'Trade Docket Ready';
  }

  function initFaq() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.faq-trigger'));
    if (!triggers.length) return;

    function setOpen(trigger, open) {
      var item = trigger.closest('.faq-item');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (item) item.classList.toggle('is-open', open);
    }

    triggers.forEach(function (trigger) {
      setOpen(trigger, trigger.getAttribute('aria-expanded') === 'true');
      trigger.addEventListener('click', function () {
        var willOpen = trigger.getAttribute('aria-expanded') !== 'true';
        triggers.forEach(function (other) { setOpen(other, false); });
        if (willOpen) setOpen(trigger, true);
      });
      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          trigger.click();
        }
      });
    });
  }

  function init() {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initTabs();
    initReveals(reducedMotion);
    initTradeDocket();
    initFaq();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

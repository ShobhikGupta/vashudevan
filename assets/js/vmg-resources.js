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

  function initTradeDocket(reducedMotion) {
    var docket = document.querySelector('[data-trade-docket]');
    if (!docket) return;
    var status = docket.querySelector('[data-docket-status]');
    var printButton = docket.querySelector('[data-docket-print]');
    var printLabel = docket.querySelector('[data-docket-print-label]');
    var timers = [];
    var labels = {
      idle: 'Ready To Print',
      processing: 'Preparing Trade Docket',
      printing: 'Generating Supply-Chain Process',
      complete: 'Trade Docket Ready'
    };
    var buttonLabels = {
      idle: 'Print Trade Docket',
      processing: 'Processing…',
      printing: 'Printing…',
      complete: 'Print Again'
    };

    function clearTimers() {
      timers.forEach(function (timer) { window.clearTimeout(timer); });
      timers = [];
    }

    function setStage(stage) {
      docket.setAttribute('data-stage', stage);
      if (status) status.textContent = labels[stage];
      if (printLabel) printLabel.textContent = buttonLabels[stage];
    }

    function run() {
      clearTimers();
      if (reducedMotion) {
        setStage('complete');
        return;
      }
      setStage('processing');
      timers.push(window.setTimeout(function () {
        setStage('printing');
        timers.push(window.setTimeout(function () { setStage('complete'); }, 2050));
      }, 520));
    }

    if (printButton) printButton.addEventListener('click', run);
    setStage('idle');
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
    initTradeDocket(reducedMotion);
    initFaq();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

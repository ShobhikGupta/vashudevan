(function () {
  'use strict';

  var DRAWER_ID = 'vmg-feedback-drawer';
  var lastFocused = null;
  var observer = null;
  var busy = false;

  var feedbackIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4v-14Z"/><path d="M8 9h8M8 12h5"/></svg>';
  var closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  var goodIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M8.5 14.2c1.7 2.2 5.3 2.2 7 0"/></svg>';
  var improveIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M8.5 16c1.7-2.2 5.3-2.2 7 0"/></svg>';

  function createTrigger(extraClass) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'vmg-feedback-trigger' + (extraClass ? ' ' + extraClass : '');
    button.setAttribute('aria-controls', DRAWER_ID);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = feedbackIcon + '<span>Give Feedback</span>';
    button.addEventListener('click', function () {
      if (window.innerWidth <= 991) {
        var nav = document.getElementById('site-nav');
        var toggle = document.querySelector('.nav-toggle');
        if (nav && nav.classList.contains('open') && toggle) {
          toggle.click();
          window.setTimeout(function () { openDrawer(button); }, 170);
          return;
        }
      }
      openDrawer(button);
    });
    return button;
  }

  function createDrawer() {
    if (document.getElementById(DRAWER_ID)) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'vmg-feedback-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.addEventListener('click', closeDrawer);

    var drawer = document.createElement('aside');
    drawer.id = DRAWER_ID;
    drawer.className = 'vmg-feedback-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'vmg-feedback-title');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = [
      '<div class="vmg-feedback-drawer-header">',
        '<div>',
          '<p class="vmg-feedback-eyebrow">VMG Feedback</p>',
          '<h2 class="vmg-feedback-title" id="vmg-feedback-title">Give Feedback</h2>',
          '<p class="vmg-feedback-intro">Help us improve your experience with Vashudevan MetGlobal LLP.</p>',
        '</div>',
        '<button class="vmg-feedback-close" type="button" aria-label="Close feedback panel">' + closeIcon + '</button>',
      '</div>',
      '<form class="vmg-feedback-form" id="vmg-feedback-form" novalidate>',
        '<div class="vmg-feedback-group">',
          '<span class="vmg-feedback-rating-label">How was your experience? <span class="vmg-feedback-required">*</span></span>',
          '<div class="vmg-feedback-rating-options" role="group" aria-label="Feedback rating">',
            '<button type="button" class="vmg-feedback-rating" data-rating="Good" aria-pressed="false">' + goodIcon + '<span>Good</span></button>',
            '<button type="button" class="vmg-feedback-rating" data-rating="Needs improvement" aria-pressed="false">' + improveIcon + '<span>Needs improvement</span></button>',
          '</div>',
        '</div>',
        '<div class="vmg-feedback-group">',
          '<label class="vmg-feedback-label" for="vmg-feedback-email">Email address <span style="font-weight:500;color:rgba(255,255,255,.46)">(optional)</span></label>',
          '<input class="vmg-feedback-input" id="vmg-feedback-email" name="email" type="email" autocomplete="email" placeholder="name@company.com">',
        '</div>',
        '<div class="vmg-feedback-group">',
          '<label class="vmg-feedback-label" for="vmg-feedback-comments">Comments <span class="vmg-feedback-required">*</span></label>',
          '<textarea class="vmg-feedback-textarea" id="vmg-feedback-comments" name="comments" required maxlength="1500" placeholder="Tell us what worked well or what we can improve."></textarea>',
        '</div>',
        '<div class="vmg-feedback-submit-row">',
          '<button class="vmg-feedback-submit" type="submit">Submit Feedback</button>',
          '<p class="vmg-feedback-status" role="status" aria-live="polite"></p>',
        '</div>',
      '</form>'
    ].join('');

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    drawer.querySelector('.vmg-feedback-close').addEventListener('click', closeDrawer);

    drawer.querySelectorAll('.vmg-feedback-rating').forEach(function (button) {
      button.addEventListener('click', function () {
        drawer.querySelectorAll('.vmg-feedback-rating').forEach(function (item) {
          item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
        });
        setStatus('', '');
      });
    });

    drawer.querySelector('#vmg-feedback-form').addEventListener('submit', submitFeedback);
  }

  function addTriggers() {
    var socials = document.querySelector('.vmg-nav-socials');
    if (socials && !socials.querySelector('.vmg-feedback-trigger')) {
      socials.insertBefore(createTrigger('vmg-feedback-trigger-desktop'), socials.firstChild);
    }

    var navList = document.querySelector('#site-nav > ul');
    if (navList && !navList.querySelector('.vmg-mobile-feedback-item')) {
      var li = document.createElement('li');
      li.className = 'vmg-mobile-feedback-item';
      li.appendChild(createTrigger('vmg-feedback-trigger-mobile'));
      var socialsItem = navList.querySelector('.vmg-mobile-socials-item');
      navList.insertBefore(li, socialsItem || null);
    }

    if (socials && navList && observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function openDrawer(trigger) {
    var drawer = document.getElementById(DRAWER_ID);
    if (!drawer) return;

    lastFocused = trigger || document.activeElement;
    document.body.classList.add('vmg-feedback-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('.vmg-feedback-trigger').forEach(function (item) {
      item.setAttribute('aria-expanded', 'true');
    });

    window.setTimeout(function () {
      var focusTarget = drawer.querySelector('.vmg-feedback-rating');
      if (focusTarget) focusTarget.focus();
    }, 20);
  }

  function closeDrawer() {
    var drawer = document.getElementById(DRAWER_ID);
    if (!drawer || !document.body.classList.contains('vmg-feedback-open')) return;

    document.body.classList.remove('vmg-feedback-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.vmg-feedback-trigger').forEach(function (item) {
      item.setAttribute('aria-expanded', 'false');
    });

    if (lastFocused && typeof lastFocused.focus === 'function') {
      window.setTimeout(function () { lastFocused.focus(); }, 20);
    }
  }

  function getSelectedRating() {
    var selected = document.querySelector('#' + DRAWER_ID + ' .vmg-feedback-rating[aria-pressed="true"]');
    return selected ? selected.getAttribute('data-rating') : '';
  }

  function setStatus(message, kind) {
    var status = document.querySelector('#' + DRAWER_ID + ' .vmg-feedback-status');
    if (!status) return;
    status.textContent = message || '';
    status.classList.remove('is-success', 'is-error');
    if (kind) status.classList.add(kind);
  }

  function resetForm() {
    var form = document.getElementById('vmg-feedback-form');
    if (form) form.reset();
    document.querySelectorAll('#' + DRAWER_ID + ' .vmg-feedback-rating').forEach(function (item) {
      item.setAttribute('aria-pressed', 'false');
    });
  }

  function submitFeedback(event) {
    event.preventDefault();
    if (busy) return;

    var form = event.currentTarget;
    var email = form.querySelector('#vmg-feedback-email').value.trim();
    var comments = form.querySelector('#vmg-feedback-comments').value.trim();
    var rating = getSelectedRating();
    var submitButton = form.querySelector('.vmg-feedback-submit');

    if (!rating) {
      setStatus('Please choose an experience rating.', 'is-error');
      var firstRating = form.querySelector('.vmg-feedback-rating');
      if (firstRating) firstRating.focus();
      return;
    }

    if (!comments) {
      setStatus('Please add a short comment.', 'is-error');
      form.querySelector('#vmg-feedback-comments').focus();
      return;
    }

    if (email && !form.querySelector('#vmg-feedback-email').checkValidity()) {
      setStatus('Please enter a valid email address.', 'is-error');
      form.querySelector('#vmg-feedback-email').focus();
      return;
    }

    var endpoint = window.AppConfig && window.AppConfig.googleScriptUrl;
    if (!endpoint) {
      setStatus('Feedback submission is temporarily unavailable.', 'is-error');
      return;
    }

    var payload = {
      source: 'website-feedback',
      type: 'Website Feedback',
      rating: rating,
      email: email,
      message: comments,
      page: window.location.href,
      submittedAt: new Date().toISOString(),
      'MAIL ID': email,
      'MESSAGE': comments,
      'FEEDBACK RATING': rating
    };

    busy = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    setStatus('Sending feedback…', '');

    fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () {
      setStatus('Thank you. Your feedback has been sent.', 'is-success');
      resetForm();
      window.setTimeout(closeDrawer, 1300);
    }).catch(function () {
      setStatus('Could not send feedback. Please try again.', 'is-error');
    }).finally(function () {
      busy = false;
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Feedback';
    });
  }

  function handleKeydown(event) {
    if (!document.body.classList.contains('vmg-feedback-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer();
      return;
    }

    if (event.key !== 'Tab') return;

    var drawer = document.getElementById(DRAWER_ID);
    var focusables = Array.prototype.slice.call(drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function init() {
    createDrawer();
    addTriggers();
    document.addEventListener('keydown', handleKeydown);

    if (!document.querySelector('.vmg-nav-socials') || !document.querySelector('#site-nav > ul')) {
      observer = new MutationObserver(addTriggers);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

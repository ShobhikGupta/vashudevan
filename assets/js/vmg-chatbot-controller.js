/* VMG Bot preview integration. All Strobi animation assets remain unmodified.
 * Requires the existing /assets/js/vmg-help.js menu and /assets/vendor/strobi/avatar.js.
 * No conversational AI, new data service, or form interception is introduced.
 */
(function () {
  'use strict';
  if (window.__vmgChatbotInit) return;
  window.__vmgChatbotInit = true;

  const ROOT_ID = 'vmg-help';
  const AVATAR_SRC = '/assets/vendor/strobi/avatar.js';
  const DESKTOP = window.matchMedia('(hover: hover) and (pointer: fine)');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SLEEP_AFTER_MS = 120000;
  const DROWSY_AFTER_MS = 60000;
  const GAZE_RETURN_MS = 1200;
  // Gentle, proportional eye movement at a 48px launcher size.
  // The original avatar renderer continues to own every facial path.
  const GAZE_MAX_X = 28;
  const GAZE_MAX_Y = 17;
  const GAZE_EASE = 0.14;
  const BLINK_DURATION_MS = 240;
  const BLINK_MIN_INTERVAL_MS = 3200;
  const BLINK_INTERVAL_VARIATION_MS = 2600;
  const REACTION_COOLDOWN_MS = 3000;
  const REACTION_HOVER_COOLDOWN_MS = 1600;
  const SPAM_WINDOW_MS = 2000;
  const SPAM_CLICK_COUNT = 4;
  const MOODS = ['sleeping', 'waking', 'idle', 'listening', 'thinking', 'searching', 'working',
    'excited', 'bored', 'suspicious', 'angry', 'drowsy', 'happy', 'curious', 'confused',
    'surprised', 'proud', 'shy', 'sad', 'laughing', 'scared', 'playful', 'celebrate'];

  const get = selector => document.querySelector(selector);
  const track = (event, extra = {}) => {
    if (typeof window.vmgTrackEvent === 'function') {
      window.vmgTrackEvent(event, Object.assign({section_name: 'VMG Bot'}, extra));
    }
  };
  const remember = (key, value) => { try { sessionStorage.setItem('vmg_chatbot_' + key, value); } catch (_) {} };
  const recall = key => { try { return sessionStorage.getItem('vmg_chatbot_' + key); } catch (_) { return null; } };

  function initialize(root, createAvatar, availableAnimations) {
    const trigger = root.querySelector('.vmg-help-trigger');
    const menu = root.querySelector('.vmg-help-menu');
    if (!trigger || !menu || !MOODS.every(name => availableAnimations.includes(name))) return;
    const originalMarkup = trigger.innerHTML;
    const originalMenu = menu.innerHTML;
    let avatar = null;
    let disposed = false;
    let pausedByVisibility = document.hidden;
    // Strobi's exported idle sequence starts with an upturned face. The
    // original listening sequence is a more suitable front-facing rest state.
    let activeAnimation = 'listening';
    let lastInteraction = performance.now();
    let lastPointerMove = 0;
    let lastGazeMove = 0;
    let gazeReturnTimer = 0;
    let hasPointerPosition = false;
    let gazeX = 0, gazeY = 0, targetX = 0, targetY = 0;
    let gazeFrame = 0;
    let glanceTimer = 0;
    let wakeTimer = 0;
    let blinkTimer = 0;
    let blinkFrame = 0;
    let blinkStartedAt = 0;
    let blinkPivotY = 0;
    let modalActive = false;
    let lastOpenState = root.classList.contains('is-open');
    let actionClosing = false;
    let reactionTimer = 0;
    let reactionUntil = 0;
    let reactionPriority = 0;
    let lastOrdinaryReaction = -Infinity;
    let lastHoverReaction = -Infinity;
    let lastSpamReaction = -Infinity;
    const recentClicks = new WeakMap();
    const watchedStatuses = new WeakSet();
    const cleanup = [];

    const listen = (target, event, fn, opts) => {
      target.addEventListener(event, fn, opts);
      cleanup.push(() => target.removeEventListener(event, fn, opts));
    };
    const wantsMotion = () => !REDUCED.matches && !pausedByVisibility;
    const isOpen = () => root.classList.contains('is-open');

    // Preserve the original Help menu links, destinations, and existing event listeners.
    const header = document.createElement('div');
    header.className = 'vmg-chatbot-header';
    header.innerHTML = '<strong id="vmg-chatbot-heading">VMG Bot</strong>' +
      '<button class="vmg-chatbot-close" type="button" aria-label="Close VMG Bot">×</button>';
    menu.insertBefore(header, menu.firstChild);
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-labelledby', 'vmg-chatbot-heading');
    menu.removeAttribute('aria-modal');
    menu.querySelectorAll('a[role="menuitem"]').forEach(a => a.removeAttribute('role'));

    const extra = document.createElement('div');
    extra.className = 'vmg-chatbot-extras';
    const location = window.location.pathname || '/';
    const shortcuts = [
      {href: '/products/', label: 'Explore Metal Products'},
      {href: '/resources/#recyclable-metal-guides', label: 'Knowledge Guides & Resources'},
      {href: '/market/', label: 'Market References'}
    ];
    const pagePreferred = location.startsWith('/resources/') ? 1 : location.startsWith('/market/') ? 2 : 0;
    const ordered = [shortcuts[pagePreferred], ...shortcuts.filter((_, n) => n !== pagePreferred)];
    const explore = document.createElement('details');
    explore.className = 'vmg-chatbot-explore';
    const summary = document.createElement('summary');
    summary.textContent = 'Explore VMG';
    explore.appendChild(summary);
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Explore VMG website');
    ordered.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      nav.appendChild(a);
      listen(a, 'click', () => track('vmg_chatbot_context_click', {destination: item.href}));
    });
    explore.appendChild(nav);

    extra.append(explore);
    menu.appendChild(extra);

    const avatarHost = document.createElement('span');
    avatarHost.className = 'vmg-chatbot-avatar';
    avatarHost.setAttribute('aria-hidden', 'true');
    trigger.insertBefore(avatarHost, trigger.firstChild);
    const triggerLabel = trigger.querySelector('span:not(.vmg-chatbot-avatar)');
    if (triggerLabel) triggerLabel.textContent = 'VMG Bot';
    trigger.setAttribute('aria-label', 'Open VMG Bot help options');

    const backdrop = document.createElement('div');
    backdrop.className = 'vmg-chatbot-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    try {
      avatar = createAvatar(avatarHost, {animation: 'listening', size: '100%', autoplay: false});
    } catch (err) {
      trigger.innerHTML = originalMarkup;
      menu.innerHTML = originalMenu;
      menu.setAttribute('role', 'menu');
      menu.removeAttribute('aria-labelledby');
      backdrop.remove();
      console.warn('[VMG Bot] Avatar mounting failed. Original Need Help retained.', err);
      return;
    }
    // Strobi's original listening sequence cycles among tilted expressions.
    // Running that loop while tracking gaze caused changing eye shapes, a
    // competing eye-leveling observer, and repeated blinks in different layers.
    // Hold the FIRST original listening expression for normal browsing.
    // Keep all exported animations untouched for reactions and sleep/wake.
    const clippedEyes = avatarHost.querySelector('g[clip-path]');
    const eyePaths = clippedEyes
      ? Array.from(clippedEyes.children).filter(node => node.localName === 'path') : [];
    const gazeSupported = eyePaths.length === 2;
    let gazeLayer = null;
    let uprightLayer = null;
    let blinkLayer = null;
    if (gazeSupported) {
      const svgNS = 'http://www.w3.org/2000/svg';
      gazeLayer = document.createElementNS(svgNS, 'g');
      uprightLayer = document.createElementNS(svgNS, 'g');
      blinkLayer = document.createElementNS(svgNS, 'g');
      gazeLayer.setAttribute('data-vmg-strobi-gaze', 'true');
      uprightLayer.setAttribute('data-vmg-strobi-upright', 'true');
      blinkLayer.setAttribute('data-vmg-strobi-blink', 'true');
      eyePaths.forEach(path => blinkLayer.appendChild(path));
      uprightLayer.appendChild(blinkLayer);
      gazeLayer.appendChild(uprightLayer);
      clippedEyes.appendChild(gazeLayer);
    } else {
      console.warn('[VMG Bot] Original eye paths unavailable: cursor gaze disabled.');
    }

    const resetBlink = () => {
      clearTimeout(blinkTimer);
      blinkTimer = 0;
      if (blinkFrame) cancelAnimationFrame(blinkFrame);
      blinkFrame = 0;
      if (blinkLayer) blinkLayer.removeAttribute('transform');
    };
    const refreshRestingFace = () => {
      if (!gazeSupported) return;
      uprightLayer.removeAttribute('transform');
      if (activeAnimation !== 'listening') return;
      try {
        const a = eyePaths[0].getBBox(), b = eyePaths[1].getBBox();
        if (a.width < 4 || b.width < 4 || a.height < 4 || b.height < 4) return;
        const x1 = a.x + a.width / 2, y1 = a.y + a.height / 2;
        const x2 = b.x + b.width / 2, y2 = b.y + b.height / 2;
        const dx = x2 - x1, dy = y2 - y1;
        if (dx < 12 || ![x1,y1,x2,y2].every(Number.isFinite)) return;
        const tilt = Math.max(-17, Math.min(17, Math.atan2(dy, dx) * 180 / Math.PI));
        const pivotX = (x1 + x2) / 2;
        blinkPivotY = (y1 + y2) / 2;
        // This transform is measured once from the preserved source pose.
        // No per-frame rotation or MutationObserver is used.
        uprightLayer.setAttribute('transform',
          `rotate(${(-tilt).toFixed(2)} ${pivotX.toFixed(2)} ${blinkPivotY.toFixed(2)})`);
      } catch (_) {
        uprightLayer.removeAttribute('transform');
      }
    };
    const animateBlink = time => {
      blinkFrame = 0;
      if (disposed || activeAnimation !== 'listening' || !wantsMotion() || !blinkLayer) {
        resetBlink();
        return;
      }
      const t = Math.min(1, (time - blinkStartedAt) / BLINK_DURATION_MS);
      // Collapse and reopen ORIGINAL eye paths around their common baseline.
      const closure = Math.sin(Math.PI * t);
      const scale = 1 - 0.91 * Math.max(0, closure);
      blinkLayer.setAttribute('transform',
        `translate(0 ${blinkPivotY.toFixed(2)}) scale(1 ${scale.toFixed(3)}) translate(0 ${(-blinkPivotY).toFixed(2)})`);
      if (t < 1) blinkFrame = requestAnimationFrame(animateBlink);
      else {
        blinkLayer.removeAttribute('transform');
        scheduleBlink();
      }
    };
    function scheduleBlink() {
      if (disposed || !gazeSupported || !wantsMotion() || activeAnimation !== 'listening'
          || blinkTimer || blinkFrame) return;
      blinkTimer = setTimeout(() => {
        blinkTimer = 0;
        blinkStartedAt = performance.now();
        blinkFrame = requestAnimationFrame(animateBlink);
      }, BLINK_MIN_INTERVAL_MS + Math.random() * BLINK_INTERVAL_VARIATION_MS);
    }
    const settleAtRest = () => {
      if (!avatar) return;
      resetBlink();
      // Use the exported engine's own stop() to reset the first real
      // listening expression. No new expression or SVG eye path is created.
      if (avatar.animation !== 'listening') avatar.play('listening');
      avatar.stop();
      refreshRestingFace();
      scheduleBlink();
    };
    function syncPlayback() {
      if (!avatar) return;
      if (activeAnimation === 'listening') {
        if (!wantsMotion()) resetBlink();
        else if (!blinkTimer && !blinkFrame) scheduleBlink();
        return; // Fixed original pose; never restart the looping sequence.
      }
      resetBlink();
      if (wantsMotion()) {
        if (!avatar.playing) avatar.play(activeAnimation);
      } else if (avatar.playing) avatar.pause();
    }
    function play(name) {
      if (!avatar || !availableAnimations.includes(name)) return;
      if (name === 'listening') {
        const changed = activeAnimation !== name || avatar.playing;
        activeAnimation = name;
        if (changed) settleAtRest();
        else if (wantsMotion()) scheduleBlink();
        return;
      }
      resetBlink();
      if (activeAnimation !== name) {
        activeAnimation = name;
        uprightLayer?.removeAttribute('transform');
        if (wantsMotion()) avatar.play(name);
        else { avatar.play(name); avatar.pause(); }
      } else if (!wantsMotion()) avatar.pause();
      if (name === 'sleeping' || name === 'drowsy') resetGaze();
    }
    // One arbiter handles site-wide interactions. Low-priority clicks and hover
    // never interrupt confirmed outcomes or continually restart animations.
    function react(mood, {priority = 1, duration = 1500, source = 'interaction'} = {}) {
      if (disposed || !wantsMotion() || !availableAnimations.includes(mood)) return false;
      const now = performance.now();
      if (now < reactionUntil && priority < reactionPriority) return false;
      if (priority === 1) {
        const hover = source === 'help_hover' || source === 'bot_hover';
        if (hover && now - lastHoverReaction < REACTION_HOVER_COOLDOWN_MS) return false;
        if (!hover && now - lastOrdinaryReaction < REACTION_COOLDOWN_MS) return false;
        if (hover) lastHoverReaction = now;
        else lastOrdinaryReaction = now;
      }
      if ((activeAnimation === 'sleeping' || activeAnimation === 'drowsy') && priority <= 2) {
        noteInteraction(); // Wake naturally before reacting to low-priority clicks.
        return false;
      }
      lastInteraction = now;
      clearTimeout(reactionTimer);
      reactionUntil = now + duration;
      reactionPriority = priority;
      play(mood);
      track('vmg_bot_reaction', {reaction: mood, interaction_type: source});
      reactionTimer = setTimeout(() => {
        reactionTimer = 0;
        reactionUntil = 0;
        reactionPriority = 0;
        if (!disposed) play('listening');
      }, duration);
      return true;
    }

    function watchStatus(status) {
      if (!status || watchedStatuses.has(status) || typeof MutationObserver === 'undefined') return;
      watchedStatuses.add(status);
      let previousState = '';
      const unverified = Boolean(status.closest('#vmg-feedback-drawer, [data-vmg-subscribe-form]'));
      const observer = new MutationObserver(() => {
        const className = ' ' + (status.className || '') + ' ';
        const state = /\\bis-success\\b|\\bsuccess\\b/.test(className) ? 'success'
          : /\\bis-error\\b|\\berror\\b/.test(className) ? 'error' : '';
        if (state === previousState) return;
        previousState = state;
        if (!state || !(status.textContent || '').trim()) return;
        if (state === 'success') {
          if (unverified) {
            // no-cors submission cannot verify delivery; never celebrate it.
            react('listening', {priority: 3, duration: 800, source: 'request_acknowledged'});
          } else {
            react('celebrate', {priority: 4, duration: 2300, source: 'confirmed_form_success'});
          }
        } else {
          const message = (status.textContent || '').trim();
          const validation = /^(please|select|enter|choose|check|complete|correct|accept)\\b/i.test(message);
          react(validation ? 'confused' : 'sad', {
            priority: 3, duration: 1800, source: validation ? 'form_validation_error' : 'form_failure'
          });
        }
      });
      observer.observe(status, {attributes: true, attributeFilter: ['class'], childList: true, characterData: true, subtree: true});
      cleanup.push(() => observer.disconnect());
    }
    function scanStatuses() {
      document.querySelectorAll('#form-result, #vmg-feedback-drawer .vmg-feedback-status, [data-vmg-subscribe-form] .vmg-footer-subscribe-status')
        .forEach(watchStatus);
    }

    function drawGaze() {
      gazeFrame = 0;
      if (disposed || !gazeSupported) return;
      if (!wantsMotion() || ['sleeping', 'drowsy'].includes(activeAnimation)) {
        targetX = 0; targetY = 0;
      }
      gazeX += (targetX - gazeX) * GAZE_EASE;
      gazeY += (targetY - gazeY) * GAZE_EASE;
      gazeLayer.setAttribute('transform', `translate(${gazeX.toFixed(2)} ${gazeY.toFixed(2)})`);
      if (Math.abs(targetX - gazeX) + Math.abs(targetY - gazeY) > 0.06) gazeFrame = requestAnimationFrame(drawGaze);
    }
    const updateGaze = (x, y) => {
      targetX = x; targetY = y;
      if (!gazeFrame && gazeSupported) gazeFrame = requestAnimationFrame(drawGaze);
    };
    const resetGaze = () => updateGaze(0, 0);
    const clearGazeReturn = () => {
      clearTimeout(gazeReturnTimer);
      gazeReturnTimer = 0;
    };
    const scheduleGazeReturn = () => {
      clearGazeReturn();
      gazeReturnTimer = setTimeout(() => {
        gazeReturnTimer = 0;
        if (!disposed) resetGaze();
      }, GAZE_RETURN_MS);
    };

    function noteInteraction() {
      lastInteraction = performance.now();
      if (activeAnimation === 'sleeping' || activeAnimation === 'drowsy') {
        play('waking');
        clearTimeout(wakeTimer);
        wakeTimer = setTimeout(() => {
          if (!disposed) play('listening');
        }, 1600);
      }
    }
    function syncModal() {
      const opened = isOpen();
      const mobile = window.matchMedia('(max-width: 900px)').matches;
      root.classList.toggle('vmg-chatbot-sheet', mobile);
      modalActive = opened && mobile;
      if (modalActive) menu.setAttribute('aria-modal', 'true');
      else menu.removeAttribute('aria-modal');
      document.body.classList.toggle('vmg-chatbot-sheet-open', modalActive);
      backdrop.classList.toggle('is-visible', modalActive);
    }
    function onMenuState() {
      if (disposed) return;
      const opened = isOpen();
      if (opened === lastOpenState) return;
      lastOpenState = opened;
      syncModal();
      if (opened) {
        actionClosing = false;
        noteInteraction();
        react('curious', {priority: 1, duration: 1150, source: 'help_open'});
        trigger.setAttribute('aria-label', 'Close VMG Bot help options');
      } else {
        if (!actionClosing) {
          remember('dismissed', 'true');
          track('vmg_chatbot_dismiss');
        }
        actionClosing = false;
        explore.open = false;
        noteInteraction();
        play('listening');
        trigger.setAttribute('aria-label', 'Open VMG Bot help options');
        resetGaze();
      }
    }
    const classObserver = new MutationObserver(records => {
      if (records.some(record => record.attributeName === 'class')) onMenuState();
    });
    classObserver.observe(root, {attributes:true,attributeFilter:['class']});

    const closeButton = header.querySelector('button');
    const closeHelp = restore => {
      if (!isOpen()) return;
      // Mirror the existing closeMenu state without removing its event listeners.
      root.classList.remove('is-open');
      document.body.classList.remove('vmg-help-open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      if (restore) trigger.focus();
    };
    listen(closeButton, 'click', () => closeHelp(true));
    listen(backdrop, 'pointerdown', () => closeHelp(true));
    listen(document, 'keydown', event => {
      if (!modalActive || !isOpen() || event.key !== 'Tab') return;
      const focusable = Array.from(menu.querySelectorAll('a[href], button:not([disabled]), summary'))
        .filter(el => el.getClientRects().length && (el.matches('summary') || el.closest('details:not([open])') === null));
      if (!focusable.length) { event.preventDefault(); menu.focus(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !menu.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !menu.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    });
    listen(window, 'resize', syncModal, {passive:true});
    listen(document, 'visibilitychange', () => {
      pausedByVisibility = document.hidden;
      if (pausedByVisibility) {
        clearGazeReturn();
        clearTimeout(reactionTimer);
        reactionTimer = 0;
        reactionUntil = 0;
        reactionPriority = 0;
      } else if (activeAnimation !== 'listening') {
        play('listening');
      }
      syncPlayback();
      resetGaze();
    });
    const motionChanged = () => { syncPlayback(); resetGaze(); };
    if (REDUCED.addEventListener) REDUCED.addEventListener('change', motionChanged);
    else REDUCED.addListener(motionChanged);
    cleanup.push(() => REDUCED.removeEventListener ? REDUCED.removeEventListener('change', motionChanged) : REDUCED.removeListener(motionChanged));

    listen(trigger, 'pointerenter', () => {
      if (DESKTOP.matches && !isOpen()) react('curious', {duration: 1250, source: 'bot_hover'});
    });
    // Hovering or keyboard-focusing a Help option triggers Curious once,
    // not on every mouse movement across its children.
    listen(menu, 'pointerover', event => {
      if (!DESKTOP.matches) return;
      const option = event.target.closest('a[href]');
      if (!option || !menu.contains(option) || (event.relatedTarget && option.contains(event.relatedTarget))) return;
      react('curious', {duration: 1250, source: 'help_hover'});
    });
    listen(menu, 'focusin', event => {
      if (event.target.closest('a[href]')) react('curious', {duration: 1250, source: 'help_hover'});
    });
    listen(document, 'pointermove', event => {
      if (!DESKTOP.matches || event.pointerType === 'touch' || !gazeSupported || !wantsMotion()) return;
      const now = performance.now();
      if (now - lastPointerMove < 16) return;
      lastPointerMove = now;
      lastGazeMove = now;
      hasPointerPosition = true;
      noteInteraction();
      if (!isOpen() && activeAnimation === 'idle') play('listening');
      const rect = avatarHost.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Smoothly scale in screen pixels, not by remaining viewport edges.
      // The previous normalization could snap from neutral to full gaze
      // within a few pixels on the right or bottom of the launcher.
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const normalizedX = Math.tanh(dx / Math.max(220, window.innerWidth * 0.32));
      const normalizedY = Math.tanh(dy / Math.max(180, window.innerHeight * 0.34));
      if (!['sleeping', 'drowsy'].includes(activeAnimation)) {
        updateGaze(normalizedX * GAZE_MAX_X, normalizedY * GAZE_MAX_Y);
        scheduleGazeReturn();
      }
    }, {passive:true});
    listen(document, 'pointerdown', event => {
      noteInteraction();
      if (DESKTOP.matches || !wantsMotion() || !root.contains(event.target)) return;
      if (!['sleeping', 'drowsy'].includes(activeAnimation)) {
        updateGaze(2, -1.5);
        scheduleGazeReturn();
      }
    }, {passive:true});
    listen(document, 'keydown', noteInteraction);
    listen(document, 'scroll', noteInteraction, {passive:true});
    // When the pointer leaves the page, stop treating its last position as
    // an active gaze target. The original idle animation remains available.
    listen(document, 'mouseout', event => {
      if (event.relatedTarget || event.toElement || !hasPointerPosition || !DESKTOP.matches) return;
      hasPointerPosition = false;
      clearGazeReturn();
      resetGaze();
    });
    listen(menu, 'pointerdown', event => {
      if (event.target.closest('a[href]')) {
        react('searching', {priority: 2, duration: 1400, source: 'help_action'});
      }
    });
    // Existing link handlers close the menu; such navigation is not a Help dismissal.
    listen(menu, 'click', event => {
      if (event.target.closest('a[href]')) actionClosing = true;
    }, true);

    // One delegated handler covers buttons, links, forms, carousels and
    // navigation throughout the site, including controls added later.
    // Never prevent default, change a form, or delay navigation.
    listen(document, 'click', event => {
      const node = event.target instanceof Element ? event.target : event.target?.parentElement;
      const control = node?.closest('button, a[href], input[type="button"], input[type="submit"], [role="button"], summary');
      if (!control || !document.contains(control) || control.disabled || control.getAttribute('aria-disabled') === 'true') return;
      if (root.contains(control)) return; // Help options are handled above.
      const now = performance.now();
      const times = (recentClicks.get(control) || []).filter(t => now - t <= SPAM_WINDOW_MS);
      times.push(now);
      recentClicks.set(control, times);
      if (times.length >= SPAM_CLICK_COUNT) {
        recentClicks.set(control, []);
        if (now - lastSpamReaction > 5000) {
          if (react('playful', {priority: 2, duration: 1800, source: 'repeated_clicks'})) lastSpamReaction = now;
        }
        return;
      }
      if (control.closest('[data-vmg-track-form]') || control.matches('.vmg-track-button')) {
        react('thinking', {priority: 2, duration: 1400, source: 'tracking_information'});
      } else if (control.closest('form') && (control.matches('[type="submit"]') || control.type === 'submit')) {
        // The submit event and actual form status determine the final reaction.
      } else if (control.closest('.vmg-feedback-trigger')) {
        react('curious', {duration: 1400, source: 'feedback_open'});
      } else {
        react('curious', {duration: 1150, source: 'site_button'});
      }
    }, true);
    listen(document, 'submit', event => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      scanStatuses(); // Attach before synchronous validation modifies status.
      if (form.matches('[data-vmg-track-form]')) {
        react('thinking', {priority: 2, duration: 1400, source: 'tracking_information'});
      } else {
        react('working', {priority: 2, duration: 1800, source: 'form_submit_attempt'});
      }
    }, true);
    // Feedback and footer elements may be inserted after the bot initializes.
    scanStatuses();

    // Gesture: swipe down on the mobile header to dismiss (not on the scrollable action list).
    let swipeY = null;
    listen(header, 'touchstart', event => { swipeY = event.touches.length === 1 ? event.touches[0].clientY : null; }, {passive:true});
    listen(header, 'touchend', event => {
      if (swipeY !== null && event.changedTouches[0].clientY - swipeY > 65 && modalActive) closeHelp(true);
      swipeY = null;
    }, {passive:true});

    // A single lightweight timer controls inactivity; optional glances use existing eye paths.
    const lifeTimer = setInterval(() => {
      if (disposed || !wantsMotion() || isOpen() || performance.now() < reactionUntil) return;
      const inactive = performance.now() - lastInteraction;
      if (inactive >= SLEEP_AFTER_MS) { if (activeAnimation !== 'sleeping') play('sleeping'); }
      else if (inactive >= DROWSY_AFTER_MS) { if (activeAnimation !== 'drowsy') play('drowsy'); }
      else if (!['listening', 'curious', 'waking'].includes(activeAnimation)) play('listening');
    }, 950);
    function glance() {
      if (disposed) return;
      if (wantsMotion() && DESKTOP.matches && !hasPointerPosition && !isOpen() && activeAnimation === 'listening' && performance.now() - lastGazeMove > 12000) {
        updateGaze(Math.random() > 0.5 ? 7 : -7, -2);
        setTimeout(() => { if (!disposed && performance.now() - lastGazeMove > 6000) resetGaze(); }, 500);
      }
      glanceTimer = setTimeout(glance, 9000 + Math.random() * 7000);
    }
    glance();
    cleanup.push(() => {
      clearInterval(lifeTimer); clearGazeReturn(); clearTimeout(glanceTimer); clearTimeout(wakeTimer); clearTimeout(reactionTimer);
      resetBlink();
      if (gazeFrame) cancelAnimationFrame(gazeFrame);
      classObserver.disconnect();
    });

    root.dataset.vmgChatbotDismissed = String(recall('dismissed') === 'true');
    root.classList.add('vmg-chatbot-ready');
    document.body.classList.add('vmg-chatbot-enabled');
    syncModal();
    settleAtRest();
    syncPlayback();
    window.__vmgChatbot = {
      destroy() {
        disposed = true;
        cleanup.forEach(fn => fn());
        avatar.destroy();
        backdrop.remove();
        trigger.innerHTML = originalMarkup;
        menu.innerHTML = originalMenu;
        root.classList.remove('vmg-chatbot-ready','vmg-chatbot-sheet');
        document.body.classList.remove('vmg-chatbot-enabled', 'vmg-chatbot-sheet-open');
        delete window.__vmgChatbot;
      },
      availableAnimations: [...availableAnimations]
    };
  }

  async function boot() {
    let createAvatar, availableAnimations;
    try {
      ({createAvatar, availableAnimations} = await import(AVATAR_SRC));
    } catch (err) {
      console.warn('[VMG Bot] Original avatar module not available; existing Help remains active.', err);
      return;
    }
    const attempt = () => {
      const root = document.getElementById(ROOT_ID);
      if (!root || !root.querySelector('.vmg-help-trigger')) return false;
      initialize(root, createAvatar, availableAnimations);
      return true;
    };
    if (attempt()) return;
    const observer = new MutationObserver(() => { if (attempt()) observer.disconnect(); });
    observer.observe(document.documentElement, {childList:true,subtree:true});
    setTimeout(() => observer.disconnect(), 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();

/* VMG Chatbot preview integration. All Strobi animation assets remain unmodified.
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
  // Match the previewed demo's eye-tracking range and easing at launcher size.
  // All geometry still comes from the original exported Strobi engine.
  const GAZE_MAX_X = 36;
  const GAZE_MAX_Y = 23;
  const GAZE_EASE = 0.12;
  const MOODS = ['sleeping', 'waking', 'idle', 'listening', 'thinking', 'searching', 'working',
    'excited', 'bored', 'suspicious', 'angry', 'drowsy', 'happy', 'curious', 'confused',
    'surprised', 'proud', 'shy', 'sad', 'laughing', 'scared', 'playful', 'celebrate'];

  const get = selector => document.querySelector(selector);
  const track = (event, extra = {}) => {
    if (typeof window.vmgTrackEvent === 'function') {
      window.vmgTrackEvent(event, Object.assign({section_name: 'VMG Chatbot'}, extra));
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
    let modalActive = false;
    let lastOpenState = root.classList.contains('is-open');
    let actionClosing = false;
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
    header.innerHTML = '<strong id="vmg-chatbot-heading">VMG Chatbot</strong>' +
      '<button class="vmg-chatbot-close" type="button" aria-label="Close VMG Chatbot">×</button>';
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
    if (triggerLabel) triggerLabel.textContent = 'VMG Chatbot';
    trigger.setAttribute('aria-label', 'Open VMG Chatbot help options');

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
      console.warn('[VMG Chatbot] Avatar mounting failed. Original Need Help retained.', err);
      return;
    }
    // Keep the original eye paths and their engine-driven d attributes intact.
    // Wrap only the eyes, inside the original head clipping group, so Strobi's
    // renderer and our gaze transform never write to the same attribute.
    const clippedEyes = avatarHost.querySelector('g[clip-path]');
    const eyePaths = clippedEyes ? Array.from(clippedEyes.children).filter(node => node.localName === 'path') : [];
    const gazeSupported = eyePaths.length === 2;
    let gazeLayer = null;
    if (gazeSupported) {
      gazeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gazeLayer.setAttribute('data-vmg-strobi-gaze', 'true');
      eyePaths.forEach(path => gazeLayer.appendChild(path));
      clippedEyes.appendChild(gazeLayer);
    } else {
      console.warn('[VMG Chatbot] Original eye paths unavailable: cursor gaze disabled.');
    }

    function syncPlayback() {
      if (!avatar) return;
      if (wantsMotion()) {
        if (!avatar.playing) avatar.play(activeAnimation);
      } else if (avatar.playing) avatar.pause();
    }
    function play(name) {
      if (!avatar || !availableAnimations.includes(name)) return;
      if (activeAnimation !== name) {
        activeAnimation = name;
        if (wantsMotion()) avatar.play(name);
        else { avatar.play(name); avatar.pause(); }
      } else if (!wantsMotion()) avatar.pause();
      if (name === 'sleeping' || name === 'drowsy') resetGaze();
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
        play('listening');
        trigger.setAttribute('aria-label', 'Close VMG Chatbot help options');
      } else {
        if (!actionClosing) {
          remember('dismissed', 'true');
          track('vmg_chatbot_dismiss');
        }
        actionClosing = false;
        explore.open = false;
        noteInteraction();
        play('listening');
        trigger.setAttribute('aria-label', 'Open VMG Chatbot help options');
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
      if (pausedByVisibility) clearGazeReturn();
      syncPlayback();
      resetGaze();
    });
    const motionChanged = () => { syncPlayback(); resetGaze(); };
    if (REDUCED.addEventListener) REDUCED.addEventListener('change', motionChanged);
    else REDUCED.addListener(motionChanged);
    cleanup.push(() => REDUCED.removeEventListener ? REDUCED.removeEventListener('change', motionChanged) : REDUCED.removeListener(motionChanged));

    listen(trigger, 'pointerenter', () => {
      if (DESKTOP.matches && !isOpen() && wantsMotion() && activeAnimation === 'listening') play('curious');
    });
    listen(trigger, 'pointerleave', () => {
      if (!isOpen() && activeAnimation === 'curious') play('listening');
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
      // Normalize X and Y separately using distances from Strobi to
      // each viewport edge. Top-left now means both up AND left, rather
      // than saturating to a mostly horizontal vector after only 85px.
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const horizontalReach = dx < 0 ? Math.max(1, centerX) : Math.max(1, window.innerWidth - centerX);
      const verticalReach = dy < 0 ? Math.max(1, centerY) : Math.max(1, window.innerHeight - centerY);
      const normalizedX = Math.max(-1, Math.min(1, dx / horizontalReach));
      const normalizedY = Math.max(-1, Math.min(1, dy / verticalReach));
      if (!['sleeping', 'drowsy'].includes(activeAnimation)) {
        updateGaze(normalizedX * GAZE_MAX_X, normalizedY * GAZE_MAX_Y);
        scheduleGazeReturn();
      }
    }, {passive:true});
    listen(document, 'pointerdown', event => {
      noteInteraction();
      if (DESKTOP.matches || !wantsMotion() || !root.contains(event.target)) return;
      if (!['sleeping', 'drowsy'].includes(activeAnimation)) updateGaze(2, -1.5);
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
      if (event.target.closest('a[href]')) play('searching');
    });
    // Existing link handlers close the menu; such navigation is not a Help dismissal.
    listen(menu, 'click', event => {
      if (event.target.closest('a[href]')) actionClosing = true;
    }, true);

    // Do not fire a success reaction on click/attempt; only when the contact form reports success.
    const result = get('#form-result');
    if (result) {
      let successSeen = false;
      const resultObserver = new MutationObserver(() => {
        const success = result.classList.contains('is-success') || result.classList.contains('success');
        if (success && !successSeen) play('celebrate');
        successSeen = success;
      });
      resultObserver.observe(result, {attributes:true,attributeFilter:['class']});
      cleanup.push(() => resultObserver.disconnect());
    }

    // Gesture: swipe down on the mobile header to dismiss (not on the scrollable action list).
    let swipeY = null;
    listen(header, 'touchstart', event => { swipeY = event.touches.length === 1 ? event.touches[0].clientY : null; }, {passive:true});
    listen(header, 'touchend', event => {
      if (swipeY !== null && event.changedTouches[0].clientY - swipeY > 65 && modalActive) closeHelp(true);
      swipeY = null;
    }, {passive:true});

    // A single lightweight timer controls inactivity; optional glances use existing eye paths.
    const lifeTimer = setInterval(() => {
      if (disposed || !wantsMotion() || isOpen()) return;
      const inactive = performance.now() - lastInteraction;
      if (inactive >= SLEEP_AFTER_MS) { if (activeAnimation !== 'sleeping') play('sleeping'); }
      else if (inactive >= DROWSY_AFTER_MS) { if (activeAnimation !== 'drowsy') play('drowsy'); }
      else if (!['listening', 'curious', 'waking'].includes(activeAnimation)) play('listening');
    }, 950);
    function glance() {
      if (disposed) return;
      if (wantsMotion() && DESKTOP.matches && !isOpen() && activeAnimation === 'listening' && performance.now() - lastGazeMove > 6000) {
        updateGaze(Math.random() > 0.5 ? 10 : -10, -4);
        setTimeout(() => { if (!disposed && performance.now() - lastGazeMove > 6000) resetGaze(); }, 500);
      }
      glanceTimer = setTimeout(glance, 9000 + Math.random() * 7000);
    }
    glance();
    cleanup.push(() => { clearInterval(lifeTimer); clearGazeReturn(); clearTimeout(glanceTimer); clearTimeout(wakeTimer); if (gazeFrame) cancelAnimationFrame(gazeFrame); classObserver.disconnect(); });

    root.dataset.vmgChatbotDismissed = String(recall('dismissed') === 'true');
    root.classList.add('vmg-chatbot-ready');
    document.body.classList.add('vmg-chatbot-enabled');
    syncModal();
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
      console.warn('[VMG Chatbot] Original avatar module not available; existing Help remains active.', err);
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

(function () {
  'use strict';

  var VIDEO_SRC = '/assets/video/vmg-home-intro.mp4?v=20260916a';
  var POSTER_SRC = '/assets/img/vmg-home-intro-poster.webp?v=20260916a';
  var FALLBACK_SRC = '/assets/img/vmg-home-intro-fallback.webp?v=20260916a';
  var LOGO_SRC = '/assets/img/vmg-combined-logo.png';
  var VIDEO_READY_MS = 1600;
  var VIDEO_START_TOLERANCE = 0.08;
  var VIDEO_HANDOFF_AT = 2.90;
  var VIDEO_SAFETY_MS = 6500;
  var FALLBACK_DURATION_MS = 2900;
  var MOVE_MS = 460;
  var HANDOFF_EASING = 'cubic-bezier(.22,1,.36,1)';
  var POPUP_DELAY_MS = 7000;
  var LOGO_ALPHA = { left: 30, top: 28, width: 1828, height: 665, canvasWidth: 1904, canvasHeight: 724 };

  var state = null;
  var popupTimer = 0;
  var popupGuard = null;

  function isHome() {
    var p = (window.location.pathname || '/').replace(/\/{2,}/g, '/');
    return p === '/' || p === '/index.html';
  }

  function targetLogo() {
    var img = document.querySelector('.site-header.vmg-econship-header .vmg-header-logo-combined, .site-header.vmg-econship-header .logo img');
    if (!img) return null;
    var rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return { img: img, rect: rect };
  }

  function sourceLogoCanvasRect() {
    var vw = window.innerWidth || document.documentElement.clientWidth || 1600;
    var vh = window.innerHeight || document.documentElement.clientHeight || 900;
    var fit = Math.min(vw / 1600, vh / 900);
    var renderedW = 1600 * fit;
    var renderedH = 900 * fit;
    var ox = (vw - renderedW) / 2;
    var oy = (vh - renderedH) / 2;
    var visible = { left: ox + 198 * fit, top: oy + 200 * fit, width: 1195 * fit, height: 436 * fit };
    var sx = visible.width / LOGO_ALPHA.width;
    var sy = visible.height / LOGO_ALPHA.height;
    return {
      left: visible.left - LOGO_ALPHA.left * sx,
      top: visible.top - LOGO_ALPHA.top * sy,
      width: LOGO_ALPHA.canvasWidth * sx,
      height: LOGO_ALPHA.canvasHeight * sy
    };
  }

  function suppressPopup() {
    if (!isHome()) return;
    try {
      if (window.VMGOpeningPopup && typeof window.VMGOpeningPopup.isOpen === 'function' && window.VMGOpeningPopup.isOpen()) {
        window.VMGOpeningPopup.close();
        return;
      }
    } catch (_) {}
    var overlay = document.querySelector('.opening-popup-overlay');
    var close = overlay && overlay.querySelector('.opening-popup-close');
    if (close) close.click();
  }

  function startPopupGuard() {
    if (!isHome() || popupGuard || !document.body) return;
    suppressPopup();
    popupGuard = new MutationObserver(suppressPopup);
    popupGuard.observe(document.body, { childList: true, subtree: true });
  }

  function stopPopupGuard() {
    if (!popupGuard) return;
    popupGuard.disconnect();
    popupGuard = null;
  }

  function schedulePopup() {
    window.clearTimeout(popupTimer);
    popupTimer = window.setTimeout(function () {
      popupTimer = 0;
      stopPopupGuard();
      if (!isHome()) return;
      if (window.VMGOpeningPopup && typeof window.VMGOpeningPopup.open === 'function') window.VMGOpeningPopup.open();
      else if (typeof window.initOpeningPopup === 'function') window.initOpeningPopup(0);
    }, POPUP_DELAY_MS);
  }

  function signalComplete() {
    if (!isHome() || window.__vmgHomeIntroComplete) return;
    window.__vmgHomeIntroComplete = true;
    document.dispatchEvent(new CustomEvent('vmg:home-intro-complete'));
    schedulePopup();
  }

  function clearStateTimers() {
    if (!state) return;
    ['readinessTimer', 'retryTimer', 'fallbackTimer', 'videoSafetyTimer', 'handoffTimer', 'startFrameTimer', 'seekTimer'].forEach(function (key) {
      if (state[key]) window.clearTimeout(state[key]);
      state[key] = 0;
    });
    if (state.videoFrameId && state.video && typeof state.video.cancelVideoFrameCallback === 'function') {
      try { state.video.cancelVideoFrameCallback(state.videoFrameId); } catch (_) {}
      state.videoFrameId = 0;
    }
    if (state.videoHandoffFrameId && state.video && typeof state.video.cancelVideoFrameCallback === 'function') {
      try { state.video.cancelVideoFrameCallback(state.videoHandoffFrameId); } catch (_) {}
      state.videoHandoffFrameId = 0;
    }
    if (state.videoHandoffTimer) {
      window.clearInterval(state.videoHandoffTimer);
      state.videoHandoffTimer = 0;
    }
    if (state.startFrameFallbackHandler && state.video) {
      state.video.removeEventListener('playing', state.startFrameFallbackHandler);
      state.video.removeEventListener('timeupdate', state.startFrameFallbackHandler);
      state.startFrameFallbackHandler = null;
    }
    if (state.seekHandler && state.video) {
      state.video.removeEventListener('seeked', state.seekHandler);
      state.seekHandler = null;
    }
  }

  function destroyState(complete) {
    if (!state) {
      document.documentElement.classList.remove('vmg-home-intro-active', 'vmg-home-intro-pending');
      if (complete) signalComplete();
      return;
    }
    clearStateTimers();
    if (state.moveAnimation) {
      try { state.moveAnimation.cancel(); } catch (_) {}
    }
    if (state.video) {
      try { state.video.pause(); } catch (_) {}
    }
    if (state.fallbackAbort) {
      try { state.fallbackAbort.abort(); } catch (_) {}
      state.fallbackAbort = null;
    }
    if (state.fallbackObjectUrl) {
      try { window.URL.revokeObjectURL(state.fallbackObjectUrl); } catch (_) {}
      state.fallbackObjectUrl = '';
    }
    if (state.targetImg) state.targetImg.style.opacity = '';
    window.removeEventListener('resize', state.onResize);
    window.removeEventListener('orientationchange', state.onResize);
    document.removeEventListener('visibilitychange', state.onVisibility);
    if (state.onVideoReady && state.video) {
      state.video.removeEventListener('loadeddata', state.onVideoReady);
      state.video.removeEventListener('canplay', state.onVideoReady);
    }
    if (document.body) document.body.style.overflow = state.previousOverflow || '';
    document.documentElement.classList.remove('vmg-home-intro-active', 'vmg-home-intro-pending');
    if (state.root && state.root.isConnected) state.root.remove();
    state = null;
    if (complete) signalComplete();
  }

  function finishImmediately() {
    if (!state || state.finishing) return;
    state.finishing = true;
    clearStateTimers();
    if (state.targetImg) state.targetImg.style.opacity = '';
    if (state.proxy) state.proxy.style.opacity = '0';
    state.root.style.transition = 'opacity 180ms ease';
    state.root.style.opacity = '0';
    window.setTimeout(function () { destroyState(true); }, 190);
  }

  function finishHandoff() {
    if (!state) return;
    if (state.targetImg) state.targetImg.style.opacity = '';
    if (state.proxy) state.proxy.style.opacity = '0';
    destroyState(true);
  }

  function handoff() {
    if (!state || state.finishing) return;
    var target = targetLogo();
    if (!target) {
      finishImmediately();
      return;
    }

    state.finishing = true;
    if (state.skip) {
      state.skip.style.pointerEvents = 'none';
      state.skip.remove();
      state.skip = null;
    }
    clearStateTimers();
    state.targetImg = target.img;

    var from = sourceLogoCanvasRect();
    var to = target.rect;
    var proxy = state.proxy;
    var activeMedia = state.introMode === 'video' ? state.video : state.fallback;

    proxy.style.left = from.left + 'px';
    proxy.style.top = from.top + 'px';
    proxy.style.width = from.width + 'px';
    proxy.style.height = from.height + 'px';
    proxy.style.opacity = '1';
    proxy.style.visibility = 'visible';
    proxy.style.transformOrigin = '0 0';
    proxy.style.transform = 'translate3d(0,0,0) scale(1,1)';
    target.img.style.opacity = '0';

    var dx = to.left - from.left;
    var dy = to.top - from.top;
    var sx = to.width / from.width;
    var sy = to.height / from.height;

    if (activeMedia && typeof activeMedia.animate === 'function') {
      activeMedia.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'linear', fill: 'forwards' });
    } else if (activeMedia) {
      activeMedia.style.opacity = '0';
    }
    if (state.poster) state.poster.style.opacity = '0';
    state.root.style.background = 'transparent';

    if (typeof proxy.animate === 'function') {
      state.moveAnimation = proxy.animate([
        { transform: 'translate3d(0,0,0) scale(1,1)' },
        { transform: 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + sx + ',' + sy + ')' }
      ], { duration: MOVE_MS, easing: HANDOFF_EASING, fill: 'forwards' });
      state.moveAnimation.onfinish = finishHandoff;
      state.moveAnimation.oncancel = function () {};
      state.handoffTimer = window.setTimeout(finishHandoff, MOVE_MS + 180);
    } else {
      proxy.style.transition = 'transform ' + MOVE_MS + 'ms ' + HANDOFF_EASING;
      window.requestAnimationFrame(function () {
        if (!state) return;
        proxy.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + sx + ',' + sy + ')';
      });
      state.handoffTimer = window.setTimeout(finishHandoff, MOVE_MS + 60);
    }
  }

  function ensureRoot() {
    var root = document.querySelector('.vmg-home-intro');
    if (root) return root;
    root = document.createElement('div');
    root.className = 'vmg-home-intro';
    root.setAttribute('data-vmg-intro-shell', 'dynamic');
    root.innerHTML = '<img class="vmg-home-intro-poster" src="' + POSTER_SRC + '" alt="" aria-hidden="true" decoding="async" fetchpriority="high">' +
      '<div class="vmg-home-intro-proxy" aria-hidden="true"><img src="' + LOGO_SRC + '" alt="" loading="eager" decoding="async" fetchpriority="high"></div>' +
      '<button class="vmg-home-intro-skip" type="button" aria-label="Skip intro">Skip Intro</button>';
    document.body.insertBefore(root, document.body.firstChild);
    return root;
  }

  function configureVideo(video) {
    // Prepare first; do not let autoplay silently consume the opening under the poster.
    video.autoplay = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.controls = false;
    video.disablePictureInPicture = true;
    video.removeAttribute('autoplay');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'auto');
    video.setAttribute('poster', POSTER_SRC);
    video.setAttribute('aria-hidden', 'true');
  }

  function armVideoHandoffMonitor() {
    if (!state || state.introMode !== 'video' || !state.video || state.finishing) return;
    var video = state.video;

    if (typeof video.requestVideoFrameCallback === 'function') {
      var watchFrame = function (_, metadata) {
        if (!state || state.introMode !== 'video' || state.finishing) return;
        var mediaTime = metadata && typeof metadata.mediaTime === 'number' ? metadata.mediaTime : video.currentTime;
        if (mediaTime >= VIDEO_HANDOFF_AT) {
          state.videoHandoffFrameId = 0;
          handoff();
          return;
        }
        try { state.videoHandoffFrameId = video.requestVideoFrameCallback(watchFrame); }
        catch (_) { state.videoHandoffFrameId = 0; }
      };
      try {
        state.videoHandoffFrameId = video.requestVideoFrameCallback(watchFrame);
        return;
      } catch (_) {
        state.videoHandoffFrameId = 0;
      }
    }

    state.videoHandoffTimer = window.setInterval(function () {
      if (!state || state.introMode !== 'video' || state.finishing) return;
      if (video.currentTime >= VIDEO_HANDOFF_AT) handoff();
    }, 40);
  }

  function clearStartFrameProof() {
    if (!state || !state.video) return;
    if (state.videoFrameId && typeof state.video.cancelVideoFrameCallback === 'function') {
      try { state.video.cancelVideoFrameCallback(state.videoFrameId); } catch (_) {}
      state.videoFrameId = 0;
    }
    if (state.startFrameFallbackHandler) {
      state.video.removeEventListener('playing', state.startFrameFallbackHandler);
      state.video.removeEventListener('timeupdate', state.startFrameFallbackHandler);
      state.startFrameFallbackHandler = null;
    }
    if (state.startFrameTimer) {
      window.clearTimeout(state.startFrameTimer);
      state.startFrameTimer = 0;
    }
  }

  function selectPreparedVideo(mediaTime) {
    if (!state || state.introMode !== 'pending' || state.finishing) return;
    clearStartFrameProof();

    // A warm-cache playback must still reveal from the delivered opening, never mid-animation.
    if (mediaTime > VIDEO_START_TOLERANCE) {
      if (state.startResets < 2) {
        state.startResets += 1;
        beginPreparedPlayback();
      } else {
        chooseFallback('late-start-frame');
      }
      return;
    }

    window.clearTimeout(state.readinessTimer);
    state.readinessTimer = 0;
    state.frameSeen = true;
    state.introMode = 'video';
    state.root.setAttribute('data-vmg-intro-mode', 'video');
    state.video.classList.add('is-active');
    state.poster.classList.add('is-hidden');
    armVideoHandoffMonitor();
    state.videoSafetyTimer = window.setTimeout(function () {
      if (state && state.introMode === 'video' && !state.finishing) handoff();
    }, VIDEO_SAFETY_MS);
  }

  function armFirstVisibleFrame() {
    if (!state || state.introMode !== 'pending' || !state.video) return;
    var video = state.video;
    clearStartFrameProof();

    if (typeof video.requestVideoFrameCallback === 'function') {
      try {
        state.videoFrameId = video.requestVideoFrameCallback(function (_, metadata) {
          if (!state || state.introMode !== 'pending') return;
          state.videoFrameId = 0;
          var mediaTime = metadata && typeof metadata.mediaTime === 'number' ? metadata.mediaTime : video.currentTime;
          selectPreparedVideo(mediaTime);
        });
      } catch (_) {
        state.videoFrameId = 0;
      }
    }

    if (!state.videoFrameId) {
      state.startFrameFallbackHandler = function () {
        if (!state || state.introMode !== 'pending') return;
        var mediaTime = video.currentTime || 0;
        if (mediaTime < 0 || video.readyState < 2) return;
        selectPreparedVideo(mediaTime);
      };
      video.addEventListener('playing', state.startFrameFallbackHandler);
      video.addEventListener('timeupdate', state.startFrameFallbackHandler);
    }

    state.startFrameTimer = window.setTimeout(function () {
      if (!state || state.introMode !== 'pending') return;
      clearStartFrameProof();
      if (state.playAttempts < 2) schedulePreparedRetry();
      else chooseFallback('start-frame-timeout');
    }, 700);
  }

  function resetVideoToStart(done) {
    if (!state || state.introMode !== 'pending' || !state.video) return;
    var video = state.video;
    try { video.pause(); } catch (_) {}

    if (state.seekTimer) window.clearTimeout(state.seekTimer);
    if (state.seekHandler) video.removeEventListener('seeked', state.seekHandler);

    var settled = false;
    var finish = function () {
      if (settled) return;
      settled = true;
      if (state && state.video) {
        state.video.removeEventListener('seeked', finish);
        state.seekHandler = null;
        if (state.seekTimer) window.clearTimeout(state.seekTimer);
        state.seekTimer = 0;
      }
      if (state && state.introMode === 'pending') done();
    };
    state.seekHandler = finish;
    video.addEventListener('seeked', finish, { once: true });
    var alreadyAtStart = !video.seeking && Math.abs(video.currentTime || 0) <= 0.005;
    if (!alreadyAtStart) {
      try { video.currentTime = 0; } catch (_) {}
    }
    state.seekTimer = window.setTimeout(finish, 180);
    if (alreadyAtStart) window.requestAnimationFrame(finish);
  }

  function schedulePreparedRetry() {
    if (!state || state.introMode !== 'pending' || state.playAttempts >= 2 || state.retryScheduled) return;
    state.retryScheduled = true;
    state.retryTimer = window.setTimeout(function () {
      if (!state || state.introMode !== 'pending') return;
      state.retryScheduled = false;
      beginPreparedPlayback();
    }, 80);
  }

  function playPreparedVideo() {
    if (!state || state.introMode !== 'pending' || !state.video) return;
    var video = state.video;
    state.preparing = false;
    state.playAttempts += 1;
    state.playResolved = false;
    clearStartFrameProof();

    var acceptPlayback = function () {
      if (!state || state.introMode !== 'pending') return;
      state.playResolved = true;
      selectPreparedVideo(video.currentTime || 0);
    };

    var playResult;
    try { playResult = video.play(); } catch (_) { playResult = null; }
    if (playResult && typeof playResult.then === 'function') {
      playResult.then(acceptPlayback).catch(function () {
        if (!state || state.introMode !== 'pending') return;
        if (state.playAttempts < 2) schedulePreparedRetry();
        else chooseFallback('play-rejected');
      });
    } else if (playResult === null) {
      if (state && state.playAttempts < 2) schedulePreparedRetry();
      else if (state) chooseFallback('play-rejected');
    } else {
      window.requestAnimationFrame(acceptPlayback);
    }
  }

  function beginPreparedPlayback() {
    if (!state || state.introMode !== 'pending' || !state.video || state.preparing) return;
    var video = state.video;
    if (video.readyState < 3) return;
    state.preparing = true;
    clearStartFrameProof();
    resetVideoToStart(playPreparedVideo);
  }

  function mountFreshFallback(src, objectUrl) {
    if (!state || state.introMode !== 'animated-fallback' || state.finishing) {
      if (objectUrl) {
        try { window.URL.revokeObjectURL(objectUrl); } catch (_) {}
      }
      return;
    }

    if (objectUrl) state.fallbackObjectUrl = objectUrl;
    var fallback = document.createElement('img');
    fallback.className = 'vmg-home-intro-fallback vmg-home-intro-media';
    fallback.alt = '';
    fallback.setAttribute('aria-hidden', 'true');
    fallback.decoding = 'sync';
    fallback.loading = 'eager';
    state.fallback = fallback;

    fallback.addEventListener('load', function () {
      if (!state || state.introMode !== 'animated-fallback' || state.finishing) return;
      window.requestAnimationFrame(function () {
        if (!state || state.introMode !== 'animated-fallback' || state.finishing) return;
        fallback.classList.add('is-active');
        state.poster.classList.add('is-hidden');
        state.fallbackStartedAt = performance.now();
        state.fallbackTimer = window.setTimeout(function () {
          if (state && state.introMode === 'animated-fallback' && !state.finishing) handoff();
        }, FALLBACK_DURATION_MS);
      });
    }, { once: true });
    fallback.addEventListener('error', function () {
      if (!state || state.finishing) return;
      state.poster.classList.add('vmg-emergency-motion');
      state.fallbackTimer = window.setTimeout(handoff, FALLBACK_DURATION_MS);
    }, { once: true });
    state.root.insertBefore(fallback, state.proxy);
    fallback.src = src;
  }

  function chooseFallback(reason) {
    if (!state || state.introMode !== 'pending') return;
    state.introMode = 'animated-fallback';
    state.root.setAttribute('data-vmg-intro-mode', 'animated-fallback');
    state.fallbackReason = reason || 'video-unavailable';
    state.root.setAttribute('data-vmg-fallback-reason', state.fallbackReason);
    window.clearTimeout(state.readinessTimer);
    window.clearTimeout(state.retryTimer);
    state.readinessTimer = 0;
    state.retryTimer = 0;
    try { state.video.pause(); } catch (_) {}
    state.video.classList.remove('is-active');

    if (window.fetch && window.URL && typeof window.URL.createObjectURL === 'function') {
      var controller = typeof AbortController === 'function' ? new AbortController() : null;
      state.fallbackAbort = controller;
      var options = { cache: 'force-cache', credentials: 'same-origin' };
      if (controller) options.signal = controller.signal;
      window.fetch(FALLBACK_SRC, options).then(function (response) {
        if (!response.ok) throw new Error('fallback-http-' + response.status);
        return response.blob();
      }).then(function (blob) {
        if (!state || state.introMode !== 'animated-fallback' || state.finishing) return;
        state.fallbackAbort = null;
        var objectUrl = window.URL.createObjectURL(blob);
        mountFreshFallback(objectUrl, objectUrl);
      }).catch(function (error) {
        if (!state || state.finishing || (error && error.name === 'AbortError')) return;
        state.fallbackAbort = null;
        mountFreshFallback(FALLBACK_SRC, false);
      });
      return;
    }

    mountFreshFallback(FALLBACK_SRC, false);
  }

  function start() {
    if (!isHome()) {
      document.documentElement.classList.remove('vmg-home-intro-active', 'vmg-home-intro-pending');
      return;
    }
    if (!document.body || state) return;

    window.clearTimeout(popupTimer);
    popupTimer = 0;
    window.__vmgHomeIntroComplete = false;
    startPopupGuard();

    var root = ensureRoot();
    var poster = root.querySelector('.vmg-home-intro-poster');
    var proxy = root.querySelector('.vmg-home-intro-proxy');
    var skip = root.querySelector('.vmg-home-intro-skip');
    var previousOverflow = document.body.style.overflow;

    root.style.opacity = '1';
    root.setAttribute('data-vmg-intro-mode', 'pending');
    root.removeAttribute('data-vmg-fallback-reason');
    root.style.transition = '';
    poster.classList.remove('is-hidden', 'vmg-emergency-motion');
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('vmg-home-intro-active');
    document.documentElement.classList.remove('vmg-home-intro-pending');

    var video = document.createElement('video');
    video.className = 'vmg-home-intro-video vmg-home-intro-media';
    configureVideo(video);
    var source = document.createElement('source');
    source.src = VIDEO_SRC;
    source.type = 'video/mp4';
    video.appendChild(source);
    root.insertBefore(video, proxy);

    state = {
      root: root,
      poster: poster,
      video: video,
      fallback: null,
      proxy: proxy,
      skip: skip,
      previousOverflow: previousOverflow,
      introMode: 'pending',
      fallbackReason: '',
      finishing: false,
      targetImg: null,
      playAttempts: 0,
      playResolved: false,
      frameSeen: false,
      preparing: false,
      startResets: 0,
      retryScheduled: false,
      readinessTimer: 0,
      retryTimer: 0,
      fallbackTimer: 0,
      videoSafetyTimer: 0,
      handoffTimer: 0,
      startFrameTimer: 0,
      seekTimer: 0,
      seekHandler: null,
      startFrameFallbackHandler: null,
      videoFrameId: 0,
      videoHandoffFrameId: 0,
      videoHandoffTimer: 0,
      fallbackAbort: null,
      fallbackObjectUrl: '',
      fallbackStartedAt: 0,
      moveAnimation: null,
      onResize: function () {},
      onVisibility: null,
      onVideoReady: null
    };

    skip.addEventListener('click', finishImmediately, { once: true });
    video.addEventListener('ended', function () {
      if (state && state.introMode === 'video' && !state.finishing) handoff();
    });
    video.addEventListener('error', function () {
      if (!state || state.finishing) return;
      if (state.introMode === 'pending') chooseFallback('video-error');
      else if (state.introMode === 'video') handoff();
    });
    var onVideoReady = function () {
      if (!state || state.introMode !== 'pending') return;
      if (video.readyState >= 3) beginPreparedPlayback();
    };
    video.addEventListener('loadeddata', onVideoReady);
    video.addEventListener('canplay', onVideoReady);
    state.onVideoReady = onVideoReady;

    state.onVisibility = function () {
      if (!state || document.visibilityState !== 'visible' || state.finishing) return;
      if (state.introMode === 'video' && state.video.paused && !state.video.ended) {
        try {
          var resume = state.video.play();
          if (resume && typeof resume.catch === 'function') resume.catch(function () { if (state) handoff(); });
        } catch (_) { handoff(); }
      }
    };
    window.addEventListener('resize', state.onResize, { passive: true });
    window.addEventListener('orientationchange', state.onResize, { passive: true });
    document.addEventListener('visibilitychange', state.onVisibility);

    state.readinessTimer = window.setTimeout(function () {
      if (state && state.introMode === 'pending') chooseFallback('readiness-timeout');
    }, VIDEO_READY_MS);

    video.load();
    if (video.readyState >= 3) window.setTimeout(beginPreparedPlayback, 0);
  }

  function replayAfterBFCache() {
    window.clearTimeout(popupTimer);
    popupTimer = 0;
    stopPopupGuard();
    if (state) destroyState(false);
    window.__vmgHomeIntroComplete = false;
    window.setTimeout(start, 0);
  }

  function boot() {
    if (!isHome()) {
      document.documentElement.classList.remove('vmg-home-intro-active', 'vmg-home-intro-pending');
      return;
    }
    start();
  }

  // This script is deferred, so the parsed body/static poster already exists here.
  // Start preparation immediately instead of waiting for unrelated page resources/DCL.
  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted && isHome()) replayAfterBFCache();
  });
})();

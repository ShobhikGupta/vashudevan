(function () {
  'use strict';

  var VIDEO_SRC = '/assets/video/vmg-home-intro.mp4';
  var LOGO_SRC = '/assets/img/vmg-combined-logo.png';
  var HANDOFF_AT = 4.05;
  var MOVE_MS = 720;
  var state = null;

  function isHome() {
    var path = (window.location.pathname || '/').replace(/\/{2,}/g, '/');
    return path === '/' || path === '/index.html';
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function sourceLogoRect(video) {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var iw = video.videoWidth || 1600;
    var ih = video.videoHeight || 900;
    var scale = Math.min(vw / iw, vh / ih);
    var dw = iw * scale;
    var dh = ih * scale;
    var ox = (vw - dw) / 2;
    var oy = (vh - dh) / 2;
    return {
      left: ox + 196 * scale,
      top: oy + 200 * scale,
      width: 1197 * scale,
      height: 436 * scale
    };
  }

  function targetLogoRect() {
    var img = document.querySelector('.site-header.vmg-econship-header .vmg-header-logo-combined, .site-header.vmg-econship-header .logo img');
    if (!img) return null;
    return { img: img, rect: img.getBoundingClientRect() };
  }

  function applyRect(el, rect) {
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
  }

  function cleanup(reveal) {
    if (!state) return;
    window.clearTimeout(state.failTimer);
    window.removeEventListener('resize', state.onResize);
    window.removeEventListener('orientationchange', state.onResize);
    if (state.targetImg) state.targetImg.style.opacity = '';
    document.body.style.overflow = state.previousOverflow || '';
    document.documentElement.classList.remove('vmg-home-intro-active', 'vmg-home-intro-pending');
    if (state.root && state.root.isConnected) state.root.remove();
    state = null;
    if (reveal) document.body.style.visibility = '';
  }

  function finishImmediately() {
    if (!state) return;
    state.finishing = true;
    state.root.style.transition = 'opacity 180ms ease';
    state.root.style.opacity = '0';
    window.setTimeout(function () { cleanup(true); }, 190);
  }

  function handoff() {
    if (!state || state.finishing) return;
    state.finishing = true;
    var target = targetLogoRect();
    if (!target || !target.rect.width || !target.rect.height) {
      finishImmediately();
      return;
    }
    state.targetImg = target.img;
    target.img.style.opacity = '0';
    var from = sourceLogoRect(state.video);
    applyRect(state.proxy, from);
    state.proxy.style.opacity = '1';
    state.video.style.opacity = '0';
    state.backdrop.style.opacity = '0';
    document.body.style.visibility = '';
    state.proxy.getBoundingClientRect();
    state.proxy.style.transition = 'left ' + MOVE_MS + 'ms cubic-bezier(.22,1,.36,1), top ' + MOVE_MS + 'ms cubic-bezier(.22,1,.36,1), width ' + MOVE_MS + 'ms cubic-bezier(.22,1,.36,1), height ' + MOVE_MS + 'ms cubic-bezier(.22,1,.36,1)';
    applyRect(state.proxy, target.rect);
    window.setTimeout(function () {
      if (!state) return;
      if (state.targetImg) state.targetImg.style.opacity = '';
      cleanup(true);
    }, MOVE_MS + 40);
  }

  function start() {
    if (!isHome() || reducedMotion()) {
      document.documentElement.classList.remove('vmg-home-intro-pending');
      return;
    }
    if (!document.body || state) return;

    var root = document.createElement('div');
    root.className = 'vmg-home-intro';
    root.innerHTML = '<div class="vmg-home-intro-backdrop"></div>' +
      '<video class="vmg-home-intro-video" muted playsinline preload="auto" aria-hidden="true"><source src="' + VIDEO_SRC + '" type="video/mp4"></video>' +
      '<img class="vmg-home-intro-proxy" src="' + LOGO_SRC + '" alt="" aria-hidden="true">' +
      '<button class="vmg-home-intro-skip" type="button" aria-label="Skip intro">Skip Intro</button>';

    var style = document.createElement('style');
    style.textContent = [
      '.vmg-home-intro{position:fixed;inset:0;z-index:2147483000;background:#fff;overflow:hidden}',
      '.vmg-home-intro-backdrop{position:absolute;inset:0;background:#fff;transition:opacity 240ms ease}',
      '.vmg-home-intro-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#fff;transition:opacity 120ms linear}',
      '.vmg-home-intro-proxy{position:fixed;z-index:2;object-fit:contain;opacity:0;pointer-events:none}',
      '.vmg-home-intro-skip{position:absolute;top:max(18px,env(safe-area-inset-top));left:max(18px,env(safe-area-inset-left));z-index:3;border:1px solid rgba(16,24,40,.14);border-radius:999px;background:rgba(255,255,255,.9);color:#344054;padding:9px 14px;font:600 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.01em;box-shadow:0 4px 18px rgba(16,24,40,.08);cursor:pointer;backdrop-filter:blur(8px)}',
      '.vmg-home-intro-skip:hover{background:#fff;color:#101828}',
      '@media(max-width:600px){.vmg-home-intro-skip{top:max(14px,env(safe-area-inset-top));left:max(14px,env(safe-area-inset-left));padding:8px 12px;font-size:11px}}'
    ].join('');
    root.appendChild(style);
    document.body.insertBefore(root, document.body.firstChild);

    var video = root.querySelector('video');
    var proxy = root.querySelector('.vmg-home-intro-proxy');
    var backdrop = root.querySelector('.vmg-home-intro-backdrop');
    var previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.style.visibility = '';
    document.documentElement.classList.add('vmg-home-intro-active');
    document.documentElement.classList.remove('vmg-home-intro-pending');

    state = { root: root, video: video, proxy: proxy, backdrop: backdrop, previousOverflow: previousOverflow, finishing: false, targetImg: null };
    state.onResize = function () {
      if (!state || state.finishing) return;
      var r = sourceLogoRect(video);
      if (state.proxy.style.opacity === '1') applyRect(state.proxy, r);
    };
    window.addEventListener('resize', state.onResize, { passive: true });
    window.addEventListener('orientationchange', state.onResize, { passive: true });
    root.querySelector('.vmg-home-intro-skip').addEventListener('click', finishImmediately);
    video.addEventListener('timeupdate', function () { if (video.currentTime >= HANDOFF_AT) handoff(); });
    video.addEventListener('ended', function () { if (!state || !state.finishing) handoff(); });
    video.addEventListener('error', finishImmediately, { once: true });
    state.failTimer = window.setTimeout(function () { if (state && video.currentTime < 0.25) finishImmediately(); }, 1800);
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(finishImmediately);
  }

  function boot() {
    if (!isHome()) {
      document.documentElement.classList.remove('vmg-home-intro-pending');
      return;
    }
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.addEventListener('pageshow', function (event) {
    if (event.persisted && isHome() && !state) window.setTimeout(start, 0);
  });
})();

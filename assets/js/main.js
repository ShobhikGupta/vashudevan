(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const submenuParents = document.querySelectorAll('.site-nav .has-submenu');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Mobile submenu toggle
  submenuParents.forEach(function (parent) {
    const link = parent.querySelector(':scope > a');
    link && link.addEventListener('click', function (e) {
      if (window.matchMedia('(max-width: 720px)').matches) {
        e.preventDefault();
        parent.classList.toggle('open');
      }
    });
  });

  // Contact form basic validation and fake submit
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const message = document.getElementById('message');
      const result = document.getElementById('form-result');

      let valid = true;
      function setError(input, msg) {
        const error = input.parentElement.querySelector('.error');
        if (error) error.textContent = msg || '';
      }

      [name, email, message].forEach(function (input) { setError(input, ''); });

      if (!name.value.trim()) { setError(name, 'Please enter your name'); valid = false; }
      if (!email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError(email, 'Enter a valid email'); valid = false; }
      if (!message.value.trim()) { setError(message, 'Please enter a message'); valid = false; }

      if (!valid) return;

      result.textContent = 'Thanks! Your message has been captured locally.';
      form.reset();
      setTimeout(function () { result.textContent = ''; }, 4000);
    });
  }

  // Image attributes and resilient fallbacks without rewriting working paths
  document.addEventListener('DOMContentLoaded', function () {
    function attachImgHandlers(img) {
      if (!img || img.__hasFallbackListener) return;
      img.__hasFallbackListener = true;
      var triedAlt = false;
      img.addEventListener('error', function () {
        if (triedAlt) return;
        triedAlt = true;
        var fallback = img.getAttribute('data-fallback');
        if (fallback && fallback !== img.getAttribute('src')) {
          img.setAttribute('src', fallback);
          return;
        }
        var current = img.getAttribute('src') || '';
        if (current.startsWith('/')) {
          img.setAttribute('src', current.replace(/^\//, ''));
        } else if (current.startsWith('./')) {
          img.setAttribute('src', current.slice(2));
        } else if (current.startsWith('assets/')) {
          img.setAttribute('src', './' + current);
        } else {
          img.setAttribute('src', '/' + current);
        }
      }, { once: true });
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }

    document.querySelectorAll('img').forEach(attachImgHandlers);

    // Observe future images (e.g., rendered by catalog.js)
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes && m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName && node.tagName.toLowerCase() === 'img') {
            attachImgHandlers(node);
          } else {
            node.querySelectorAll && node.querySelectorAll('img').forEach(attachImgHandlers);
          }
        });
      });
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
  });
})();



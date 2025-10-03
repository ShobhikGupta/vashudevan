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

  // Contact form validation and submit via configured endpoint
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const company = document.getElementById('company');
      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const phone = document.getElementById('phone');
      const country = document.getElementById('country');
      const message = document.getElementById('message');
      const result = document.getElementById('form-result');

      let valid = true;
      function setError(input, msg) {
        const error = input.parentElement.querySelector('.error');
        if (error) error.textContent = msg || '';
      }

      [company, name, email, phone, country, message].forEach(function (input) { input && setError(input, ''); });

      if (!name.value.trim()) { setError(name, 'Please enter your name'); valid = false; }
      if (!email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError(email, 'Enter a valid company email'); valid = false; }
      if (!phone.value.trim()) { setError(phone, 'Please enter your mobile number'); valid = false; }
      else if (!phone.value.match(/^\+?[0-9\-()\s]{7,20}$/)) { setError(phone, 'Enter a valid mobile number'); valid = false; }
      if (!message.value.trim()) { setError(message, 'Please enter a message'); valid = false; }

      if (!valid) return;

      var endpoint = (window.AppConfig && window.AppConfig.contactEndpoint) || '';
      if (!endpoint) {
        result.textContent = 'Submission endpoint is not configured.';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn && submitBtn.setAttribute('disabled', 'true');
      submitBtn && submitBtn.classList.add('is-loading');
      result.textContent = 'Sending...';

      var payload = {
        company: company && company.value.trim() || '',
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        country: country && country.value.trim() || '',
        message: message.value.trim(),
        page: window.location.href,
        submittedAt: new Date().toISOString()
      };

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json().catch(function(){ return {}; });
      }).then(function () {
        result.textContent = 'Thanks! Your message has been sent.';
        form.reset();
        setTimeout(function () { result.textContent = ''; }, 5000);
      }).catch(function (err) {
        console.error(err);
        result.textContent = 'Sorry, there was a problem sending your message. Please try again later.';
      }).finally(function(){
        submitBtn && submitBtn.removeAttribute('disabled');
        submitBtn && submitBtn.classList.remove('is-loading');
      });
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



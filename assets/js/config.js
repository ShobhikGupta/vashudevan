// Configuration for client-side features
(function(){
  window.AppConfig = window.AppConfig || {};
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
})();

// Load preview-only shared styles without editing every page template.
(function(){
  if (!document || !document.head) return;

  function loadStylesheet(href, marker) {
    if (document.querySelector('link[' + marker + ']')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(marker, 'true');
    document.head.appendChild(link);
  }

  loadStylesheet('/assets/css/vmg-trade-nav.css', 'data-vmg-trade-nav');
  loadStylesheet('/assets/css/vmg-market-polish.css', 'data-vmg-market-polish');
})();

// Build the requested site-wide order and Econship-inspired two-tier structure.
(function () {
  function normalizePath(href) {
    try {
      return new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
    } catch (e) {
      return href || '';
    }
  }

  function isCurrent(path) {
    var current = (window.location.pathname || '/').replace(/\/$/, '') || '/';
    if (path === '/index.html') return current === '/' || current === '/index.html';
    if (path === '/market-prices') return current === '/market-prices' || current === '/market-prices/index.html';
    if (path === '/resources.html') return current === '/resources.html' || current === '/resources';
    return current === path;
  }

  function ensurePrimaryItem(navList, label, href) {
    var links = Array.prototype.slice.call(navList.querySelectorAll(':scope > li > a'));
    var link = links.find(function (candidate) {
      var textMatch = candidate.textContent.trim().toLowerCase() === label.toLowerCase();
      var pathMatch = href !== 'javascript:void(0)' && normalizePath(candidate.getAttribute('href')) === href;
      return textMatch || pathMatch;
    });

    if (!link) {
      var li = document.createElement('li');
      link = document.createElement('a');
      link.textContent = label;
      link.href = href;
      li.appendChild(link);
      navList.appendChild(li);
    } else if (href !== 'javascript:void(0)') {
      link.href = href;
    }

    if (href !== 'javascript:void(0)' && isCurrent(href)) {
      link.setAttribute('aria-current', 'page');
    } else if (href !== 'javascript:void(0)') {
      link.removeAttribute('aria-current');
    }

    return link.closest('li');
  }

  function createTracker(compact) {
    var wrapper = document.createElement('div');
    wrapper.className = 'vmg-track-shipment';

    var title = document.createElement('span');
    title.className = 'vmg-track-title';
    title.textContent = 'Track Shipment';

    var form = document.createElement('form');
    form.className = 'vmg-track-form';
    form.setAttribute('data-vmg-track-form', 'true');
    form.setAttribute('aria-label', 'Track shipment');

    var input = document.createElement('input');
    input.className = 'vmg-track-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.placeholder = compact ? 'BL / Container / CTO No.' : 'Enter BL/Container/CTO No.';
    input.setAttribute('aria-label', 'BL, container or CTO number');

    var button = document.createElement('button');
    button.className = 'vmg-track-button';
    button.type = 'submit';
    button.textContent = 'Track';

    form.appendChild(input);
    form.appendChild(button);
    wrapper.appendChild(title);
    wrapper.appendChild(form);
    return wrapper;
  }

  function ensureToast() {
    var toast = document.querySelector('.vmg-track-toast');
    if (toast) return toast;
    toast = document.createElement('div');
    toast.className = 'vmg-track-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = 'Shipment tracking portal is coming soon.';
    document.body.appendChild(toast);
    return toast;
  }

  function bindTrackForms() {
    var toast = ensureToast();
    var hideTimer = null;

    document.querySelectorAll('[data-vmg-track-form]').forEach(function (form) {
      if (form.dataset.bound === 'true') return;
      form.dataset.bound = 'true';

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('.vmg-track-input');
        var hasValue = input && input.value.trim();
        toast.textContent = hasValue
          ? 'Shipment tracking portal is coming soon. Your reference has not been submitted.'
          : 'Shipment tracking portal is coming soon.';
        toast.classList.add('is-visible');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () {
          toast.classList.remove('is-visible');
        }, 3200);
      });
    });
  }

  function enhanceNavigation() {
    var header = document.querySelector('.site-header');
    var headerInner = header && header.querySelector('.header-inner');
    var logo = headerInner && headerInner.querySelector('.logo');
    var toggle = headerInner && headerInner.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    var navList = nav && nav.querySelector(':scope > ul');
    if (!header || !headerInner || !logo || !toggle || !nav || !navList) return;

    header.classList.add('vmg-econship-header');

    var brandRow = headerInner.querySelector('.vmg-nav-brand-row');
    if (!brandRow) {
      brandRow = document.createElement('div');
      brandRow.className = 'vmg-nav-brand-row';
      headerInner.insertBefore(brandRow, headerInner.firstChild);
    }

    var desktopTracker = brandRow.querySelector('.vmg-track-shipment');
    if (!desktopTracker) {
      desktopTracker = createTracker(false);
      brandRow.insertBefore(desktopTracker, brandRow.firstChild);
    }

    if (logo.parentNode !== brandRow) brandRow.appendChild(logo);

    var balance = brandRow.querySelector('.vmg-nav-balance');
    if (!balance) {
      balance = document.createElement('div');
      balance.className = 'vmg-nav-balance';
      balance.setAttribute('aria-hidden', 'true');
      brandRow.appendChild(balance);
    }

    if (toggle.parentNode !== brandRow) brandRow.appendChild(toggle);

    var homeItem = ensurePrimaryItem(navList, 'Home', '/index.html');
    var aboutItem = ensurePrimaryItem(navList, 'About Us', 'javascript:void(0)');
    var productsItem = ensurePrimaryItem(navList, 'Products', '/products.html');
    var marketItem = ensurePrimaryItem(navList, 'Market', '/market-prices');
    var resourcesItem = ensurePrimaryItem(navList, 'Resources', '/resources.html');
    var contactItem = ensurePrimaryItem(navList, 'Contact Us', '/contact.html');

    [homeItem, aboutItem, productsItem, marketItem, resourcesItem, contactItem].forEach(function (item) {
      if (item) navList.appendChild(item);
    });

    var mobileTrackerItem = navList.querySelector('.vmg-mobile-tracker-item');
    if (!mobileTrackerItem) {
      mobileTrackerItem = document.createElement('li');
      mobileTrackerItem.className = 'vmg-mobile-tracker-item';
      mobileTrackerItem.appendChild(createTracker(true));
      navList.insertBefore(mobileTrackerItem, navList.firstChild);
    }

    bindTrackForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceNavigation, { once: true });
  } else {
    enhanceNavigation();
  }
})();

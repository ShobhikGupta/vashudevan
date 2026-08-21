// Configuration for client-side features
(function(){
  window.AppConfig = window.AppConfig || {};
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
})();

// Load preview-only shared styles/scripts without editing every page template.
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

  function loadScript(src, marker) {
    if (document.querySelector('script[' + marker + ']')) return;
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(marker, 'true');
    document.head.appendChild(script);
  }

  loadStylesheet('/assets/css/vmg-trade-nav.css', 'data-vmg-trade-nav');
  loadStylesheet('/assets/css/vmg-nav-premium-overrides.css', 'data-vmg-nav-premium');
  loadStylesheet('/assets/css/vmg-market-polish.css', 'data-vmg-market-polish');
  loadStylesheet('/assets/css/vmg-feedback.css', 'data-vmg-feedback-style');
  loadStylesheet('/assets/css/vmg-responsive-polish.css?v=20260821g', 'data-vmg-responsive-polish');
  loadScript('/assets/js/vmg-feedback.js?v=20260821g', 'data-vmg-feedback-script');
  loadScript('/assets/js/vmg-help.js?v=20260821g', 'data-vmg-help-script');
})();

// Build the requested site-wide order and premium two-tier trade navigation.
(function () {
  var SOCIALS = [
    {
      label: 'WhatsApp',
      href: 'https://wa.me/919879208178',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.56 2 2.1 6.42 2.1 11.86c0 1.74.46 3.43 1.34 4.92L2 22l5.39-1.41a9.98 9.98 0 0 0 4.65 1.18h.01c5.48 0 9.94-4.42 9.94-9.86C22 6.42 17.53 2 12.04 2Zm0 17.98h-.01a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.2.84.86-3.1-.2-.32a8.05 8.05 0 0 1-1.26-4.22c0-4.46 3.71-8.08 8.28-8.08 4.57 0 8.29 3.62 8.29 8.08 0 4.46-3.72 8.12-8.29 8.12Zm4.55-6.06c-.25-.12-1.47-.71-1.7-.79-.23-.08-.4-.12-.57.12-.17.25-.65.79-.8.95-.15.16-.3.18-.55.06-.25-.12-1.06-.38-2.02-1.22-.75-.65-1.26-1.46-1.41-1.71-.15-.25-.02-.38.11-.51.11-.11.25-.28.38-.42.13-.14.17-.24.25-.4.08-.16.04-.3-.02-.42-.06-.12-.57-1.35-.78-1.84-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.3-.23.25-.88.85-.88 2.07 0 1.22.91 2.4 1.04 2.57.13.16 1.79 2.67 4.34 3.74.61.26 1.08.41 1.45.53.61.19 1.16.16 1.6.1.49-.07 1.47-.59 1.68-1.16.21-.57.21-1.06.15-1.16-.06-.1-.23-.16-.48-.28Z"/></svg>'
    },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61577681908111',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-9h3l.45-3.5H13.5V7.25c0-1.01.28-1.7 1.73-1.7H17V2.42c-.31-.04-1.37-.13-2.61-.13-2.58 0-4.35 1.58-4.35 4.48V9.5H7.12V13h2.92v9h3.46Z"/></svg>'
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/company/109161337/',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.4 7.9H2.2V22h3.2V7.9ZM3.8 2A1.9 1.9 0 1 0 3.8 5.8 1.9 1.9 0 0 0 3.8 2ZM22 13.9c0-4.25-2.27-6.23-5.3-6.23-2.45 0-3.54 1.34-4.15 2.28V7.9H9.36V22h3.19v-6.98c0-1.84.35-3.62 2.63-3.62 2.25 0 2.28 2.1 2.28 3.74V22H22v-8.1Z"/></svg>'
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/vashudevan_metglobal_llp?igsh=NWJrZjQ3MTNqdTU4&utm_source=qr',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm8.7 1.5a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>'
    }
  ];

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
    input.placeholder = 'BL / Container / CTO No.';
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

  function createSocialLinks(className) {
    var wrapper = document.createElement('div');
    wrapper.className = className;
    wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;min-width:0;';

    SOCIALS.forEach(function (social) {
      var link = document.createElement('a');
      link.className = 'vmg-social-link';
      link.style.cssText = 'display:inline-flex;width:38px;height:38px;flex:0 0 38px;align-items:center;justify-content:center;box-sizing:border-box;';
      link.href = social.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', social.label);
      link.innerHTML = social.icon;
      wrapper.appendChild(link);
    });

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

  function bindMobileLegalNotices() {
    var toast = ensureToast();
    var hideTimer = null;

    document.querySelectorAll('[data-vmg-nav-legal]').forEach(function (button) {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', function () {
        toast.textContent = button.getAttribute('data-vmg-nav-legal') + ' page is being prepared and will be linked here.';
        toast.classList.add('is-visible');
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2800);
      });
    });
  }

  function enhanceNavigation() {
    var staticHeader = document.querySelector('.site-header[data-vmg-static-header="true"]');
    if (staticHeader) {
      bindTrackForms();
      return;
    }
    var header = document.querySelector('.site-header');
    var headerInner = header && header.querySelector('.header-inner');
    var logo = headerInner && headerInner.querySelector('.logo');
    var toggle = headerInner && headerInner.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    var navList = nav && nav.querySelector(':scope > ul');
    if (!header || !headerInner || !logo || !toggle || !nav || !navList) return;

    header.classList.add('vmg-econship-header');

    var oldUtility = header.querySelector('.vmg-utility-strip');
    if (oldUtility) oldUtility.remove();

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

    var logoImage = logo.querySelector('img');
    if (logoImage) {
      logoImage.src = '/assets/img/vmg-header-logo.svg';
      logoImage.alt = 'Vashudevan MetGlobal LLP logo';
      logoImage.classList.add('vmg-updated-header-logo');
    }

    var logoText = logo.querySelector('span');
    if (logoText) logoText.textContent = 'Vashudevan MetGlobal LLP';

    if (logo.parentNode !== brandRow) brandRow.appendChild(logo);

    var oldBalance = brandRow.querySelector('.vmg-nav-balance');
    if (oldBalance) oldBalance.remove();

    var desktopSocials = brandRow.querySelector('.vmg-nav-socials');
    if (!desktopSocials) {
      desktopSocials = createSocialLinks('vmg-nav-socials');
      brandRow.appendChild(desktopSocials);
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

    var oldMobileUtility = navList.querySelector('.vmg-mobile-utility-item');
    if (oldMobileUtility) oldMobileUtility.remove();

    var mobileTrackerItem = navList.querySelector('.vmg-mobile-tracker-item');
    if (!mobileTrackerItem) {
      mobileTrackerItem = document.createElement('li');
      mobileTrackerItem.className = 'vmg-mobile-tracker-item';
      mobileTrackerItem.appendChild(createTracker(true));
      navList.insertBefore(mobileTrackerItem, navList.firstChild);
    }

    var mobileSocialsItem = navList.querySelector('.vmg-mobile-socials-item');
    if (!mobileSocialsItem) {
      mobileSocialsItem = document.createElement('li');
      mobileSocialsItem.className = 'vmg-mobile-socials-item';

      var mobileLabel = document.createElement('span');
      mobileLabel.className = 'vmg-mobile-socials-label';
      mobileLabel.textContent = 'Follow VMG';
      mobileSocialsItem.appendChild(mobileLabel);
      mobileSocialsItem.appendChild(createSocialLinks('vmg-mobile-socials'));
      navList.appendChild(mobileSocialsItem);
    }

    var mobileBottomLinks = navList.querySelector('.vmg-mobile-bottom-links');
    if (!mobileBottomLinks) {
      mobileBottomLinks = document.createElement('li');
      mobileBottomLinks.className = 'vmg-mobile-bottom-links';
      mobileBottomLinks.innerHTML = [
        '<div class="vmg-mobile-bottom-links-row" aria-label="Mobile utility links">',
          '<a href="/Vashudevan-MetGlobal-Company-Profile.pdf" download="Vashudevan-MetGlobal-Company-Profile.pdf">Download Company Profile</a>',
          '<a href="/faq.html">FAQ</a>',
          '<button type="button" data-vmg-nav-legal="Privacy Policy">Privacy Policy</button>',
          '<button type="button" data-vmg-nav-legal="Terms &amp; Conditions">Terms &amp; Conditions</button>',
        '</div>'
      ].join('');
      navList.appendChild(mobileBottomLinks);
    }

    bindTrackForms();
    bindMobileLegalNotices();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceNavigation, { once: true });
  } else {
    enhanceNavigation();
  }
})();

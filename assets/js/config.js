// Configuration for client-side features
// Update contactEndpoint to your email service or serverless endpoint
// Example (Formspree): 'https://formspree.io/f/yourFormId'
// Example (custom API): 'https://api.example.com/contact'
(function(){
  window.AppConfig = window.AppConfig || {};
  // Primary Google Apps Script Web App URL (used by main contact form)
  window.AppConfig.googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxsmNbhUkhWY3hEmYof4dGi7cOEYEbMDoBSFe3erSciipp-_-tI1RKuQ7P3ms9gyYYR/exec';
  // Optional: fallback custom endpoint for JSON POSTs (kept for compatibility)
  window.AppConfig.contactEndpoint = window.AppConfig.contactEndpoint || '';
})();

// Keep the Resources navigation item site-wide without duplicating header markup across pages.
(function () {
  function ensureResourcesNav() {
    var navList = document.querySelector('#site-nav > ul');
    if (!navList || navList.querySelector('a[href="resources.html"]')) return;

    var contactLink = navList.querySelector('a[href="contact.html"]');
    if (!contactLink) return;

    var contactItem = contactLink.closest('li');
    if (!contactItem) return;

    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = 'resources.html';
    link.textContent = 'Resources';

    var path = (window.location.pathname || '').toLowerCase();
    if (path.endsWith('/resources.html') || path.endsWith('/resources')) {
      link.setAttribute('aria-current', 'page');
    }

    item.appendChild(link);
    navList.insertBefore(item, contactItem);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureResourcesNav, { once: true });
  } else {
    ensureResourcesNav();
  }
})();




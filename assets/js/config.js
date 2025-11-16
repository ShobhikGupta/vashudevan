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




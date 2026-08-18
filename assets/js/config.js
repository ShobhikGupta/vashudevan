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

// Compact the homepage market CTA on phones so the ticker gets more horizontal room.
(function(){
  if (!document || !document.head) return;

  var style = document.createElement('style');
  style.setAttribute('data-market-mobile-cta', 'true');
  style.textContent = [
    '@media (max-width: 640px) {',
    '  .market-ticker-link {',
    '    width: 84px !important;',
    '    padding-left: 8px !important;',
    '    padding-right: 7px !important;',
    '    gap: 4px !important;',
    '  }',
    '  .market-ticker-link-full {',
    '    display: inline-block;',
    '    width: 44px;',
    '    white-space: normal !important;',
    '    text-align: center;',
    '    line-height: 1.05;',
    '  }',
    '}',
    '@media (max-width: 380px) {',
    '  .market-ticker-link {',
    '    width: 80px !important;',
    '    padding-left: 6px !important;',
    '    padding-right: 6px !important;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(style);
})();




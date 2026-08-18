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
    '    width: 62px !important;',
    '    padding-left: 2px !important;',
    '    padding-right: 2px !important;',
    '    gap: 1px !important;',
    '  }',
    '  .market-ticker-link-full {',
    '    display: inline-block;',
    '    width: 38px;',
    '    white-space: normal !important;',
    '    text-align: center;',
    '    line-height: 1.02;',
    '  }',
    '}',
    '@media (max-width: 380px) {',
    '  .market-ticker-link {',
    '    width: 58px !important;',
    '    padding-left: 1px !important;',
    '    padding-right: 1px !important;',
    '  }',
    '  .market-ticker-link-full {',
    '    width: 36px;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(style);
})();

// Keep the market quotation CTA visually aligned with the Vashudevan light/orange design system.
(function(){
  if (!document || !document.head) return;

  var style = document.createElement('style');
  style.setAttribute('data-market-quotation-theme', 'true');
  style.textContent = [
    '.market-cta-section {',
    '  background: transparent !important;',
    '}',
    '.market-cta-card {',
    '  background: linear-gradient(135deg, #ffffff 0%, #fffaf1 100%) !important;',
    '  color: #0f172a !important;',
    '  border: 1px solid rgba(15, 23, 42, 0.10) !important;',
    '  border-radius: 12px !important;',
    '  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08) !important;',
    '}',
    '.market-cta-icon {',
    '  background: rgba(255, 165, 0, 0.10) !important;',
    '  border: 1px solid rgba(255, 165, 0, 0.26) !important;',
    '  color: #E69500 !important;',
    '  box-shadow: none !important;',
    '}',
    '.market-cta-icon svg,',
    '.market-cta-icon svg path {',
    '  fill: currentColor !important;',
    '}',
    '.market-cta-copy h2 {',
    '  color: #0f172a !important;',
    '}',
    '.market-cta-copy p {',
    '  color: #475569 !important;',
    '}',
    '.market-cta-button {',
    '  background: linear-gradient(135deg, #FFA500 0%, #E69500 100%) !important;',
    '  color: #ffffff !important;',
    '  border: 0 !important;',
    '  box-shadow: 0 8px 20px rgba(255, 165, 0, 0.24) !important;',
    '  text-decoration: none !important;',
    '}',
    '.market-cta-button:hover,',
    '.market-cta-button:focus-visible {',
    '  background: linear-gradient(135deg, #E69500 0%, #CC8400 100%) !important;',
    '  color: #ffffff !important;',
    '  box-shadow: 0 12px 26px rgba(255, 165, 0, 0.30) !important;',
    '}',
    '@media (max-width: 640px) {',
    '  .market-cta-card {',
    '    padding: 22px 18px !important;',
    '    border-radius: 10px !important;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(style);
})();




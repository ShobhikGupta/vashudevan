(function () {
  'use strict';

  var PUBLIC_PATHS = [
    '/',
    '/index.html',
    '/who-we-are.html',
    '/our-impact.html',
    '/products.html',
    '/product.html',
    '/resources.html',
    '/faq.html',
    '/contact.html',
    '/privacy-policy.html',
    '/disclaimer.html',
    '/market-prices',
    '/market-prices/',
    '/market-prices/index.html'
  ];

  var PAGE_PATH = window.location.pathname || '/';
  if (PUBLIC_PATHS.indexOf(PAGE_PATH) === -1) return;

  var PAGE_TITLE = document.title || '';
  var debugEnabled =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  var SAFE_KEYS = {
    page_path: true,
    page_title: true,
    section_id: true,
    section_name: true,
    link_text: true,
    link_url: true,
    cta_location: true,
    product_category: true,
    resource_type: true,
    form_type: true,
    tab_name: true,
    faq_category: true,
    faq_question: true,
    outbound_domain: true,
    nav_location: true,
    card_location: true,
    file_name: true,
    selected_category: true,
    selected_benchmark: true,
    link_type: true,
    channel: true
  };

  var clickEventNames = new WeakMap();
  var startedForms = new WeakSet();

  function cleanText(value, maxLength) {
    if (value === null || value === undefined) return '';
    var text = String(value).replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.slice(0, maxLength || 180);
  }

  function safeParams(params) {
    var output = {
      page_path: PAGE_PATH,
      page_title: cleanText(PAGE_TITLE, 180)
    };

    Object.keys(params || {}).forEach(function (key) {
      if (!SAFE_KEYS[key]) return;
      var value = params[key];
      if (value === null || value === undefined || value === '') return;
      output[key] = typeof value === 'string'
        ? cleanText(value, key === 'faq_question' ? 220 : 180)
        : value;
    });

    return output;
  }

  window.vmgTrackEvent = function (eventName, params) {
    if (!/^[a-z0-9_]+$/.test(eventName || '')) return;

    var payload = safeParams(params || {});

    if (debugEnabled && window.console && typeof window.console.log === 'function') {
      window.console.log('[VMG Analytics]', eventName, payload);
    }

    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, payload);
  };

  function emitClickEvent(clickEvent, eventName, params) {
    if (!clickEvent || !eventName) return;
    var emitted = clickEventNames.get(clickEvent);
    if (!emitted) {
      emitted = new Set();
      clickEventNames.set(clickEvent, emitted);
    }
    if (emitted.has(eventName)) return;
    emitted.add(eventName);
    window.vmgTrackEvent(eventName, params || {});
  }

  function elementText(el) {
    if (!el || !el.getAttribute) return '';
    return cleanText(
      el.getAttribute('data-ga-label') ||
      el.getAttribute('aria-label') ||
      el.textContent || '',
      180
    );
  }

  function hrefValue(el) {
    if (!el || !el.getAttribute) return '';
    return el.getAttribute('href') || '';
  }

  function outboundMeta(el) {
    var href = hrefValue(el);
    if (!href) return null;

    if (/^mailto:/i.test(href)) {
      return { outbound_domain: 'mailto', link_type: 'email', channel: 'email' };
    }
    if (/^tel:/i.test(href)) {
      return { outbound_domain: 'tel', link_type: 'phone', channel: 'phone' };
    }

    try {
      var url = new URL(href, window.location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

      var host = url.hostname.toLowerCase();
      var currentHost = window.location.hostname.toLowerCase();
      if (host === currentHost || host === 'www.' + currentHost || 'www.' + host === currentHost) return null;

      var channel = 'external';
      if (host === 'wa.me' || host.indexOf('whatsapp.com') !== -1) channel = 'whatsapp';
      else if (host.indexOf('linkedin.com') !== -1) channel = 'linkedin';
      else if (host.indexOf('facebook.com') !== -1) channel = 'facebook';
      else if (host.indexOf('instagram.com') !== -1) channel = 'instagram';
      else if (host.indexOf('dnb.com') !== -1 || host.indexOf('dnb.co') !== -1) channel = 'duns';

      return {
        outbound_domain: host,
        link_type: channel === 'external' ? 'external' : channel,
        channel: channel
      };
    } catch (err) {
      return null;
    }
  }

  function safeOutboundLabel(el, meta) {
    if (!meta) return '';
    if (meta.channel === 'email') return 'Email';
    if (meta.channel === 'phone') return 'Phone';
    if (meta.channel === 'whatsapp') return 'WhatsApp';
    return elementText(el);
  }

  function safeLinkUrl(el) {
    var href = hrefValue(el);
    if (!href || /^(mailto:|tel:|javascript:)/i.test(href) || href.charAt(0) === '#') return '';

    try {
      var url = new URL(href, window.location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';

      // WhatsApp paths can contain phone numbers. Never send them to GA.
      if (url.hostname.toLowerCase() === 'wa.me' || url.hostname.toLowerCase().indexOf('whatsapp.com') !== -1) {
        return url.origin;
      }
      return url.origin + url.pathname;
    } catch (err) {
      return '';
    }
  }

  function nearestSectionName(el) {
    if (!el || !el.closest) return '';
    var section = el.closest('[data-ga-section], section, footer, header, main');
    if (!section) return '';

    var explicit = section.getAttribute && section.getAttribute('data-ga-section');
    if (explicit) return cleanText(explicit, 120);
    if (section.matches('footer')) return 'Footer';
    if (section.matches('header')) return 'Header';

    var heading = section.querySelector && section.querySelector('h1, h2, h3');
    if (heading) return cleanText(heading.textContent, 120);
    if (section.id) return cleanText(section.id.replace(/[-_]+/g, ' '), 120);
    return '';
  }

  function ctaLocation(el) {
    if (!el || !el.closest) return '';
    if (el.closest('.site-header')) {
      return el.closest('.vmg-mobile-tracker-item, .vmg-mobile-feedback-item, .vmg-mobile-socials-item, .vmg-mobile-bottom-links')
        ? 'mobile_menu'
        : 'header';
    }
    if (el.closest('.site-footer, .vmg-global-footer')) return 'footer';
    if (el.closest('.home-hero, .hero-carousel, .res-hero, .faq-hero, .page-hero, .legal-hero')) return 'hero';
    if (el.closest('.vmg-help')) return 'need_help';

    var sectionName = nearestSectionName(el);
    return sectionName
      ? sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
      : '';
  }

  function inferFormType(form) {
    if (!form) return 'unknown';
    var explicit = form.getAttribute && form.getAttribute('data-ga-form-type');
    if (explicit) return cleanText(explicit, 80);

    if (form.matches('[data-vmg-track-form]')) return 'track_shipment';
    if (form.closest('#vmg-feedback-drawer, .vmg-feedback-drawer') || /feedback/i.test((form.id || '') + ' ' + (form.className || ''))) return 'feedback';
    if (/newsletter|subscribe|trade-update/i.test((form.id || '') + ' ' + (form.className || '') + ' ' + (form.getAttribute('name') || ''))) return 'newsletter';
    if (form.id === 'contact-form' || PAGE_PATH === '/contact.html') return 'contact';
    return 'general';
  }

  function productCategoryFrom(el) {
    var explicit = el && el.getAttribute && (el.getAttribute('data-ga-category') || el.getAttribute('data-product-category'));
    if (explicit) return cleanText(explicit, 100);

    var container = el && el.closest('.product, .product-card, .home-product-tile, .card.product, figure, article, [data-product]');
    var text = cleanText((container && container.textContent) || elementText(el), 240).toLowerCase();
    var categories = [
      ['aluminium', 'Aluminium'],
      ['aluminum', 'Aluminium'],
      ['copper bearing', 'Copper Bearing'],
      ['copper-bearing', 'Copper Bearing'],
      ['stainless steel', 'Stainless Steel'],
      ['auto scrap', 'Auto Scrap'],
      ['automobile', 'Auto Scrap'],
      ['shredder', 'Shredder Scrap'],
      ['copper', 'Copper'],
      ['brass', 'Brass'],
      ['ferrous', 'Ferrous'],
      ['lead', 'Lead'],
      ['zinc', 'Zinc']
    ];

    for (var i = 0; i < categories.length; i += 1) {
      if (text.indexOf(categories[i][0]) !== -1) return categories[i][1];
    }
    return '';
  }

  function resourceTypeFrom(el) {
    var explicit = el && el.getAttribute && el.getAttribute('data-ga-resource-type');
    if (explicit) return cleanText(explicit, 100);
    var card = el && el.closest('.hub-card, .doc-card, .resource-card, article');
    var heading = card && card.querySelector('h2, h3');
    return cleanText((heading && heading.textContent) || elementText(el), 120);
  }

  function faqMeta(el) {
    var item = el && el.closest('.faq-item');
    var group = el && el.closest('.faq-group');
    var groupTitle = group && group.querySelector('.faq-group-title, h2');
    var question = elementText(el);

    if (!question && item) {
      var trigger = item.querySelector('.faq-trigger, summary');
      question = cleanText(trigger && trigger.textContent, 220);
    }

    return {
      faq_category: cleanText((groupTitle && groupTitle.textContent) || (group && group.id) || '', 120),
      faq_question: cleanText(question, 220)
    };
  }

  function setAttr(el, name, value) {
    if (!el || !value || el.hasAttribute(name)) return;
    el.setAttribute(name, value);
  }

  function markEvent(el, eventName, attrs) {
    if (!el) return;
    setAttr(el, 'data-ga-event', eventName);
    Object.keys(attrs || {}).forEach(function (key) {
      setAttr(el, 'data-ga-' + key, attrs[key]);
    });
  }

  function setSection(selector, name, root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(selector).forEach(function (el) {
      setAttr(el, 'data-ga-section', name);
    });
  }

  function annotateDom(root) {
    var scope = root && root.querySelectorAll ? root : document;

    // Important section names used by section_view and CTA location metadata.
    setSection('.home-hero, .hero-carousel, .res-hero, .faq-hero, .page-hero, .legal-hero', 'Hero', scope);
    setSection('.market-ticker-strip', 'Market Ticker', scope);
    setSection('.home-about', 'About Preview', scope);
    setSection('.home-profile, .company-profile-card', 'Company Profile', scope);
    setSection('.home-trade-desk, .quick-enquiry, .enquiry-cards', 'Quick Enquiry Cards', scope);
    setSection('.home-process, .process-section', 'Process', scope);
    setSection('.home-products, #main-products-grid, #subproducts-grid', PAGE_PATH === '/index.html' || PAGE_PATH === '/' ? 'Products Preview' : 'Product Categories', scope);
    setSection('.home-impact', 'Sustainability', scope);
    setSection('.home-utility--market, .market-strip', 'Market Teaser', scope);
    setSection('.home-utility--resources', 'Resources Teaser', scope);
    setSection('#locations, .locations, .contact-info-left', 'Locations', scope);
    setSection('.home-final-cta, .final-cta, .faq-bottom-cta, .market-cta-section', 'Final CTA', scope);
    setSection('.hub-shell, #resource-hub', 'Resource Hub', scope);
    setSection('.docs-grid, .documentation-support', 'Documentation Support', scope);
    setSection('.contact-layout, .contact-form-container', 'Contact Forms', scope);
    setSection('.faq-group, .faq-section', 'FAQ', scope);
    setSection('footer.site-footer, footer.vmg-global-footer', 'Footer', scope);
    setSection('.market-dashboard-section', 'Market Overview', scope);
    setSection('.market-chart-section', 'Market Chart', scope);
    setSection('.legal-content', 'Policy Content', scope);

    scope.querySelectorAll('.site-nav a[href]').forEach(function (link) {
      markEvent(link, 'nav_click', { section: 'Header' });
    });

    scope.querySelectorAll('.overlay-ctas a, .res-hero a, .faq-hero a, .page-hero a, .legal-hero a').forEach(function (link) {
      markEvent(link, 'hero_cta_click', { section: 'Hero' });
    });

    scope.querySelectorAll('.home-about a').forEach(function (link) {
      markEvent(link, 'about_cta_click', { section: 'About Preview' });
    });

    scope.querySelectorAll('a[href*="Vashudevan-MetGlobal-Company-Profile.pdf"]').forEach(function (link) {
      var isDownload = link.hasAttribute('download') || /download/i.test(elementText(link));
      markEvent(link, isDownload ? 'company_profile_download' : 'company_profile_preview', {
        section: nearestSectionName(link) || 'Company Profile',
        'file-name': 'Vashudevan-MetGlobal-Company-Profile.pdf'
      });
    });

    scope.querySelectorAll('.home-product-tile a, .products-grid a, .card.product a, .product-card a, a[href*="product.html?slug="]').forEach(function (link) {
      var category = productCategoryFrom(link);
      if (!category) return;
      markEvent(link, 'product_category_click', {
        category: category,
        section: PAGE_PATH === '/' || PAGE_PATH === '/index.html' ? 'Products Preview' : 'Product Categories',
        'card-location': PAGE_PATH === '/' || PAGE_PATH === '/index.html' ? 'homepage' : 'products_page'
      });
    });

    scope.querySelectorAll('.home-products-cta a').forEach(function (link) {
      markEvent(link, 'view_more_products_click', { section: 'Products Preview' });
    });

    scope.querySelectorAll('.market-ticker-link, a[href="/market-prices"], a[href="/market-prices/"]').forEach(function (link) {
      if (link.closest('.site-nav')) return;
      markEvent(link, link.closest('.market-ticker-strip') ? 'market_reference_click' : 'market_reference_click', {
        section: nearestSectionName(link) || 'Market Teaser'
      });
    });

    scope.querySelectorAll('a[href="/resources.html"], a[href="resources.html"], a[href^="/resources.html#"], a[href^="resources.html#"]').forEach(function (link) {
      if (link.closest('.site-nav') || PAGE_PATH === '/resources.html') return;
      markEvent(link, 'resources_cta_click', { section: nearestSectionName(link) || 'Resources Teaser' });
    });

    scope.querySelectorAll('.home-trade-desk a, .quick-enquiry a, .enquiry-card a').forEach(function (link) {
      markEvent(link, 'enquiry_card_click', { section: 'Quick Enquiry Cards' });
    });

    scope.querySelectorAll('.hub-tab').forEach(function (tab) {
      markEvent(tab, 'resource_tab_click', {
        section: 'Resource Hub',
        'tab-name': elementText(tab)
      });
    });

    scope.querySelectorAll('.hub-card a, .hub-card button, .resource-card a, .resource-card button').forEach(function (el) {
      markEvent(el, 'resource_card_click', {
        section: 'Resource Hub',
        'resource-type': resourceTypeFrom(el)
      });
    });

    scope.querySelectorAll('.doc-card a, .doc-card button').forEach(function (el) {
      markEvent(el, 'documentation_card_click', {
        section: 'Documentation Support',
        'resource-type': resourceTypeFrom(el)
      });
    });

    scope.querySelectorAll('.faq-category-nav a').forEach(function (link) {
      markEvent(link, 'faq_category_click', {
        section: 'FAQ',
        'faq-category': elementText(link)
      });
    });

    scope.querySelectorAll('.faq-trigger, .faq-item summary').forEach(function (trigger) {
      var meta = faqMeta(trigger);
      markEvent(trigger, 'faq_question_open', {
        section: 'FAQ',
        'faq-category': meta.faq_category,
        'faq-question': meta.faq_question
      });
    });

    scope.querySelectorAll('.home-final-cta a, .final-cta a, .faq-bottom-cta a, .market-cta-section a').forEach(function (link) {
      markEvent(link, 'final_cta_click', { section: 'Final CTA' });
    });

    scope.querySelectorAll('footer.site-footer a, footer.vmg-global-footer a').forEach(function (link) {
      markEvent(link, 'footer_link_click', { section: 'Footer' });
    });

    scope.querySelectorAll('a[href*="contact.html"], a[href="/contact.html"]').forEach(function (link) {
      if (link.closest('.site-nav, footer.site-footer, footer.vmg-global-footer')) return;
      if (!link.hasAttribute('data-ga-event')) {
        markEvent(link, 'contact_cta_click', { section: nearestSectionName(link) || 'Contact' });
      }
    });

    scope.querySelectorAll('.vmg-help-trigger').forEach(function (button) {
      markEvent(button, 'need_help_open', { section: 'Need Help' });
    });
    scope.querySelectorAll('.vmg-help-menu a, .vmg-help-menu button').forEach(function (option) {
      markEvent(option, 'need_help_option_click', { section: 'Need Help' });
    });

    scope.querySelectorAll('[data-vmg-track-form]').forEach(function (form) {
      setAttr(form, 'data-ga-form-type', 'track_shipment');
    });
    scope.querySelectorAll('#contact-form').forEach(function (form) {
      setAttr(form, 'data-ga-form-type', 'contact');
    });
    scope.querySelectorAll('[data-vmg-subscribe-form]').forEach(function (form) {
      setAttr(form, 'data-ga-form-type', 'newsletter');
    });

    if (PAGE_PATH.indexOf('/market-prices') === 0) {
      scope.querySelectorAll('[data-market-overview-group], [data-chart-group]').forEach(function (control) {
        var value = control.getAttribute('data-market-overview-group') || control.getAttribute('data-chart-group') || elementText(control);
        markEvent(control, 'market_category_toggle', {
          section: 'Market',
          'selected-category': cleanText(value, 100)
        });
      });

      scope.querySelectorAll('#market-chart-benchmark-list [role="option"], #market-chart-benchmark-list button, #market-chart-benchmark-list li').forEach(function (option) {
        markEvent(option, 'market_benchmark_change', {
          section: 'Market',
          benchmark: elementText(option)
        });
      });

      scope.querySelectorAll('.market-cta-button').forEach(function (link) {
        markEvent(link, 'market_contact_click', { section: 'Final CTA' });
      });
    }
  }

  function dataAttributeParams(el, eventName) {
    var params = {
      section_name: el.getAttribute('data-ga-section') || nearestSectionName(el),
      cta_location: ctaLocation(el),
      product_category: el.getAttribute('data-ga-category') || '',
      resource_type: el.getAttribute('data-ga-resource-type') || '',
      form_type: el.getAttribute('data-ga-form-type') || '',
      tab_name: el.getAttribute('data-ga-tab-name') || '',
      faq_category: el.getAttribute('data-ga-faq-category') || '',
      faq_question: el.getAttribute('data-ga-faq-question') || '',
      card_location: el.getAttribute('data-ga-card-location') || '',
      file_name: el.getAttribute('data-ga-file-name') || '',
      selected_category: el.getAttribute('data-ga-selected-category') || '',
      selected_benchmark: el.getAttribute('data-ga-benchmark') || ''
    };

    if (eventName !== 'outbound_link_click') {
      params.link_text = elementText(el);
      params.link_url = safeLinkUrl(el);
    }
    return params;
  }

  function trackDataAttributeClick(clickEvent, target) {
    var el = target.closest('[data-ga-event]');
    if (!el) return;
    var eventName = el.getAttribute('data-ga-event');

    // FAQ open events fire only on the transition from closed -> open.
    if (eventName === 'faq_question_open') {
      var opening = el.matches('.faq-trigger')
        ? el.getAttribute('aria-expanded') !== 'true'
        : !(el.closest('details') && el.closest('details').open);
      if (!opening) return;
    }

    emitClickEvent(clickEvent, eventName, dataAttributeParams(el, eventName));
  }

  function trackPdfAction(clickEvent, target) {
    var link = target.closest('a[href*="Vashudevan-MetGlobal-Company-Profile.pdf"]');
    if (!link) return;

    var isDownload = link.hasAttribute('download') || /download/i.test(elementText(link));
    var eventName = isDownload ? 'company_profile_download' : 'company_profile_preview';
    emitClickEvent(clickEvent, eventName, {
      cta_location: ctaLocation(link),
      file_name: 'Vashudevan-MetGlobal-Company-Profile.pdf'
    });

    if (PAGE_PATH.indexOf('/market-prices') === 0 && isDownload) {
      emitClickEvent(clickEvent, 'market_profile_download', {
        cta_location: ctaLocation(link),
        file_name: 'Vashudevan-MetGlobal-Company-Profile.pdf'
      });
    }
  }

  function trackOutbound(clickEvent, target) {
    var link = target.closest('a[href]');
    if (!link) return;
    var meta = outboundMeta(link);
    if (!meta) return;

    emitClickEvent(clickEvent, 'outbound_link_click', {
      link_text: safeOutboundLabel(link, meta),
      outbound_domain: meta.outbound_domain,
      link_type: meta.link_type,
      channel: meta.channel,
      cta_location: ctaLocation(link)
    });
  }

  function trackAdditionalBusinessEvents(clickEvent, target) {
    var el = target.closest('a, button');
    if (!el) return;
    var href = hrefValue(el).toLowerCase();

    if (el.closest('.home-final-cta, .final-cta, .faq-bottom-cta, .market-cta-section')) {
      emitClickEvent(clickEvent, 'final_cta_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: 'final_cta'
      });
    }

    if ((href.indexOf('contact.html') !== -1 || href === '/contact.html') && !el.closest('.site-nav, footer.site-footer, footer.vmg-global-footer')) {
      emitClickEvent(clickEvent, 'contact_cta_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });
    }

    if (PAGE_PATH.indexOf('/market-prices') === 0 && el.closest('.market-cta-button')) {
      emitClickEvent(clickEvent, 'market_contact_click', {
        link_text: elementText(el),
        cta_location: 'final_cta'
      });
    }

    if (el.closest('.home-trade-desk, .quick-enquiry, .enquiry-card')) {
      emitClickEvent(clickEvent, 'enquiry_card_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });
    }

    if (el.matches('a') && el.closest('footer.site-footer, footer.vmg-global-footer')) {
      emitClickEvent(clickEvent, 'footer_link_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        section_name: 'Footer'
      });
    }

    var trackButton = target.closest('[data-vmg-track-form] .vmg-track-button, .vmg-track-button');
    if (trackButton) {
      emitClickEvent(clickEvent, 'track_shipment_click', {
        cta_location: ctaLocation(trackButton)
      });
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    trackDataAttributeClick(event, target);
    trackPdfAction(event, target);
    trackOutbound(event, target);
    trackAdditionalBusinessEvents(event, target);
  }, true);

  document.addEventListener('focusin', function (event) {
    var form = event.target && event.target.closest && event.target.closest('form');
    if (!form || startedForms.has(form)) return;

    var formType = inferFormType(form);
    if (formType === 'track_shipment') return;

    startedForms.add(form);
    window.vmgTrackEvent('form_start', {
      form_type: formType,
      cta_location: ctaLocation(form)
    });
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    var formType = inferFormType(form);
    if (formType === 'track_shipment') return;

    window.vmgTrackEvent('form_submit_attempt', {
      form_type: formType,
      cta_location: ctaLocation(form)
    });
  }, true);

  function observeResultElement(statusEl, form) {
    if (!statusEl || !form || !('MutationObserver' in window)) return;
    var lastState = '';

    function readState() {
      var className = ' ' + (statusEl.className || '') + ' ';
      var nextState = '';
      if (/\bis-success\b|\bsuccess\b/.test(className)) nextState = 'success';
      else if (/\bis-error\b|\berror\b/.test(className)) nextState = 'error';

      if (!nextState) {
        lastState = '';
        return;
      }
      if (nextState === lastState) return;
      lastState = nextState;

      window.vmgTrackEvent(nextState === 'success' ? 'form_success' : 'form_error', {
        form_type: inferFormType(form),
        cta_location: ctaLocation(form)
      });
    }

    new MutationObserver(readState).observe(statusEl, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function initFormResultTracking() {
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
      observeResultElement(document.getElementById('form-result'), contactForm);
    }

    document.querySelectorAll('[data-vmg-subscribe-form]').forEach(function (form) {
      observeResultElement(form.querySelector('.vmg-footer-subscribe-status'), form);
    });
  }

  function mapSectionName(section) {
    if (!section) return '';
    var explicit = section.getAttribute && section.getAttribute('data-ga-section');
    if (explicit) {
      if (explicit === 'FAQ' && section.classList.contains('faq-group')) {
        var title = section.querySelector('.faq-group-title, h2');
        return title ? 'FAQ - ' + cleanText(title.textContent, 90) : 'FAQ';
      }
      return explicit;
    }

    var heading = section.querySelector && section.querySelector('h1, h2, h3');
    return cleanText((heading && heading.textContent) || section.id || '', 120);
  }

  function sectionIsTrackable(section) {
    if (!section || !section.getBoundingClientRect) return false;
    var style = window.getComputedStyle(section);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return false;
    if (section.closest('[hidden]')) return false;
    if (section.matches('.hub-panel:not(.active)')) return false;
    return true;
  }

  function enoughSectionIsVisible(entry) {
    if (!entry.isIntersecting) return false;
    var visiblePixels = entry.intersectionRect && entry.intersectionRect.height ? entry.intersectionRect.height : 0;
    var pixelTarget = Math.min(220, Math.max(100, window.innerHeight * 0.25));
    return entry.intersectionRatio >= 0.25 || visiblePixels >= pixelTarget;
  }

  function initSectionTracking() {
    if (!('IntersectionObserver' in window)) return;

    var seen = new Set();
    var sections = [];
    document.querySelectorAll('[data-ga-section], main > section, .faq-group, footer.site-footer, footer.vmg-global-footer').forEach(function (section) {
      if (sections.indexOf(section) === -1) sections.push(section);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!enoughSectionIsVisible(entry) || !sectionIsTrackable(entry.target)) return;

        var name = mapSectionName(entry.target);
        if (!name) return;
        var key = (entry.target.id || name) + '::' + name;
        if (seen.has(key)) return;

        seen.add(key);
        window.vmgTrackEvent('section_view', {
          section_id: entry.target.id || '',
          section_name: name
        });
        observer.unobserve(entry.target);
      });
    }, {
      threshold: [0, 0.1, 0.25, 0.5]
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initDynamicAnnotations() {
    if (!('MutationObserver' in window)) return;
    var queued = false;
    var observer = new MutationObserver(function (mutations) {
      if (queued) return;
      var hasAddedNodes = mutations.some(function (mutation) {
        return mutation.addedNodes && mutation.addedNodes.length;
      });
      if (!hasAddedNodes) return;

      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        annotateDom(document);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function initMarketPageView() {
    if (PAGE_PATH.indexOf('/market-prices') !== 0) return;
    window.vmgTrackEvent('market_page_view', {
      section_name: 'Market'
    });
  }

  function init() {
    annotateDom(document);
    initSectionTracking();
    initFormResultTracking();
    initDynamicAnnotations();
    initMarketPageView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

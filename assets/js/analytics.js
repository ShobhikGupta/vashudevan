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

  function normalizedPath() {
    return window.location.pathname || '/';
  }

  if (PUBLIC_PATHS.indexOf(normalizedPath()) === -1) {
    return;
  }

  var PAGE_PATH = normalizedPath();
  var PAGE_TITLE = document.title || '';
  var debugEnabled =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.localStorage.getItem('vmgAnalyticsDebug') === '1';

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

  function cleanText(value, maxLength) {
    if (value === null || value === undefined) return '';
    var text = String(value).replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.slice(0, maxLength || 180);
  }

  function safeParams(params) {
    var out = {
      page_path: PAGE_PATH,
      page_title: cleanText(PAGE_TITLE, 180)
    };

    Object.keys(params || {}).forEach(function (key) {
      if (!SAFE_KEYS[key]) return;
      var value = params[key];
      if (value === null || value === undefined || value === '') return;
      out[key] = typeof value === 'string' ? cleanText(value, key === 'faq_question' ? 220 : 180) : value;
    });

    return out;
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

  function elementText(el) {
    if (!el) return '';
    return cleanText(el.getAttribute('data-ga-label') || el.getAttribute('aria-label') || el.textContent || '', 180);
  }

  function hrefValue(el) {
    if (!el || !el.getAttribute) return '';
    return el.getAttribute('href') || '';
  }

  function safeLinkUrl(el) {
    var href = hrefValue(el);
    if (!href) return '';

    if (/^(mailto:|tel:)/i.test(href)) {
      return '';
    }

    try {
      var url = new URL(href, window.location.href);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.origin + url.pathname;
      }
    } catch (err) {
      return cleanText(href.split('?')[0].split('#')[0], 180);
    }

    return cleanText(href.split('?')[0].split('#')[0], 180);
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

      var channel = '';
      if (host === 'wa.me' || host.indexOf('whatsapp.com') !== -1) channel = 'whatsapp';
      else if (host.indexOf('linkedin.com') !== -1) channel = 'linkedin';
      else if (host.indexOf('facebook.com') !== -1) channel = 'facebook';
      else if (host.indexOf('instagram.com') !== -1) channel = 'instagram';
      else if (host.indexOf('dnb.com') !== -1 || host.indexOf('dnb.co') !== -1) channel = 'duns';

      return {
        outbound_domain: host,
        link_type: channel || 'external',
        channel: channel || 'external'
      };
    } catch (err) {
      return null;
    }
  }

  function nearestSectionName(el) {
    if (!el) return '';
    var section = el.closest('[data-ga-section], section, footer, header, main');
    if (!section) return '';

    var explicit = section.getAttribute && section.getAttribute('data-ga-section');
    if (explicit) return cleanText(explicit, 120);

    if (section.matches('footer')) return 'Footer';
    if (section.matches('header')) return 'Header';

    var heading = section.querySelector('h1, h2, h3');
    if (heading) return cleanText(heading.textContent, 120);

    if (section.id) return cleanText(section.id.replace(/[-_]+/g, ' '), 120);
    return '';
  }

  function ctaLocation(el) {
    if (!el) return '';
    if (el.closest('.site-header')) return el.closest('.vmg-mobile-tracker-item, .vmg-mobile-feedback-item, .vmg-mobile-socials-item') ? 'mobile_menu' : 'header';
    if (el.closest('.site-footer, .vmg-global-footer')) return 'footer';
    if (el.closest('.home-hero, .hero-carousel, .res-hero, .faq-hero, .page-hero')) return 'hero';
    if (el.closest('.vmg-help')) return 'need_help';
    var sectionName = nearestSectionName(el);
    return sectionName ? sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') : '';
  }

  function inferFormType(form) {
    if (!form) return 'unknown';

    if (form.matches('[data-vmg-track-form]')) return 'track_shipment';
    if (form.closest('#vmg-feedback-drawer, .vmg-feedback-drawer') || /feedback/i.test(form.id || '') || /feedback/i.test(form.className || '')) return 'feedback';
    if (/newsletter|subscribe|trade-update/i.test((form.id || '') + ' ' + (form.className || '') + ' ' + (form.getAttribute('name') || ''))) return 'newsletter';

    var context = ((form.id || '') + ' ' + (form.className || '') + ' ' + (form.getAttribute('name') || '') + ' ' + ctaLocation(form)).toLowerCase();
    if (/buy|requirement/.test(context)) return 'buy_requirement';
    if (/supplier|supply/.test(context)) return 'supplier_enquiry';
    if (/material|offer/.test(context)) return 'material_offer';
    if (/partner/.test(context)) return 'partnership_enquiry';
    if (/contact|vmg-desk|enquiry|inquiry/.test(context) || PAGE_PATH === '/contact.html') return 'contact';

    return 'general';
  }

  function productCategoryFrom(el) {
    var explicit = el && el.getAttribute && (el.getAttribute('data-ga-category') || el.getAttribute('data-product-category'));
    if (explicit) return cleanText(explicit, 100);

    var container = el && el.closest('.product, .product-card, .home-product-tile, .card.product, figure, article, [data-product]');
    var text = cleanText((container && container.textContent) || elementText(el), 220).toLowerCase();

    var categories = [
      ['aluminium', 'Aluminium'],
      ['aluminum', 'Aluminium'],
      ['copper bearing', 'Copper Bearing'],
      ['copper-bearing', 'Copper Bearing'],
      ['copper', 'Copper'],
      ['brass', 'Brass'],
      ['zinc', 'Zinc'],
      ['stainless steel', 'Stainless Steel'],
      ['ferrous', 'Ferrous'],
      ['lead', 'Lead'],
      ['auto scrap', 'Auto Scrap'],
      ['automobile', 'Auto Scrap'],
      ['shredder', 'Shredder Scrap']
    ];

    for (var i = 0; i < categories.length; i += 1) {
      if (text.indexOf(categories[i][0]) !== -1) return categories[i][1];
    }

    return cleanText((container && container.querySelector('h2,h3,figcaption') && container.querySelector('h2,h3,figcaption').textContent) || '', 100);
  }

  function resourceTypeFrom(el) {
    var explicit = el && el.getAttribute && el.getAttribute('data-ga-resource-type');
    if (explicit) return cleanText(explicit, 100);

    var card = el && el.closest('.hub-card, .doc-card, .resource-card, article');
    var heading = card && card.querySelector('h2,h3');
    return cleanText((heading && heading.textContent) || elementText(el), 120);
  }

  function faqMeta(el) {
    var item = el && el.closest('.faq-item');
    var group = el && el.closest('.faq-group');
    var groupTitle = group && group.querySelector('.faq-group-title, h2');
    var question = cleanText(elementText(el), 220);

    if (!question && item) {
      var trigger = item.querySelector('.faq-trigger, summary');
      question = cleanText(trigger && trigger.textContent, 220);
    }

    return {
      faq_category: cleanText((groupTitle && groupTitle.textContent) || (group && group.id) || '', 120),
      faq_question: question
    };
  }

  function trackDataAttributeClick(target) {
    var el = target.closest('[data-ga-event]');
    if (!el) return false;

    var params = {
      link_text: elementText(el),
      link_url: safeLinkUrl(el),
      section_name: el.getAttribute('data-ga-section') || nearestSectionName(el),
      cta_location: ctaLocation(el),
      product_category: el.getAttribute('data-ga-category') || '',
      resource_type: el.getAttribute('data-ga-resource-type') || '',
      form_type: el.getAttribute('data-ga-form-type') || '',
      tab_name: el.getAttribute('data-ga-tab-name') || ''
    };

    window.vmgTrackEvent(el.getAttribute('data-ga-event'), params);
    return true;
  }

  function trackNavClick(target) {
    var link = target.closest('.site-nav a');
    if (!link) return;

    window.vmgTrackEvent('nav_click', {
      link_text: elementText(link),
      link_url: safeLinkUrl(link),
      nav_location: link.closest('.vmg-mobile-tracker-item, .vmg-mobile-feedback-item, .vmg-mobile-socials-item, .vmg-mobile-bottom-links') ? 'mobile_menu' : 'header'
    });
  }

  function trackHeroClick(target) {
    var el = target.closest('.home-hero a, .home-hero button, .hero-carousel a, .hero-carousel button, .res-hero a, .faq-hero a, .page-hero a');
    if (!el) return;

    window.vmgTrackEvent('hero_cta_click', {
      link_text: elementText(el),
      link_url: safeLinkUrl(el),
      cta_location: 'hero'
    });
  }

  function trackPdfAction(target) {
    var link = target.closest('a[href*="Vashudevan-MetGlobal-Company-Profile.pdf"]');
    if (!link) return;

    var isDownload = link.hasAttribute('download') || /download/i.test(elementText(link));
    var eventName = isDownload ? 'company_profile_download' : 'company_profile_preview';

    window.vmgTrackEvent(eventName, {
      link_text: elementText(link),
      cta_location: ctaLocation(link),
      file_name: 'Vashudevan-MetGlobal-Company-Profile.pdf'
    });

    if (PAGE_PATH.indexOf('/market-prices') === 0 && isDownload) {
      window.vmgTrackEvent('market_profile_download', {
        cta_location: ctaLocation(link),
        file_name: 'Vashudevan-MetGlobal-Company-Profile.pdf'
      });
    }
  }

  function trackProductClick(target) {
    var el = target.closest(
      '.home-product-tile a, .products-grid a, .card.product a, .product-card a, a[href*="products.html#"], a[href*="product.html?"]'
    );
    if (!el) return;

    var category = productCategoryFrom(el);
    if (!category) return;

    window.vmgTrackEvent('product_category_click', {
      product_category: category,
      link_text: elementText(el),
      link_url: safeLinkUrl(el),
      card_location: PAGE_PATH === '/' || PAGE_PATH === '/index.html' ? 'homepage' : 'products_page'
    });
  }

  function trackResourceClick(target) {
    var tab = target.closest('.hub-tab');
    if (tab) {
      window.vmgTrackEvent('resource_tab_click', {
        tab_name: elementText(tab),
        section_name: 'Resource Hub'
      });
      return;
    }

    var doc = target.closest('.doc-card a, .doc-card button');
    if (doc) {
      window.vmgTrackEvent('documentation_card_click', {
        resource_type: resourceTypeFrom(doc),
        link_text: elementText(doc),
        section_name: 'Documentation Support'
      });
      return;
    }

    var card = target.closest('.hub-card a, .hub-card button, .resource-card a, .resource-card button');
    if (card) {
      window.vmgTrackEvent('resource_card_click', {
        resource_type: resourceTypeFrom(card),
        link_text: elementText(card),
        section_name: 'Resource Hub'
      });
    }
  }

  function trackFaqClick(target) {
    var categoryLink = target.closest('.faq-category-nav a');
    if (categoryLink) {
      window.vmgTrackEvent('faq_category_click', {
        faq_category: elementText(categoryLink),
        link_url: safeLinkUrl(categoryLink)
      });
      return;
    }

    var trigger = target.closest('.faq-trigger, .faq-item summary');
    if (!trigger) return;

    var opening = true;
    if (trigger.matches('.faq-trigger')) {
      opening = trigger.getAttribute('aria-expanded') !== 'true';
    } else {
      var details = trigger.closest('details');
      opening = !(details && details.open);
    }

    if (!opening) return;

    var meta = faqMeta(trigger);
    window.vmgTrackEvent('faq_question_open', meta);
  }

  function trackNeedHelp(target) {
    var trigger = target.closest('.vmg-help-trigger');
    if (trigger) {
      window.vmgTrackEvent('need_help_open', {
        cta_location: 'need_help'
      });
      return;
    }

    var option = target.closest('.vmg-help-menu a, .vmg-help-menu button');
    if (option) {
      window.vmgTrackEvent('need_help_option_click', {
        link_text: elementText(option),
        link_url: safeLinkUrl(option),
        cta_location: 'need_help'
      });
    }
  }

  function trackFooter(target) {
    var footer = target.closest('.site-footer, .vmg-global-footer');
    if (!footer) return;

    var social = target.closest('.vmg-footer-socials a, .vmg-social-link');
    if (social) {
      window.vmgTrackEvent('social_click', {
        link_text: elementText(social),
        channel: (outboundMeta(social) || {}).channel || '',
        section_name: 'Footer'
      });
      return;
    }

    var trust = target.closest('.vmg-footer-trust-card a, .footer-trust a, [data-trust-badge] a');
    if (trust) {
      window.vmgTrackEvent('trust_badge_click', {
        link_text: elementText(trust),
        link_url: safeLinkUrl(trust),
        section_name: 'Footer'
      });
      return;
    }

    var link = target.closest('a');
    if (link) {
      window.vmgTrackEvent('footer_link_click', {
        link_text: elementText(link),
        link_url: safeLinkUrl(link),
        section_name: 'Footer'
      });
    }
  }

  function trackSocialAnywhere(target) {
    var link = target.closest('.vmg-social-link');
    if (!link || link.closest('.site-footer, .vmg-global-footer')) return;

    window.vmgTrackEvent('social_click', {
      link_text: elementText(link),
      channel: (outboundMeta(link) || {}).channel || '',
      cta_location: ctaLocation(link)
    });
  }

  function trackOutbound(target) {
    var link = target.closest('a[href]');
    if (!link) return;

    var meta = outboundMeta(link);
    if (!meta) return;

    window.vmgTrackEvent('outbound_link_click', {
      link_text: elementText(link),
      outbound_domain: meta.outbound_domain,
      link_type: meta.link_type,
      channel: meta.channel,
      cta_location: ctaLocation(link)
    });
  }

  function trackGeneralCtas(target) {
    var el = target.closest('a, button');
    if (!el) return;

    var text = elementText(el).toLowerCase();
    var href = hrefValue(el).toLowerCase();

    if (/view more products|view all products|explore all products/.test(text)) {
      window.vmgTrackEvent('view_more_products_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });
    }

    if ((/view market|market reference/.test(text) || href.indexOf('/market-prices') !== -1) && !el.closest('.site-nav')) {
      var eventName = el.closest('.ticker, .market-ticker, [class*="ticker"]') ? 'market_ticker_click' : 'market_reference_click';
      window.vmgTrackEvent(eventName, {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });
    }

    if (/read more about us|learn more about us/.test(text)) {
      window.vmgTrackEvent('about_cta_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });
    }

    if ((/sell scrap|buy scrap|partner with vmg|partner with us/.test(text)) && el.closest('.home-utility, .home-trade, .quick-enquiry, .enquiry-card, .hub-card')) {
      window.vmgTrackEvent('enquiry_card_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });
    }

    if (href.indexOf('/resources') !== -1 && !el.closest('.site-nav') && PAGE_PATH !== '/resources.html') {
      window.vmgTrackEvent('resources_cta_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });
    }

    if ((href.indexOf('/contact') !== -1 || href.indexOf('contact.html') !== -1) && !el.closest('.site-nav')) {
      window.vmgTrackEvent('contact_cta_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: ctaLocation(el)
      });

      if (PAGE_PATH.indexOf('/market-prices') === 0) {
        window.vmgTrackEvent('market_contact_click', {
          link_text: elementText(el),
          cta_location: ctaLocation(el)
        });
      }
    }

    if (el.closest('.final-cta, .home-final-cta, .faq-bottom-cta')) {
      window.vmgTrackEvent('final_cta_click', {
        link_text: elementText(el),
        link_url: safeLinkUrl(el),
        cta_location: 'final_cta'
      });
    }
  }

  function trackMarketControls(target) {
    if (PAGE_PATH.indexOf('/market-prices') !== 0) return;

    var category = target.closest('[data-market-category], .market-category-toggle, .market-tabs button, .market-tab');
    if (category) {
      window.vmgTrackEvent('market_category_toggle', {
        selected_category: cleanText(category.getAttribute('data-market-category') || elementText(category), 100)
      });
      return;
    }

    var chartControl = target.closest('[data-market-chart-control], .market-chart-control, .chart-control');
    if (chartControl) {
      window.vmgTrackEvent('market_chart_interaction', {
        link_text: elementText(chartControl)
      });
    }
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    trackDataAttributeClick(target);
    trackNavClick(target);
    trackHeroClick(target);
    trackPdfAction(target);
    trackProductClick(target);
    trackResourceClick(target);
    trackFaqClick(target);
    trackNeedHelp(target);
    trackFooter(target);
    trackSocialAnywhere(target);
    trackOutbound(target);
    trackGeneralCtas(target);
    trackMarketControls(target);

    var trackButton = target.closest('[data-vmg-track-form] .vmg-track-button, .vmg-track-button');
    if (trackButton) {
      window.vmgTrackEvent('track_shipment_click', {
        cta_location: ctaLocation(trackButton)
      });
    }
  }, true);

  var startedForms = new WeakSet();

  document.addEventListener('focusin', function (event) {
    var form = event.target && event.target.closest && event.target.closest('form');
    if (!form || startedForms.has(form)) return;

    startedForms.add(form);
    var formType = inferFormType(form);

    window.vmgTrackEvent('form_start', {
      form_type: formType,
      cta_location: ctaLocation(form)
    });

    if (formType === 'contact' || PAGE_PATH === '/contact.html') {
      window.vmgTrackEvent('contact_form_start', {
        form_type: formType,
        cta_location: ctaLocation(form)
      });
    }
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    var formType = inferFormType(form);
    var params = {
      form_type: formType,
      cta_location: ctaLocation(form)
    };

    window.vmgTrackEvent('form_submit_attempt', params);

    if (formType === 'contact' || PAGE_PATH === '/contact.html') {
      window.vmgTrackEvent('contact_form_submit_attempt', params);
    }

    if (formType === 'newsletter') {
      window.vmgTrackEvent('newsletter_submit_attempt', params);
    }
  }, true);

  function reliableFormResult(eventName, genericName, contactName) {
    document.addEventListener(eventName, function (event) {
      var form =
        event.target instanceof HTMLFormElement
          ? event.target
          : event.detail && event.detail.form instanceof HTMLFormElement
            ? event.detail.form
            : null;

      if (!form) return;

      var formType = inferFormType(form);
      var params = {
        form_type: formType,
        cta_location: ctaLocation(form)
      };

      window.vmgTrackEvent(genericName, params);
      if (formType === 'contact' || PAGE_PATH === '/contact.html') {
        window.vmgTrackEvent(contactName, params);
      }
    });
  }

  reliableFormResult('vmg:form-success', 'form_success', 'contact_form_success');
  reliableFormResult('form:success', 'form_success', 'contact_form_success');
  reliableFormResult('vmg:form-error', 'form_error', 'contact_form_error');
  reliableFormResult('form:error', 'form_error', 'contact_form_error');

  document.addEventListener('change', function (event) {
    if (PAGE_PATH.indexOf('/market-prices') !== 0) return;

    var el = event.target;
    if (!(el instanceof Element)) return;

    var context = ((el.id || '') + ' ' + (el.className || '') + ' ' + (el.getAttribute('name') || '')).toLowerCase();

    if (/benchmark/.test(context)) {
      var label = '';
      if (el.tagName === 'SELECT') {
        var selected = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
        label = selected ? selected.textContent : '';
      } else {
        label = el.getAttribute('data-benchmark') || el.getAttribute('aria-label') || '';
      }

      window.vmgTrackEvent('market_benchmark_change', {
        selected_benchmark: cleanText(label, 100)
      });
    }
  }, true);

  function mapSectionName(section) {
    if (!section) return '';

    var explicit = section.getAttribute && section.getAttribute('data-ga-section');
    if (explicit) return explicit;

    var cls = (section.className || '').toString().toLowerCase();
    var id = (section.id || '').toLowerCase();
    var heading = section.querySelector && section.querySelector('h1,h2,h3');
    var headingText = cleanText(heading && heading.textContent, 120);
    var combined = cls + ' ' + id + ' ' + headingText.toLowerCase();

    if (/hero/.test(combined)) return 'Hero';
    if (/ticker/.test(combined)) return 'Market Ticker';
    if (/company-profile|profile/.test(combined)) return 'Company Profile';
    if (/quick|enquiry|trade-item/.test(combined)) return 'Quick Enquiry Cards';
    if (/process/.test(combined)) return 'Process';
    if (/product/.test(combined)) return PAGE_PATH === '/products.html' || PAGE_PATH === '/product.html' ? 'Product Categories' : 'Products Preview';
    if (/impact|sustainab/.test(combined)) return 'Sustainability';
    if (/market/.test(combined)) return 'Market Teaser';
    if (/resource/.test(combined)) return id === 'resource-hub' || /hub/.test(combined) ? 'Resource Hub' : 'Resources Teaser';
    if (/location|office|address/.test(combined)) return 'Locations';
    if (/final|bottom-cta/.test(combined)) return 'Final CTA';
    if (/faq/.test(combined)) return 'FAQ';
    if (/doc/.test(combined)) return 'Documentation Support';
    if (/contact|form/.test(combined)) return 'Contact Forms';
    if (/about|who we are/.test(combined)) return 'About Preview';

    return headingText || cleanText(id.replace(/[-_]+/g, ' '), 120);
  }

  function sectionIsTrackable(section) {
    if (!section || !section.getBoundingClientRect) return false;

    var style = window.getComputedStyle(section);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return false;
    if (section.closest('[hidden]')) return false;
    if (section.matches('.hub-panel:not(.active)')) return false;

    return true;
  }

  function initSectionTracking() {
    if (!('IntersectionObserver' in window)) return;

    var seen = new Set();
    var sections = [];

    document.querySelectorAll('[data-ga-section], main > section, .faq-group, #resource-hub, .hub-shell, .docs-grid, .process-section, footer.site-footer, footer.vmg-global-footer').forEach(function (section) {
      if (sections.indexOf(section) === -1) sections.push(section);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        if (!sectionIsTrackable(entry.target)) return;

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
      threshold: [0.5]
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initMarketPageView() {
    if (PAGE_PATH.indexOf('/market-prices') !== 0) return;

    window.vmgTrackEvent('market_page_view', {
      section_name: 'Market'
    });
  }

  function init() {
    initSectionTracking();
    initMarketPageView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

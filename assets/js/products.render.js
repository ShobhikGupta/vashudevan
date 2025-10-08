(function(){
  function loadCatalog() {
    try {
      if (window.__CATALOG__ && Array.isArray(window.__CATALOG__.products) && window.__CATALOG__.products.length) {
        return Promise.resolve(window.__CATALOG__);
      }
    } catch (_) {}

    var url = 'assets/data/products.json?v=' + Date.now();
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('Failed to load catalog: ' + r.status); return r.json(); })
      .then(function (data) {
        window.__CATALOG__ = data || { products: [] };
        return window.__CATALOG__;
      })
      .catch(function () { return { products: [] }; });
  }

  function renderCategoryCards(gridEl, categories) {
    if (!gridEl) return;
    gridEl.innerHTML = '';

    (categories || []).forEach(function (cat) {
      var displayImg = cat.icon || (cat.subproducts && cat.subproducts[0] && cat.subproducts[0].image) || '';
      if (!displayImg) return;

      var article = document.createElement('article');
      article.className = 'card product';

      var link = document.createElement('a');
      link.href = 'product.html?slug=' + encodeURIComponent(cat.slug);
      link.setAttribute('aria-label', cat.name);

      var figure = document.createElement('figure');
      figure.className = 'product-figure';

      var img = document.createElement('img');
      img.src = displayImg;
      img.alt = cat.name;

      var caption = document.createElement('figcaption');
      caption.textContent = cat.name;

      figure.appendChild(img);
      figure.appendChild(caption);
      link.appendChild(figure);
      article.appendChild(link);
      gridEl.appendChild(article);
    });
  }

  // Helpers for product/subproduct pages (merged from catalog.js)
  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function findProduct(catalog, slug) {
    return (catalog.products || []).find(function (p) { return p.slug === slug; });
  }

  function findSubproduct(product, subSlug) {
    if (!product) return null;
    return (product.subproducts || []).find(function (s) { return s.slug === subSlug; });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text || '';
  }

  function renderSubproductsGrid(containerId, product) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    var items = product.subproducts || [];
    if (!items.length) {
      var p = document.createElement('p');
      p.textContent = 'No subproducts listed for this product at the moment.';
      container.appendChild(p);
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'cards grid-3 products-grid';

    items.forEach(function (sp) {
      var article = document.createElement('article');
      article.className = 'card product';

      var link = document.createElement('div');
      link.className = 'subproduct-item';
      link.setAttribute('aria-label', sp.name);

      var figure = document.createElement('figure');
      figure.className = 'product-figure';

      var img = document.createElement('img');
      img.src = sp.image || product.icon;
      img.alt = sp.name;
      if (product && product.icon) {
        img.setAttribute('data-fallback', product.icon);
      }
      try { img.referrerPolicy = 'no-referrer'; } catch (e) {}

      var caption = document.createElement('figcaption');
      caption.textContent = sp.name;

      figure.appendChild(img);
      figure.appendChild(caption);
      link.appendChild(figure);
      article.appendChild(link);
      grid.appendChild(article);
    });

    container.appendChild(grid);
  }

  function renderBreadcrumb(containerId, product, subproduct) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    var pLink = document.createElement('a');
    pLink.href = 'product.html?slug=' + encodeURIComponent(product.slug);
    pLink.textContent = product.name;

    var sep = document.createElement('span');
    sep.textContent = ' / ';

    var current = document.createElement('span');
    current.textContent = subproduct.name;

    container.appendChild(pLink);
    container.appendChild(sep);
    container.appendChild(current);
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadCatalog().then(function (catalog) {
      var products = (catalog && catalog.products) || [];

      // Home page grid: keep heading and container, replace only grid items
      var homeGrid = document.querySelector('section.products-preview .products-grid');
      if (homeGrid) {
        renderCategoryCards(homeGrid, products);
      }

      // Products page grid: replace items inside existing grid container
      var productsGrid = document.querySelector('main.page .products-grid') || document.querySelector('.section .products-grid');
      if (productsGrid) {
        renderCategoryCards(productsGrid, products);
      }

      // Product page
      var isProductPage = !!document.getElementById('product-page-root');
      if (isProductPage) {
        var slug = getQueryParam('slug');
        var product = findProduct(catalog, slug);
        if (!product) {
          setText('product-name', 'Product Not Found');
          setText('product-summary', 'The requested product does not exist.');
        } else {
          setText('product-name', product.name);
          setText('product-summary', product.summary || '');
          renderSubproductsGrid('subproducts-grid', product);
        }
      }

      // Subproduct page
      var isSubproductPage = !!document.getElementById('subproduct-page-root');
      if (isSubproductPage) {
        var pSlug = getQueryParam('product');
        var sSlug = getQueryParam('slug');
        var prod = findProduct(catalog, pSlug);
        var sub = findSubproduct(prod, sSlug);
        if (!prod || !sub) {
          setText('subproduct-name', 'Item Not Found');
          setText('subproduct-desc', 'The requested subproduct does not exist.');
        } else {
          setText('subproduct-name', sub.name);
          var imgEl = document.getElementById('subproduct-image');
          if (imgEl) {
            imgEl.setAttribute('src', sub.image || (prod && prod.icon) || '');
            imgEl.setAttribute('alt', sub.name || '');
            try { imgEl.referrerPolicy = 'no-referrer'; } catch (e) {}
          }
          setText('subproduct-desc', sub.description || (prod && prod.summary) || '');
          renderBreadcrumb('breadcrumb', prod, sub);
        }
      }
    });
  });
})();



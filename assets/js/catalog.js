(function () {
  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function fetchCatalog() {
    var url = 'assets/data/products.json?v=' + Date.now();
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load catalog: ' + r.status);
        return r.json();
      })
      .catch(function (err) {
        try { console.error(err); } catch (_) {}
        var notice = document.getElementById('catalog-error');
        if (!notice) {
          notice = document.createElement('div');
          notice.id = 'catalog-error';
          notice.style.margin = '12px 0';
          notice.style.padding = '12px';
          notice.style.border = '1px solid #e5e7eb';
          notice.style.borderRadius = '8px';
          notice.style.background = '#fff';
          notice.style.color = '#111827';
        }
        notice.textContent = 'Unable to load product catalog. Please run this site via a local server (e.g., Python: py -3 -m http.server).';
        var root = document.getElementById('product-page-root') || document.getElementById('subproduct-page-root') || document.body;
        try { root.insertBefore(notice, root.firstChild); } catch (_) { document.body.appendChild(notice); }
        return { products: [] };
      });
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

  function setImage(id, src, alt) {
    var el = document.getElementById(id);
    if (el) {
      if (src) el.setAttribute('src', src);
      if (alt) el.setAttribute('alt', alt);
    }
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

      var link = document.createElement('a');
      link.href = 'subproduct.html?product=' + encodeURIComponent(product.slug) + '&slug=' + encodeURIComponent(sp.slug);
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
    var isProductPage = !!document.getElementById('product-page-root');
    var isSubproductPage = !!document.getElementById('subproduct-page-root');

    if (!isProductPage && !isSubproductPage) return;

    fetchCatalog().then(function (catalog) {
      if (isProductPage) {
        var slug = getQueryParam('slug');
        var product = findProduct(catalog, slug);
        if (!product) {
          setText('product-name', 'Product Not Found');
          setText('product-summary', 'The requested product does not exist.');
          return;
        }
        setText('product-name', product.name);
        setText('product-summary', product.summary || '');
        renderSubproductsGrid('subproducts-grid', product);
      }

      if (isSubproductPage) {
        var pSlug = getQueryParam('product');
        var sSlug = getQueryParam('slug');
        var prod = findProduct(catalog, pSlug);
        var sub = findSubproduct(prod, sSlug);
        if (!prod || !sub) {
          setText('subproduct-name', 'Item Not Found');
          setText('subproduct-desc', 'The requested subproduct does not exist.');
          return;
        }
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
    });
  });
})();



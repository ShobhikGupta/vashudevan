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
    
    // Only replace if we have categories and they're different from existing content
    if (!categories || categories.length === 0) {
      console.log('No categories to render, keeping existing products');
      return;
    }

    // Check if grid already has products (static HTML) - only for home page
    var isHomePage = gridEl.closest('section.products-preview');
    var isProductsPage = gridEl.closest('main.page');
    
    console.log('Is home page:', !!isHomePage);
    console.log('Is products page:', !!isProductsPage);
    
    if (isHomePage) {
      var existingProducts = gridEl.querySelectorAll('.card.product');
      if (existingProducts.length > 0) {
        console.log('Products already exist on home page, keeping static HTML products');
        return;
      }
    }
    
    // Always replace on products page
    if (isProductsPage) {
      console.log('Products page detected, clearing existing content');
      gridEl.innerHTML = '';
    }

    console.log('Rendering dynamic products:', categories.length);
    gridEl.innerHTML = '';

    // Sort categories alphabetically
    var sortedCategories = categories.slice().sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });

    sortedCategories.forEach(function (cat) {
      var displayImg = cat.icon || (cat.subproducts && cat.subproducts[0] && cat.subproducts[0].image) || '';
      var displayName = cat.slug === 'aluminum' ? 'Aluminium' : cat.name;
      if (!displayImg) {
        console.log('No image for category:', cat.name);
        return;
      }

      var article = document.createElement('article');
      article.className = 'card product';

      var link = document.createElement('a');
      link.href = 'product.html?slug=' + encodeURIComponent(cat.slug);
      link.setAttribute('aria-label', 'View ' + displayName + ' category');

      var figure = document.createElement('figure');
      figure.className = 'product-figure';

      var img = document.createElement('img');
      img.src = displayImg;
      img.alt = displayName;

      var caption = document.createElement('figcaption');
      caption.textContent = displayName;

      var cta = document.createElement('span');
      cta.className = 'product-card-cta';
      cta.textContent = 'View Category';

      figure.appendChild(img);
      figure.appendChild(caption);
      link.appendChild(figure);
      link.appendChild(cta);
      article.appendChild(link);
      
      // Add subproducts section for products page
      var isProductsPage = gridEl.closest('main.page');
      console.log('Is products page:', !!isProductsPage);
      console.log('Product:', cat.name, 'has subproducts:', cat.subproducts ? cat.subproducts.length : 0);
      
      if (isProductsPage && cat.subproducts && cat.subproducts.length > 0) {
        console.log('Adding subproducts for:', cat.name);
        var subproductsDiv = document.createElement('div');
        subproductsDiv.className = 'subproducts-preview';
        
        var subproductsTitle = document.createElement('h4');
        subproductsTitle.textContent = 'Subproducts:';
        subproductsTitle.className = 'subproducts-title';
        subproductsDiv.appendChild(subproductsTitle);
        
        var subproductsList = document.createElement('div');
        subproductsList.className = 'subproducts-list';
        
        // Sort subproducts alphabetically
        var sortedSubproducts = cat.subproducts.slice().sort(function(a, b) {
          return a.name.localeCompare(b.name);
        });
        
        sortedSubproducts.forEach(function(subproduct) {
          var subproductItem = document.createElement('div');
          subproductItem.className = 'subproduct-item';
          
          var subproductLink = document.createElement('a');
          subproductLink.href = 'product.html?slug=' + encodeURIComponent(cat.slug) + '#' + encodeURIComponent(subproduct.slug);
          subproductLink.textContent = subproduct.name;
          subproductLink.className = 'subproduct-link';
          
          subproductItem.appendChild(subproductLink);
          subproductsList.appendChild(subproductItem);
        });
        
        subproductsDiv.appendChild(subproductsList);
        article.appendChild(subproductsDiv);
      }
      
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
      article.setAttribute('data-subproduct-slug', sp.slug);

      var link = document.createElement('div');
      link.className = 'subproduct-item';
      // link.setAttribute('aria-label', sp.name);

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
    console.log('Products render script loaded');
    
    loadCatalog().then(function (catalog) {
      var products = (catalog && catalog.products) || [];
      console.log('Loaded catalog with', products.length, 'products');
      
      // Debug: Log first product with subproducts
      if (products.length > 0) {
        console.log('First product:', products[0]);
        console.log('First product subproducts:', products[0].subproducts);
      }

      // Home page grid: keep heading and container, replace only grid items
      var homeGrid = document.querySelector('section.products-preview .products-grid');
      if (homeGrid) {
        console.log('Found home grid, rendering products');
        renderCategoryCards(homeGrid, products);
      } else {
        console.log('Home grid not found');
      }

      // Products page grid: replace items inside existing grid container
      var productsGrid = document.querySelector('.products-grid');
      console.log('Looking for products grid, found:', !!productsGrid);
      
      if (productsGrid) {
        console.log('Found products page grid, rendering products with subproducts');
        
        // Only replace if we have products to show
        if (products && products.length > 0) {
          productsGrid.innerHTML = '';
          
          // Simple implementation for products page
          products.forEach(function (product) {
          var displayName = product.slug === 'aluminum' ? 'Aluminium' : product.name;
          
          var article = document.createElement('article');
          article.className = 'card product';
          
          var link = document.createElement('a');
          link.href = 'product.html?slug=' + encodeURIComponent(product.slug);
          link.setAttribute('aria-label', 'View ' + displayName + ' category');
          
          var figure = document.createElement('figure');
          figure.className = 'product-figure';
          
          var img = document.createElement('img');
          img.src = product.icon || '';
          img.alt = displayName;
          
          var caption = document.createElement('figcaption');
          caption.textContent = displayName;

          var cta = document.createElement('span');
          cta.className = 'product-card-cta';
          cta.textContent = 'View Category';
          
          figure.appendChild(img);
          figure.appendChild(caption);
          link.appendChild(figure);
          link.appendChild(cta);
          article.appendChild(link);
          
          productsGrid.appendChild(article);
        });
        } else {
          console.log('No products to render, keeping existing static content');
        }
      } else {
        console.log('Products grid not found!');
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
    }).catch(function(error) {
      console.error('Error loading catalog:', error);
      // Keep existing static products if dynamic loading fails
      console.log('Keeping existing static products due to error');
    });
  });
})();


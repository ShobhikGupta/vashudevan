// Simple products render script
console.log('Simple products render script loaded');

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, starting products render');
    
    // Load products from JSON
    fetch('assets/data/products.json')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to load products: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Products loaded:', data.products ? data.products.length : 0);
            console.log('Full data object:', data);
            
            // Find products grid
            var productsGrid = document.querySelector('.products-grid');
            console.log('Products grid found:', !!productsGrid);
            console.log('Products grid element:', productsGrid);
            console.log('Products grid current children:', productsGrid ? productsGrid.children.length : 0);
            
            if (productsGrid && data.products && data.products.length > 0) {
                console.log('Products page loaded successfully - no subproducts list added');
                // Just keep the existing static content without adding subproducts lists
            } else {
                console.log('No products grid found or no products data');
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            // Keep existing static content if dynamic loading fails
        });
    
    // Handle product detail page
    var isProductPage = !!document.getElementById('product-page-root');
    if (isProductPage) {
        console.log('Product detail page detected');
        
        // Get the slug from URL
        var urlParams = new URLSearchParams(window.location.search);
        var slug = urlParams.get('slug');
        console.log('Product slug:', slug);
        
        if (slug) {
            // Load products and find the matching one
            fetch('assets/data/products.json')
                .then(response => response.json())
                .then(data => {
                    var product = data.products.find(function(p) { return p.slug === slug; });
                    if (product) {
                        console.log('Found product:', product.name);
                        
                        // Update page title and summary
                        var productNameEl = document.getElementById('product-name');
                        var productSummaryEl = document.getElementById('product-summary');
                        
                        if (productNameEl) {
                            productNameEl.textContent = product.name;
                        }
                        if (productSummaryEl) {
                            productSummaryEl.textContent = product.summary || 'Explore our ' + product.name.toLowerCase() + ' products and subproducts.';
                        }
                        
                        // Show subproduct search
                        var subproductSearch = document.getElementById('subproduct-search');
                        if (subproductSearch) {
                            subproductSearch.style.display = 'block';
                        }
                        
                        // Render subproducts in card format
                        var subproductsGrid = document.getElementById('subproducts-grid');
                        if (subproductsGrid && product.subproducts && product.subproducts.length > 0) {
                            console.log('Rendering subproducts:', product.subproducts.length);
                            
                            subproductsGrid.innerHTML = '';
                            var grid = document.createElement('div');
                            grid.className = 'cards grid-3 products-grid';
                            
                            // Sort subproducts alphabetically
                            var sortedSubproducts = product.subproducts.slice().sort(function(a, b) {
                                return a.name.localeCompare(b.name);
                            });
                            
                            sortedSubproducts.forEach(function(subproduct) {
                                var article = document.createElement('article');
                                article.className = 'card product';
                                article.setAttribute('data-subproduct-slug', subproduct.slug);
                                
                                var link = document.createElement('a');
                                link.href = 'product.html?slug=' + encodeURIComponent(product.slug) + '#' + encodeURIComponent(subproduct.slug);
                                link.setAttribute('aria-label', subproduct.name);
                                
                                var figure = document.createElement('figure');
                                figure.className = 'product-figure';
                                
                                var img = document.createElement('img');
                                img.src = subproduct.image || product.icon || '';
                                img.alt = subproduct.name;
                                img.onerror = function() {
                                    console.log('Image failed to load for subproduct:', subproduct.name);
                                    this.style.display = 'none';
                                };
                                
                                var caption = document.createElement('figcaption');
                                caption.textContent = subproduct.name;
                                
                                figure.appendChild(img);
                                figure.appendChild(caption);
                                link.appendChild(figure);
                                article.appendChild(link);
                                grid.appendChild(article);
                            });
                            
                            subproductsGrid.appendChild(grid);
                            
                            // Trigger deep-linking after subproducts are rendered
                            setTimeout(function() {
                                if (window.initDeepLinkingAfterRender) {
                                    window.initDeepLinkingAfterRender();
                                }
                            }, 100);
                        } else {
                            console.log('No subproducts found for:', product.name);
                            if (subproductsGrid) {
                                subproductsGrid.innerHTML = '<p>No subproducts available for this product at the moment.</p>';
                            }
                        }
                    } else {
                        console.log('Product not found:', slug);
                        var productNameEl = document.getElementById('product-name');
                        var productSummaryEl = document.getElementById('product-summary');
                        
                        if (productNameEl) {
                            productNameEl.textContent = 'PRODUCT NOT FOUND';
                        }
                        if (productSummaryEl) {
                            productSummaryEl.textContent = 'The requested product does not exist.';
                        }
                    }
                })
                .catch(error => {
                    console.error('Error loading product details:', error);
                });
        }
    }
});

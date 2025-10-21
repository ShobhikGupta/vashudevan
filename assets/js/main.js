(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const submenuParents = document.querySelectorAll('.site-nav .has-submenu');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Mobile submenu toggle
  submenuParents.forEach(function (parent) {
    const link = parent.querySelector(':scope > a');
    link && link.addEventListener('click', function (e) {
      if (window.matchMedia('(max-width: 720px)').matches) {
        e.preventDefault();
        parent.classList.toggle('open');
      }
    });
  });

  // Enhanced smooth scrolling for navigation links and anchor links
  function initSmoothScrolling() {
    // Handle all anchor links (both internal and external)
    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          e.preventDefault();
          
          // Close mobile menu if open
          if (nav && nav.classList.contains('open')) {
            nav.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
          }
          
          // Calculate offset for sticky header
          const headerHeight = 80; // Approximate header height
          const targetPosition = targetElement.offsetTop - headerHeight;
          
          // Smooth scroll to target
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // Handle navigation links to other pages with smooth scroll to sections
    document.querySelectorAll('a[href*="#"]').forEach(function(link) {
      const href = link.getAttribute('href');
      if (href.includes('.html#')) {
        link.addEventListener('click', function(e) {
          const [pageUrl, sectionId] = href.split('#');
          const currentPage = window.location.pathname.split('/').pop() || 'index.html';
          const targetPage = pageUrl.split('/').pop();
          
          // If it's the same page, handle smooth scroll
          if (currentPage === targetPage) {
            e.preventDefault();
            const targetElement = document.getElementById(sectionId);
            if (targetElement) {
              const headerHeight = 80;
              const targetPosition = targetElement.offsetTop - headerHeight;
              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              });
            }
          }
        });
      }
    });
  }

  // Initialize smooth scrolling when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScrolling);
  } else {
    initSmoothScrolling();
  }

  // Back to top button functionality
  function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    if (!backToTopButton) return;

    // Show/hide button based on scroll position
    function toggleBackToTop() {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    }

    // Scroll to top when clicked
    backToTopButton.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // Listen for scroll events
    window.addEventListener('scroll', toggleBackToTop);
    
    // Initial check
    toggleBackToTop();
  }

  // Initialize back to top when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackToTop);
  } else {
    initBackToTop();
  }

  // Hero Carousel functionality
  function initHeroCarousel() {
    const carousel = document.querySelector('.hero-carousel');
    if (!carousel) return;
    
    // Prevent multiple initializations
    if (carousel.dataset.initialized === 'true') {
      console.log('Hero carousel already initialized, skipping...');
      return;
    }
    carousel.dataset.initialized = 'true';

    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = carousel.querySelectorAll('.indicator');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const currentSlideSpan = carousel.querySelector('.current-slide');
    const totalSlidesSpan = carousel.querySelector('.total-slides');

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval;

    // Set total slides count
    if (totalSlidesSpan) {
      totalSlidesSpan.textContent = totalSlides;
    }

    // Function to show specific slide
    function showSlide(index) {
      // Remove active class from all slides and indicators
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(indicator => {
        indicator.classList.remove('active');
        // Reset the progress bar animation
        indicator.style.animation = 'none';
        indicator.offsetHeight; // Trigger reflow
        indicator.style.animation = null;
      });

      // Add active class to current slide and indicator
      if (slides[index]) {
        slides[index].classList.add('active');
      }
      if (indicators[index]) {
        indicators[index].classList.add('active');
        // Start the progress bar animation
        indicators[index].style.animation = 'progressBar 5s linear forwards';
      }

      // Update counter
      if (currentSlideSpan) {
        currentSlideSpan.textContent = index + 1;
      }

      currentSlide = index;
    }

    // Function to go to next slide
    function nextSlide() {
      const nextIndex = (currentSlide + 1) % totalSlides;
      console.log('Hero carousel advancing to slide:', nextIndex + 1);
      showSlide(nextIndex);
    }

    // Function to go to previous slide
    function prevSlide() {
      const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
      showSlide(prevIndex);
    }

    // Function to start auto-play
    function startAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
      autoPlayInterval = setInterval(() => {
        console.log('Hero carousel auto-advancing from slide', currentSlide + 1);
        nextSlide();
      }, 5000); // Change slide every 5 seconds
      console.log('Hero carousel auto-play started');
    }

    // Function to stop auto-play
    function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        console.log('Hero carousel auto-play stopped');
      }
    }

    // Event listeners for navigation buttons
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoPlay();
        startAutoPlay(); // Restart auto-play after manual navigation
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoPlay();
        startAutoPlay(); // Restart auto-play after manual navigation
      });
    }

    // Event listeners for indicators
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        showSlide(index);
        stopAutoPlay();
        startAutoPlay(); // Restart auto-play after manual navigation
      });
    });

    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        stopAutoPlay();
        startAutoPlay();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        stopAutoPlay();
        startAutoPlay();
      }
    });

    // Pause auto-play on hover
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    // Only pause auto-play when page is not visible (tab switch), not when scrolling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - next slide
          nextSlide();
        } else {
          // Swipe right - previous slide
          prevSlide();
        }
        stopAutoPlay();
        startAutoPlay();
      }
    }

    // Initialize carousel
    console.log('Initializing hero carousel with', totalSlides, 'slides');
    showSlide(0);
    
    // Start auto-play with a small delay to ensure everything is ready
    setTimeout(() => {
      startAutoPlay();
    }, 100);
    
    // Ensure auto-play continues even if interrupted
    setInterval(() => {
      if (!autoPlayInterval) {
        console.log('Hero carousel auto-play was interrupted, restarting...');
        startAutoPlay();
      }
    }, 1000);

    // Make carousel focusable for keyboard navigation
    carousel.setAttribute('tabindex', '0');
  }

  // Initialize hero carousel when DOM is loaded
  function initHeroCarouselWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initHeroCarousel);
    } else {
      // Add a small delay to ensure all elements are properly rendered
      setTimeout(initHeroCarousel, 50);
    }
  }
  
  initHeroCarouselWhenReady();
  
  // Backup initialization on window load
  window.addEventListener('load', function() {
    const carousel = document.querySelector('.hero-carousel');
    if (carousel && carousel.dataset.initialized !== 'true') {
      console.log('Backup initialization of hero carousel on window load');
      initHeroCarousel();
    }
  });

  // Company Highlights Carousel functionality
  function initHighlightsCarousel() {
    const carousel = document.querySelector('.highlights-carousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.highlight-slide');
    const indicators = carousel.querySelectorAll('.highlight-indicator');
    const prevBtn = carousel.querySelector('.highlight-prev');
    const nextBtn = carousel.querySelector('.highlight-next');

    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval;

    // Function to show specific slide
    function showSlide(index) {
      // Remove active class from all slides and indicators
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));

      // Add active class to current slide and indicator
      if (slides[index]) {
        slides[index].classList.add('active');
      }
      if (indicators[index]) {
        indicators[index].classList.add('active');
      }

      currentSlide = index;
    }

    // Function to go to next slide
    function nextSlide() {
      const nextIndex = (currentSlide + 1) % totalSlides;
      showSlide(nextIndex);
    }

    // Function to go to previous slide
    function prevSlide() {
      const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
      showSlide(prevIndex);
    }

    // Function to start auto-play
    function startAutoPlay() {
      autoPlayInterval = setInterval(nextSlide, 3000); // Change slide every 3 seconds
    }

    // Function to stop auto-play
    function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    }

    // Event listeners for navigation buttons
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoPlay();
        startAutoPlay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoPlay();
        startAutoPlay();
      });
    }

    // Event listeners for indicators
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        showSlide(index);
        stopAutoPlay();
        startAutoPlay();
      });
    });

    // Pause auto-play on hover
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      const swipeThreshold = 50;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        stopAutoPlay();
        startAutoPlay();
      }
    }

    // Initialize carousel
    showSlide(0);
    startAutoPlay();
  }

  // Initialize highlights carousel when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHighlightsCarousel);
  } else {
    initHighlightsCarousel();
  }

  // Global function to highlight search terms with smart color detection
  function highlightSearchTerm(text, searchTerm, isGreenText = false) {
    if (!searchTerm || searchTerm.trim() === '') {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const highlightClass = isGreenText ? 'search-highlight-black' : 'search-highlight-green';
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
  }

  // Smart highlighting function that detects text color context
  function smartHighlightSearchTerm(text, searchTerm, contextElement = null) {
    if (!searchTerm || searchTerm.trim() === '') {
      return text;
    }
    
    // For subproduct search, always use green highlighting for black text
    // since subproduct names are typically black text
    return highlightSearchTerm(text, searchTerm, false);
  }

  // Product search functionality
  function initProductSearch() {
    const searchInput = document.getElementById('product-search');
    const clearButton = document.getElementById('clear-search');
    const resultsCount = document.getElementById('search-results-count');
    const productsGrid = document.querySelector('.products-grid');
    
    if (!searchInput || !productsGrid) {
      return;
    }

    // Load products data for enhanced search
    let productsData = null;
    fetch('assets/data/products.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load products data: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        productsData = data.products;
        console.log('Products data loaded successfully:', productsData.length, 'products');
      })
      .catch(error => {
        console.error('Could not load products data for search:', error);
      });

    // Advanced deep-linking search function that shows individual subproduct cards
    function searchProducts(term) {
      const searchTerm = term.toLowerCase().trim();
      const productCards = productsGrid.querySelectorAll('.card.product');
      let visibleCount = 0;

      console.log('Searching for:', searchTerm);
      console.log('Products data available:', !!productsData);

      // Add loading state
      if (searchTerm !== '') {
        productsGrid.classList.add('search-loading');
      }

      // Remove existing no-results message and subproduct results
      const existingNoResults = productsGrid.querySelector('.no-results');
      if (existingNoResults) {
        existingNoResults.remove();
      }
      
      // Remove existing subproduct search results
      const existingSubproductResults = productsGrid.querySelectorAll('.subproduct-search-result');
      existingSubproductResults.forEach(result => result.remove());

      if (searchTerm === '') {
        // Show all main products and clear any highlighting
        productCards.forEach(card => {
          card.classList.remove('hidden', 'highlighted');
          
          // Clear any HTML highlighting from figcaptions
          const figcaption = card.querySelector('figcaption');
          if (figcaption) {
            // Store original text if not already stored
            if (!figcaption.dataset.originalText) {
              figcaption.dataset.originalText = figcaption.textContent;
            }
            // Restore original text content
            figcaption.textContent = figcaption.dataset.originalText;
          }
          
          visibleCount++;
        });
        if (resultsCount) resultsCount.textContent = 'Showing all products';
      } else {
        // Hide all main products first
        productCards.forEach(card => {
          card.classList.add('hidden');
          card.classList.remove('highlighted');
        });

        // Find and display matching subproducts as individual cards
        if (productsData) {
          console.log('Searching through', productsData.length, 'products for term:', searchTerm);
          productsData.forEach(product => {
            if (product.subproducts) {
              console.log('Checking product:', product.name, 'with', product.subproducts.length, 'subproducts');
              product.subproducts.forEach(subproduct => {
                const subproductName = subproduct.name.toLowerCase();
                const subproductSlug = subproduct.slug.toLowerCase();
                
                if (subproductName.includes(searchTerm) || subproductSlug.includes(searchTerm)) {
                  console.log('Found matching subproduct:', subproduct.name);
                  // Create subproduct result card with deep-linking and highlighting
                  const subproductCard = createDeepLinkSubproductCard(product, subproduct, searchTerm);
                  productsGrid.appendChild(subproductCard);
                  visibleCount++;
                }
              });
            }
          });
        } else {
          console.log('Products data not loaded yet, retrying...');
          // Retry loading data if not available
          fetch('assets/data/products.json')
            .then(response => response.json())
            .then(data => {
              productsData = data.products;
              console.log('Products data loaded on retry:', productsData.length, 'products');
              // Re-run search with loaded data
              searchProducts(searchTerm);
            })
            .catch(error => {
              console.error('Failed to load products data on retry:', error);
            });
        }

        // Also show main products that match directly
        productCards.forEach(card => {
          const cardText = card.textContent.toLowerCase();
          if (cardText.includes(searchTerm)) {
            card.classList.remove('hidden');
            card.classList.add('highlighted');
            
            // Highlight matching characters in main product names
            highlightMainProductName(card, searchTerm);
            visibleCount++;
          }
        });

        // Update results count
        if (visibleCount === 0) {
          showNoResults();
          if (resultsCount) resultsCount.textContent = 'No products or subproducts found';
        } else {
          if (resultsCount) resultsCount.textContent = `Found ${visibleCount} result${visibleCount === 1 ? '' : 's'}`;
        }
      }

      // Show/hide clear button
      if (clearButton) {
        if (searchTerm === '') {
          clearButton.classList.remove('visible');
        } else {
          clearButton.classList.add('visible');
        }
      }

      // Remove loading state
      productsGrid.classList.remove('search-loading');
    }

    // Create deep-linking subproduct card
    function createDeepLinkSubproductCard(parentProduct, subproduct, searchTerm) {
      const card = document.createElement('div');
      card.className = 'card product subproduct-search-result highlighted';
      
      // Create deep link to parent product page with subproduct anchor
      const deepLink = `product.html?slug=${parentProduct.slug}#${subproduct.slug}`;
      
      // Highlight matching characters in subproduct name (black text, so use green highlight)
      const highlightedSubproductName = highlightSearchTerm(subproduct.name, searchTerm, false);
      // Don't highlight parent name in badge - it's just for reference
      const highlightedParentName = parentProduct.name;
      
      card.innerHTML = `
        <a href="${deepLink}" class="subproduct-deep-link">
          <figure class="product-figure">
            <img src="${subproduct.image}" alt="${subproduct.name}" loading="lazy" decoding="async">
            <figcaption>${highlightedSubproductName}</figcaption>
          </figure>
          <div class="search-result-indicator">
            <span class="search-icon">🔍</span>
            <span class="search-text">Click to view</span>
          </div>
        </a>
        <div class="product-info">
          <div class="parent-product-badge">${highlightedParentName}</div>
        </div>
      `;
      
      // Store ID as data attribute for reference but don't display it
      card.setAttribute('data-subproduct-id', subproduct.slug);
      
      // Add click handler for deep-linking with scroll behavior
      const link = card.querySelector('.subproduct-deep-link');
      link.addEventListener('click', function(e) {
        e.preventDefault();
        navigateToSubproduct(parentProduct.slug, subproduct.slug);
      });
      
      return card;
    }


    // Function to highlight main product names
    function highlightMainProductName(card, searchTerm) {
      const figcaption = card.querySelector('figcaption');
      if (figcaption) {
        // Store original text if not already stored
        if (!figcaption.dataset.originalText) {
          figcaption.dataset.originalText = figcaption.textContent;
        }
        const originalText = figcaption.dataset.originalText;
        // Use green highlight for black text
        const highlightedText = highlightSearchTerm(originalText, searchTerm, false);
        figcaption.innerHTML = highlightedText;
      }
    }

    // Navigate to subproduct with deep-linking and highlighting
    function navigateToSubproduct(parentSlug, subproductSlug) {
      console.log('Navigating to subproduct:', parentSlug, subproductSlug);
      
      // Store the subproduct to highlight when the page loads
      sessionStorage.setItem('highlightSubproduct', subproductSlug);
      console.log('Stored subproduct in session storage:', subproductSlug);
      
      // Navigate to the parent product page
      const targetUrl = `product.html?slug=${parentSlug}#${subproductSlug}`;
      console.log('Navigating to URL:', targetUrl);
      window.location.href = targetUrl;
    }


    // Show no results message
    function showNoResults() {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'no-results';
      noResultsDiv.innerHTML = `
        <h3>No products or subproducts found</h3>
        <p>Try searching with different keywords like "copper", "aluminum", "steel", or specific subproduct names like "316"</p>
      `;
      productsGrid.appendChild(noResultsDiv);
    }

    // Event listeners
    searchInput.addEventListener('input', function() {
      searchProducts(this.value);
    });

    if (clearButton) {
      clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchProducts('');
        searchInput.focus();
      });
    }

    // Keyboard shortcuts
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.value = '';
        searchProducts('');
      }
    });

    // Store original text for all product cards on initialization
    function storeOriginalText() {
      const productCards = productsGrid.querySelectorAll('.card.product');
      productCards.forEach(card => {
        const figcaption = card.querySelector('figcaption');
        if (figcaption && !figcaption.dataset.originalText) {
          figcaption.dataset.originalText = figcaption.textContent;
        }
      });
    }

    // Initialize
    storeOriginalText();
    searchProducts('');
  }

  // Initialize product search when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductSearch);
  } else {
    initProductSearch();

  }

  // Subproduct search functionality
  function initSubproductSearch() {
    const searchInput = document.getElementById('subproduct-search-input');
    const clearButton = document.getElementById('clear-subproduct-search');
    const resultsCount = document.getElementById('subproduct-search-results-count');
    const subproductsGrid = document.getElementById('subproducts-grid');
    const searchContainer = document.getElementById('subproduct-search');
    
    if (!searchInput || !subproductsGrid) {
      return;
    }

    // Show search when subproducts are loaded
    function showSearch() {
      if (searchContainer) {
        searchContainer.style.display = 'block';
      }
    }

    // Simple search function for subproducts
    function searchSubproducts(term) {
      const searchTerm = term.toLowerCase().trim();
      const subproductCards = subproductsGrid.querySelectorAll('.card.product');
      let visibleCount = 0;
      

      // Remove existing no-results message
      const existingNoResults = subproductsGrid.querySelector('.no-results');
      if (existingNoResults) {
        existingNoResults.remove();
      }

      if (searchTerm === '') {
        // Show all subproducts and clear any highlighting
        subproductCards.forEach(card => {
          card.classList.remove('hidden', 'highlighted');
          
          // Clear any HTML highlighting from figcaptions
          const figcaption = card.querySelector('figcaption');
          if (figcaption) {
            // Store original text if not already stored
            if (!figcaption.dataset.originalText) {
              figcaption.dataset.originalText = figcaption.textContent;
            }
            // Restore original text content
            figcaption.textContent = figcaption.dataset.originalText;
          }
          
          visibleCount++;
        });
        if (resultsCount) resultsCount.textContent = 'Showing all subproducts';
      } else {
        // Filter subproducts based on text content
        subproductCards.forEach(card => {
          const cardText = card.textContent.toLowerCase();
          const isMatch = cardText.includes(searchTerm);
          
          if (isMatch) {
            card.classList.remove('hidden');
            card.classList.add('highlighted');
            
            // Apply highlighting to the figcaption text
            const figcaption = card.querySelector('figcaption');
            if (figcaption) {
              // Store original text if not already stored
              if (!figcaption.dataset.originalText) {
                figcaption.dataset.originalText = figcaption.textContent;
              }
              const originalText = figcaption.dataset.originalText;
              // Apply smart highlighting to subproduct names
              const highlightedText = smartHighlightSearchTerm(originalText, searchTerm);
              figcaption.innerHTML = highlightedText;
            }
            
            visibleCount++;
          } else {
            card.classList.add('hidden');
            card.classList.remove('highlighted');
          }
        });

        // Update results count
        if (visibleCount === 0) {
          showNoResults();
          if (resultsCount) resultsCount.textContent = 'No products or subproducts found';
        } else {
          if (resultsCount) resultsCount.textContent = `Found ${visibleCount} result${visibleCount === 1 ? '' : 's'}`;
        }
      }

      // Show/hide clear button
      if (clearButton) {
        if (searchTerm === '') {
          clearButton.classList.remove('visible');
        } else {
          clearButton.classList.add('visible');
        }
      }
    }

    // Show no results message
    function showNoResults() {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'no-results';
      noResultsDiv.innerHTML = `
        <h3>No products or subproducts found</h3>
        <p>Try searching with different keywords</p>
      `;
      subproductsGrid.appendChild(noResultsDiv);
    }

    // Event listeners
    searchInput.addEventListener('input', function() {
      searchSubproducts(this.value);
    });

    if (clearButton) {
      clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchSubproducts('');
        searchInput.focus();
      });
    }

    // Keyboard shortcuts
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.value = '';
        searchSubproducts('');
      }
    });

    // Store original text for all subproduct cards on initialization
    function storeSubproductOriginalText() {
      const subproductCards = subproductsGrid.querySelectorAll('.card.product');
      subproductCards.forEach(card => {
        const figcaption = card.querySelector('figcaption');
        if (figcaption && !figcaption.dataset.originalText) {
          figcaption.dataset.originalText = figcaption.textContent;
        }
      });
    }

    // Initialize
    storeSubproductOriginalText();
    searchSubproducts('');

    // Show search after a short delay to ensure subproducts are loaded
    setTimeout(showSearch, 500);
  }

  // Initialize subproduct search when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubproductSearch);
  } else {
    initSubproductSearch();
  }

  // Deep-linking functionality for product detail pages
  function initDeepLinking() {
    // Check if we're on a product detail page
    if (!window.location.pathname.includes('product.html')) {
      return;
    }

    // Check for subproduct to highlight from session storage
    const highlightSubproduct = sessionStorage.getItem('highlightSubproduct');
    if (highlightSubproduct) {
      // Clear the session storage
      sessionStorage.removeItem('highlightSubproduct');
      
      // Wait for subproducts to load, then highlight and scroll
      waitForSubproductsAndHighlight(highlightSubproduct);
    }

    // Also check URL hash for direct linking
    const urlHash = window.location.hash.substring(1);
    if (urlHash) {
      waitForSubproductsAndHighlight(urlHash);
    }
  }

  // Wait for subproducts to load and then highlight
  function waitForSubproductsAndHighlight(subproductSlug) {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max wait time
    
    function tryHighlight() {
      attempts++;
      console.log(`Attempt ${attempts}: Looking for subproduct with slug: ${subproductSlug}`);
      
      const subproductElement = document.querySelector(`[data-subproduct-slug="${subproductSlug}"]`);
      
      if (subproductElement) {
        console.log('Found subproduct element, highlighting...');
        highlightAndScrollToSubproduct(subproductSlug);
        return;
      }
      
      if (attempts < maxAttempts) {
        console.log(`Subproduct not found yet, retrying in 500ms... (attempt ${attempts}/${maxAttempts})`);
        setTimeout(tryHighlight, 500);
      } else {
        console.warn(`Could not find subproduct with slug: ${subproductSlug} after ${maxAttempts} attempts`);
        // Try to find by partial match as fallback
        const partialMatch = document.querySelector(`[data-subproduct-slug*="${subproductSlug}"]`);
        if (partialMatch) {
          console.log('Found partial match, highlighting...');
          highlightAndScrollToSubproduct(subproductSlug);
        }
      }
    }
    
    // Start trying after a short delay
    setTimeout(tryHighlight, 500);
  }

  // Highlight and scroll to specific subproduct
  function highlightAndScrollToSubproduct(subproductSlug) {
    const subproductElement = document.querySelector(`[data-subproduct-slug="${subproductSlug}"]`);
    
    if (subproductElement) {
      console.log('Highlighting subproduct element:', subproductElement);
      
      // Add highlighting class
      subproductElement.classList.add('highlighted-subproduct');
      
      // Ensure the element is visible
      subproductElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Additional scroll adjustment for header
      setTimeout(() => {
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
        const elementTop = subproductElement.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: Math.max(0, elementTop),
          behavior: 'smooth'
        });
      }, 100);

      // Add a professional pulsing effect
      subproductElement.style.animation = 'professional-highlight 2s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Remove highlighting after 2.5 seconds
      setTimeout(() => {
        subproductElement.classList.remove('highlighted-subproduct');
        subproductElement.style.animation = '';
      }, 2500);
      
      // Add a temporary focus for accessibility
      subproductElement.setAttribute('tabindex', '-1');
      subproductElement.focus();
      
    } else {
      console.warn(`Subproduct element not found for slug: ${subproductSlug}`);
      // Log all available subproduct elements for debugging
      const allSubproducts = document.querySelectorAll('[data-subproduct-slug]');
      console.log('Available subproduct slugs:', Array.from(allSubproducts).map(el => el.getAttribute('data-subproduct-slug')));
    }
  }

  // Initialize deep-linking when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeepLinking);
  } else {
    initDeepLinking();
  }

  // Expose function for external scripts to trigger deep-linking
  window.initDeepLinkingAfterRender = function() {
    console.log('Deep-linking triggered after subproducts render');
    
    // Check for subproduct to highlight from session storage
    const highlightSubproduct = sessionStorage.getItem('highlightSubproduct');
    if (highlightSubproduct) {
      console.log('Found subproduct to highlight from session storage:', highlightSubproduct);
      sessionStorage.removeItem('highlightSubproduct');
      highlightAndScrollToSubproduct(highlightSubproduct);
      return;
    }

    // Also check URL hash for direct linking
    const urlHash = window.location.hash.substring(1);
    if (urlHash) {
      console.log('Found subproduct to highlight from URL hash:', urlHash);
      highlightAndScrollToSubproduct(urlHash);
    }
  };

  // Contact form validation and submit via configured endpoint
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const fullname = document.getElementById('fullname');
      const contact = document.getElementById('contact');
      const email = document.getElementById('email');
      const organization = document.getElementById('organization');
      const country = document.getElementById('country');
      const type = document.getElementById('type');
      const message = document.getElementById('message');
      const privacy = document.getElementById('privacy');
      const result = document.getElementById('form-result');

      let valid = true;
      function setError(input, msg) {
        let error;
        // Special handling for privacy checkbox due to its nested structure
        if (input && input.id === 'privacy') {
          error = input.closest('.form-checkbox').querySelector('.error');
        } else {
          error = input.parentElement.querySelector('.error');
        }
        
        if (error) {
          if (msg) {
            error.textContent = msg;
            error.classList.add('show'); // Show error message
          } else {
            error.textContent = '';
            error.classList.remove('show'); // Hide error message
          }
        }
      }

      // Clear all errors (hide them)
      [fullname, contact, email, organization, country, type, message, privacy].forEach(function (input) { 
        if (input) setError(input, ''); 
      });

      // Validate required fields
      if (!fullname || !fullname.value.trim()) { 
        if (fullname) setError(fullname, 'Please enter full name.'); 
        valid = false; 
      }
      
      if (!contact || !contact.value.trim()) { 
        if (contact) setError(contact, 'Not a valid phone number.'); 
        valid = false; 
      } else if (contact && !contact.value.match(/^\+?[0-9\-()\s]{7,20}$/)) { 
        setError(contact, 'Not a valid phone number.'); 
        valid = false; 
      }
      
      if (!email || !email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { 
        if (email) setError(email, 'Please enter email.'); 
        valid = false; 
      }
      
      if (!organization || !organization.value.trim()) { 
        if (organization) setError(organization, 'Please enter organization.'); 
        valid = false; 
      }
      
      if (!country || !country.value) { 
        if (country) setError(country, 'Please select country.'); 
        valid = false; 
      }
      
      if (!type || !type.value) { 
        if (type) setError(type, 'Please select category.'); 
        valid = false; 
      }
      
      if (!message || !message.value.trim()) { 
        if (message) setError(message, 'Please enter your message.'); 
        valid = false; 
      }
      
      if (!privacy || !privacy.checked) {
        if (privacy) setError(privacy, 'Please accept the privacy policy to continue.');
        valid = false;
      }

      if (!valid) return;

      var endpoint = (window.AppConfig && window.AppConfig.contactEndpoint) || '';
      if (!endpoint) {
        if (result) {
          result.textContent = 'Submission endpoint is not configured.';
          result.className = 'form-result error';
        }
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.setAttribute('disabled', 'true');
        submitBtn.classList.add('is-loading');
      }
      
      if (result) {
        result.textContent = 'Sending...';
        result.className = 'form-result';
      }

      var payload = {
        fullname: fullname ? fullname.value.trim() : '',
        contact: contact ? contact.value.trim() : '',
        email: email ? email.value.trim() : '',
        organization: organization ? organization.value.trim() : '',
        country: country ? country.value : '',
        type: type ? type.value : '',
        message: message ? message.value.trim() : '',
        page: window.location.href,
        submittedAt: new Date().toISOString()
      };

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json().catch(function(){ return {}; });
      }).then(function () {
        if (result) {
          result.textContent = 'Thanks! Your message has been sent.';
          result.className = 'form-result success';
        }
        form.reset();
        setTimeout(function () { 
          if (result) {
            result.textContent = ''; 
            result.className = 'form-result';
          }
        }, 5000);
      }).catch(function (err) {
        console.error(err);
        if (result) {
          result.textContent = 'Sorry, there was a problem sending your message. Please try again later.';
          result.className = 'form-result error';
        }
      }).finally(function(){
        if (submitBtn) {
          submitBtn.removeAttribute('disabled');
          submitBtn.classList.remove('is-loading');
        }
      });
    });

    // Add real-time validation for privacy checkbox
    if (privacy) {
      privacy.addEventListener('change', function() {
        if (this.checked) {
          setError(this, ''); // Clear error when checked
        }
      });
    }
  }

  // Image attributes and resilient fallbacks without rewriting working paths
  document.addEventListener('DOMContentLoaded', function () {
    function attachImgHandlers(img) {
      if (!img || img.__hasFallbackListener) return;
      img.__hasFallbackListener = true;
      var triedAlt = false;
      img.addEventListener('error', function () {
        if (triedAlt) return;
        triedAlt = true;
        var fallback = img.getAttribute('data-fallback');
        if (fallback && fallback !== img.getAttribute('src')) {
          img.setAttribute('src', fallback);
          return;
        }
        var current = img.getAttribute('src') || '';
        if (current.startsWith('/')) {
          img.setAttribute('src', current.replace(/^\//, ''));
        } else if (current.startsWith('./')) {
          img.setAttribute('src', current.slice(2));
        } else if (current.startsWith('assets/')) {
          img.setAttribute('src', './' + current);
        } else {
          img.setAttribute('src', '/' + current);
        }
      }, { once: true });
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }

    document.querySelectorAll('img').forEach(attachImgHandlers);

    // Observe future images (e.g., rendered by catalog.js)
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes && m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName && node.tagName.toLowerCase() === 'img') {
            attachImgHandlers(node);
          } else {
            node.querySelectorAll && node.querySelectorAll('img').forEach(attachImgHandlers);
          }
        });
      });
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
  });

  // NUCLEAR OPTION: Completely disable tooltips and replace links with clickable divs
  function disableProductTooltips() {
    function processProductCards() {
      const productLinks = document.querySelectorAll('.card.product a[href]');
      productLinks.forEach(link => {
        // Get the href before we destroy the link
        const href = link.getAttribute('href');
        
        // Create a new div to replace the link
        const clickableDiv = document.createElement('div');
        clickableDiv.style.cursor = 'pointer';
        clickableDiv.style.pointerEvents = 'auto';
        clickableDiv.style.userSelect = 'text';
        clickableDiv.style.webkitUserSelect = 'text';
        clickableDiv.style.mozUserSelect = 'text';
        clickableDiv.style.msUserSelect = 'text';
        
        // Move all children from link to div
        while (link.firstChild) {
          clickableDiv.appendChild(link.firstChild);
        }
        
        // Add click handler to navigate
        clickableDiv.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = href;
        });
        
        // Replace the link with the div
        link.parentNode.replaceChild(clickableDiv, link);
      });
      
      // Make all figcaptions fully selectable
      const figcaptions = document.querySelectorAll('.card.product figcaption');
      figcaptions.forEach(caption => {
        caption.style.pointerEvents = 'auto';
        caption.style.cursor = 'text';
        caption.style.userSelect = 'text';
        caption.style.webkitUserSelect = 'text';
        caption.style.mozUserSelect = 'text';
        caption.style.msUserSelect = 'text';
        
        // Remove any attributes that could cause tooltips
        caption.removeAttribute('title');
        caption.removeAttribute('aria-label');
      });
    }
    
    // Process existing cards
    processProductCards();
    
    // Process dynamically created elements
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            // Check if this node or its children contain product cards
            if (node.classList && node.classList.contains('card') && node.classList.contains('product')) {
              processProductCards();
            } else if (node.querySelectorAll) {
              const productCards = node.querySelectorAll('.card.product');
              if (productCards.length > 0) {
                processProductCards();
              }
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Add click handlers for div-based product cards
  function addClickHandlers() {
    const productDivs = document.querySelectorAll('.card.product div[data-href]');
    productDivs.forEach(div => {
      div.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const href = this.getAttribute('data-href');
        if (href) {
          window.location.href = href;
        }
      });
    });
  }

  // Image intersection observer for dynamic animations
  function initImageAnimations() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: add animation class to all images immediately
      document.querySelectorAll('img').forEach(img => {
        addRandomAnimation(img);
      });
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          addRandomAnimation(img);
          img.classList.add('in-view');
          observer.unobserve(img); // Stop observing once animated
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Function to add random animation based on image context
    function addRandomAnimation(img) {
      const animations = ['image-fade-in', 'image-bounce-in', 'image-slide-left', 'image-slide-right'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      
      // Special animations for specific image types
      if (img.closest('.card.product')) {
        img.classList.add('image-bounce-in');
      } else if (img.closest('.impact-row')) {
        img.classList.add('image-slide-left');
      } else if (img.closest('.carousel-slide')) {
        img.classList.add('image-fade-in');
      } else {
        img.classList.add(randomAnimation);
      }
    }

    // Observe all images
    document.querySelectorAll('img').forEach(img => {
      img.classList.add('image-observe');
      imageObserver.observe(img);
    });

    // Observe dynamically added images
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName && node.tagName.toLowerCase() === 'img') {
              node.classList.add('image-observe');
              imageObserver.observe(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('img').forEach(img => {
                img.classList.add('image-observe');
                imageObserver.observe(img);
              });
            }
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Add click animations for interactive images
    document.addEventListener('click', function(e) {
      const img = e.target.closest('img');
      if (img && img.closest('.card.product')) {
        img.classList.add('image-pulse');
        setTimeout(() => img.classList.remove('image-pulse'), 300);
      }
    });
  }

  // Initialize tooltip disabling when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      disableProductTooltips();
      addClickHandlers();
      initImageAnimations();
    });
  } else {
    disableProductTooltips();
    addClickHandlers();
    initImageAnimations();
  }
})();




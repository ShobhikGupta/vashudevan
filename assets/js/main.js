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
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Close menu when clicking on overlay
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target === nav) {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Mobile submenu toggle with smooth accordion animation
  submenuParents.forEach(function (parent) {
    const link = parent.querySelector(':scope > a');
    const submenu = parent.querySelector('.submenu');
    
    if (link && submenu) {
      link.addEventListener('click', function (e) {
        if (window.matchMedia('(max-width: 768px)').matches) {
          e.preventDefault();
          
          // Toggle the open class
          const isOpening = !parent.classList.contains('open');
          parent.classList.toggle('open');
          
          // Remove any active state from parent link when submenu opens
          if (isOpening) {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
          
          // Calculate the actual height needed for smooth animation
          if (isOpening) {
            // Opening: measure the content height
            submenu.style.maxHeight = 'none';
            const contentHeight = submenu.scrollHeight;
            submenu.style.maxHeight = '0';
            
            // Force reflow
            submenu.offsetHeight;
            
            // Animate to the calculated height
            submenu.style.maxHeight = contentHeight + 'px';
            
            // Clean up after animation
            setTimeout(() => {
              if (parent.classList.contains('open')) {
                submenu.style.maxHeight = 'none';
              }
            }, 300);
          } else {
            // Closing: animate to 0 height
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            
            // Force reflow
            submenu.offsetHeight;
            
            // Animate to 0
            submenu.style.maxHeight = '0px';
          }
        }
      });
    }
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
      // Get footer position for more accurate threshold
      const footer = document.querySelector('.site-footer');
      const footerTop = footer ? footer.offsetTop : 800;
      const threshold = footerTop - window.innerHeight + 200; // 200px before footer comes into view
      
      if (window.scrollY > threshold) {
        backToTopButton.classList.add('visible');
        // Add a small delay to make animation more noticeable
        setTimeout(() => {
          document.body.classList.add('scroll-top-visible');
        }, 200);
      } else {
        backToTopButton.classList.remove('visible');
        // Remove class immediately when scrolling up past footer
        document.body.classList.remove('scroll-top-visible');
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
        
        // Trigger hero button animation if present
        const heroBtns = slides[index].querySelectorAll('.hero-btn');
        heroBtns.forEach((btn, btnIndex) => {
          // Remove animation class first to reset
          btn.classList.remove('animate');
          // Force reflow
          btn.offsetHeight;
          // Add animation class with a staggered delay
          setTimeout(() => {
            btn.classList.add('animate');
          }, 300 + (btnIndex * 200));
        });
      }
      if (indicators[index]) {
        indicators[index].classList.add('active');
        // Start the progress bar animation with appropriate timing
        const progressTiming = index === 0 ? '5s' : '4s';
        indicators[index].style.animation = `progressBar ${progressTiming} linear forwards`;
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
      
      // Determine timing based on current slide
      const timing = currentSlide === 0 ? 5000 : 4000; // 5 seconds for slide 1, 4 seconds for others
      
      autoPlayInterval = setInterval(() => {
        console.log('Hero carousel auto-advancing from slide', currentSlide + 1);
        nextSlide();
      }, timing);
      console.log('Hero carousel auto-play started with', timing, 'ms timing for slide', currentSlide + 1);
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
  function highlightSearchTerm(text, searchTerm, highlightType = false) {
    if (!searchTerm || searchTerm.trim() === '') {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    let highlightClass;
    
    if (highlightType === 'yellow-text') {
      highlightClass = 'search-highlight-yellow-text';
    } else if (highlightType === true || highlightType === 'green') {
      highlightClass = 'search-highlight-black';
    } else {
      highlightClass = 'search-highlight-yellow';
    }
    
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
  }

  // Smart highlighting function that detects text color context and applies appropriate contrast
  function smartHighlightSearchTerm(text, searchTerm, contextElement = null) {
    if (!searchTerm || searchTerm.trim() === '') {
      return text;
    }
    
    // If contextElement is provided, detect the text color
    if (contextElement) {
      const computedStyle = window.getComputedStyle(contextElement);
      const textColor = computedStyle.color;
      
      // Parse RGB values to determine if text is light or dark
      const rgbMatch = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        
        // Calculate luminance to determine if text is light or dark
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // If text is light (yellow/light colored), use black background
        // If text is dark (black/dark colored), use yellow background
        if (luminance > 0.5) {
          return highlightSearchTerm(text, searchTerm, 'yellow-text');
        } else {
          return highlightSearchTerm(text, searchTerm, false);
        }
      }
    }
    
    // Fallback: assume black text and use yellow highlighting
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
          
          // Parent product badges are not highlighted, so no need to clear them
          
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
      
      // Highlight matching characters in subproduct name with smart color detection
      // We'll apply the highlighting after the card is created and added to DOM
      const highlightedSubproductName = subproduct.name;
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
      
      // Apply smart highlighting after the card is created
      const figcaption = card.querySelector('.product-figure figcaption');
      if (figcaption) {
        const highlightedText = smartHighlightSearchTerm(subproduct.name, searchTerm, figcaption);
        figcaption.innerHTML = highlightedText;
      }
      
      // Parent product badges should not be highlighted - they serve categorization purposes
      
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
        // Use smart highlighting with color detection
        const highlightedText = smartHighlightSearchTerm(originalText, searchTerm, figcaption);
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
    // Clear any previous search value from browser autocomplete
    searchInput.value = '';
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
          
          // Parent product badges are not highlighted, so no need to clear them
          
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
              const highlightedText = smartHighlightSearchTerm(originalText, searchTerm, figcaption);
              figcaption.innerHTML = highlightedText;
            }
            
            // Parent product badges should not be highlighted - they serve categorization purposes
            
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
      // If no custom endpoint is configured, skip this default handler entirely
      // to allow the inline Google Apps Script handler to process the submit.
      var endpointEarly = (window.AppConfig && window.AppConfig.contactEndpoint) || '';
      if (!endpointEarly) {
        return;
      }
      const fullname = document.getElementById('fullname');
      const contact = document.getElementById('contact');
      const email = document.getElementById('emailID') || document.getElementById('email');
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
      // Mark loaded to counter CSS opacity for lazy images
      var markLoaded = function(){ img.classList.add('loaded'); };
      img.addEventListener('load', markLoaded, { once: true });
      if (img.complete) { markLoaded(); }
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

    // Function to add regular animation to all images
    function addRandomAnimation(img) {
      // All images use the same elegant zoom animation
      img.classList.add('image-elegant-zoom');
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
        img.classList.add('image-modern-pulse');
        setTimeout(() => img.classList.remove('image-modern-pulse'), 400);
      }
    });
  }

  // Initialize tooltip disabling when DOM is loaded
  function safe(fn){ try { fn && fn(); } catch(e) { console.error('Init error:', e); } }
  function onReady(){
    safe(disableProductTooltips);
    safe(addClickHandlers);
    // Image animations disabled per request
    safe(window.initWhatsAppFloat);
    safe(window.initOpeningPopup);
    // Initialize intl-tel-input for main contact form (default: India)
    safe(function(){
      var phoneInput = document.getElementById('contact');
      if (!phoneInput) {
        console.error('Phone input element not found');
        return;
      }
      
      function loadCss(href){ 
        try { 
          var link = document.getElementById('__iti_css__'); 
          if (!link) { 
            link = document.createElement('link'); 
            link.id='__iti_css__'; 
            link.rel='stylesheet'; 
            link.href=href; 
            document.head.appendChild(link); 
            console.log('intl-tel-input CSS loaded');
          } 
        } catch(e) {
          console.error('Failed to load CSS:', e);
        } 
      }
      
      function loadScript(src, cb){ 
        var s = document.getElementById('__iti_js__'); 
        if (window.intlTelInput) { 
          console.log('intl-tel-input already loaded');
          cb && cb(); 
          return; 
        } 
        if (!s) { 
          s = document.createElement('script'); 
          s.id='__iti_js__'; 
          s.src=src; 
          s.async=true; 
          s.onload=function(){
            console.log('intl-tel-input JS loaded');
            cb && cb();
          }; 
          s.onerror=function(e){
            console.error('Failed to load intl-tel-input JS:', e);
          }; 
          document.head.appendChild(s);
        } else { 
          s.onload = cb; 
        } 
      }
      
      var cssUrl = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/css/intlTelInput.min.css';
      var jsUrl = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/intlTelInput.min.js';
      var utilsUrl = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/utils.js';
      
      console.log('Loading intl-tel-input library...');
      loadCss(cssUrl);
      loadScript(jsUrl, function(){
        try {
          console.log('Initializing intl-tel-input on phone input...');
          var iti = window.intlTelInput(phoneInput, {
            initialCountry: 'in',
            separateDialCode: true,
            nationalMode: false,
            autoPlaceholder: 'aggressive',
            utilsScript: utilsUrl
          });
          phoneInput._iti = iti;
          console.log('intl-tel-input initialized successfully with separateDialCode: true');
          
          // Sync with country select if present
          var countrySelect = document.getElementById('country');
          if (countrySelect) {
            // Create a mapping from country names to ISO2 codes
            var countryMapping = {
              'afghanistan': 'af', 'albania': 'al', 'algeria': 'dz', 'andorra': 'ad', 'angola': 'ao',
              'argentina': 'ar', 'armenia': 'am', 'australia': 'au', 'austria': 'at', 'azerbaijan': 'az',
              'bahamas': 'bs', 'bahrain': 'bh', 'bangladesh': 'bd', 'belarus': 'by', 'belgium': 'be',
              'belize': 'bz', 'benin': 'bj', 'bhutan': 'bt', 'bolivia': 'bo', 'bosnia-and-herzegovina': 'ba',
              'botswana': 'bw', 'brazil': 'br', 'brunei': 'bn', 'bulgaria': 'bg', 'burkina-faso': 'bf',
              'burundi': 'bi', 'cambodia': 'kh', 'cameroon': 'cm', 'canada': 'ca', 'central-african-republic': 'cf',
              'chad': 'td', 'chile': 'cl', 'china': 'cn', 'colombia': 'co', 'comoros': 'km', 'congo': 'cg',
              'congo-democratic-republic': 'cd', 'costa-rica': 'cr', 'cote-divoire': 'ci', 'croatia': 'hr',
              'cuba': 'cu', 'cyprus': 'cy', 'czech-republic': 'cz', 'denmark': 'dk', 'djibouti': 'dj',
              'dominica': 'dm', 'dominican-republic': 'do', 'ecuador': 'ec', 'egypt': 'eg', 'el-salvador': 'sv',
              'equatorial-guinea': 'gq', 'eritrea': 'er', 'estonia': 'ee', 'eswatini': 'sz', 'ethiopia': 'et',
              'fiji': 'fj', 'finland': 'fi', 'france': 'fr', 'gabon': 'ga', 'gambia': 'gm', 'georgia': 'ge',
              'germany': 'de', 'ghana': 'gh', 'greece': 'gr', 'grenada': 'gd', 'guatemala': 'gt', 'guinea': 'gn',
              'guinea-bissau': 'gw', 'guyana': 'gy', 'haiti': 'ht', 'honduras': 'hn', 'hungary': 'hu',
              'iceland': 'is', 'india': 'in', 'indonesia': 'id', 'iran': 'ir', 'iraq': 'iq', 'ireland': 'ie',
              'israel': 'il', 'italy': 'it', 'jamaica': 'jm', 'japan': 'jp', 'jordan': 'jo', 'kazakhstan': 'kz',
              'kenya': 'ke', 'kiribati': 'ki', 'korea-north': 'kp', 'korea-south': 'kr', 'kuwait': 'kw',
              'kyrgyzstan': 'kg', 'laos': 'la', 'latvia': 'lv', 'lebanon': 'lb', 'lesotho': 'ls', 'liberia': 'lr',
              'libya': 'ly', 'liechtenstein': 'li', 'lithuania': 'lt', 'luxembourg': 'lu', 'madagascar': 'mg',
              'malawi': 'mw', 'malaysia': 'my', 'maldives': 'mv', 'mali': 'ml', 'malta': 'mt',
              'marshall-islands': 'mh', 'mauritania': 'mr', 'mauritius': 'mu', 'mexico': 'mx', 'micronesia': 'fm',
              'moldova': 'md', 'monaco': 'mc', 'mongolia': 'mn', 'montenegro': 'me', 'morocco': 'ma',
              'mozambique': 'mz', 'myanmar': 'mm', 'namibia': 'na', 'nauru': 'nr', 'nepal': 'np',
              'netherlands': 'nl', 'new-zealand': 'nz', 'nicaragua': 'ni', 'niger': 'ne', 'nigeria': 'ng',
              'north-macedonia': 'mk', 'norway': 'no', 'oman': 'om', 'pakistan': 'pk', 'palau': 'pw',
              'palestine': 'ps', 'panama': 'pa', 'papua-new-guinea': 'pg', 'paraguay': 'py', 'peru': 'pe',
              'philippines': 'ph', 'poland': 'pl', 'portugal': 'pt', 'qatar': 'qa', 'romania': 'ro',
              'russia': 'ru', 'rwanda': 'rw', 'samoa': 'ws', 'san-marino': 'sm', 'sao-tome-and-principe': 'st',
              'saudi-arabia': 'sa', 'senegal': 'sn', 'serbia': 'rs', 'seychelles': 'sc', 'sierra-leone': 'sl',
              'singapore': 'sg', 'slovakia': 'sk', 'slovenia': 'si', 'solomon-islands': 'sb', 'somalia': 'so',
              'south-africa': 'za', 'south-sudan': 'ss', 'spain': 'es', 'sri-lanka': 'lk', 'sudan': 'sd',
              'suriname': 'sr', 'sweden': 'se', 'switzerland': 'ch', 'syria': 'sy', 'taiwan': 'tw',
              'tajikistan': 'tj', 'tanzania': 'tz', 'thailand': 'th', 'timor-leste': 'tl', 'togo': 'tg',
              'tonga': 'to', 'trinidad-and-tobago': 'tt', 'tunisia': 'tn', 'turkey': 'tr', 'turkmenistan': 'tm',
              'tuvalu': 'tv', 'uganda': 'ug', 'ukraine': 'ua', 'united-arab-emirates': 'ae',
              'united-kingdom': 'gb', 'united-states': 'us', 'uruguay': 'uy', 'uzbekistan': 'uz',
              'vanuatu': 'vu', 'vatican-city': 'va', 'venezuela': 've', 'vietnam': 'vn', 'yemen': 'ye',
              'zambia': 'zm', 'zimbabwe': 'zw'
            };
            // expose globally for other helpers/fallbacks
            try { window.countryMapping = countryMapping; } catch(_) {}
            
            function syncCountryToPhone() {
              if (!iti || !countrySelect) return;
              var selectedValue = countrySelect.value;
              console.log('Country selected:', selectedValue);
              
              if (selectedValue && countryMapping[selectedValue]) {
                var iso2 = countryMapping[selectedValue];
                iti.setCountry(iso2);
                var countryData = iti.getSelectedCountryData();
                console.log('Main form: Country synced to', countryData.name, '+' + countryData.dialCode);
                try {
                  var codeEl1 = document.getElementById('contact-dial-code');
                  if (codeEl1 && countryData && countryData.dialCode) {
                    codeEl1.textContent = '+' + String(countryData.dialCode);
                  }
                } catch(_) {}
              }
            }
            
            countrySelect.addEventListener('change', function(){ 
              console.log('Country change event triggered');
              syncCountryToPhone();
            });
            countrySelect.addEventListener('input', syncCountryToPhone);
            
            // Set initial sync
            syncCountryToPhone();
          }
          
          console.log('intl-tel-input initialized for main contact form with India as default');
        } catch(e) {
          console.error('Failed to initialize intl-tel-input:', e);
        }
      });
    });
    
    // Fallback initialization in case DOM ready already fired
    setTimeout(function(){
      var phoneInput = document.getElementById('contact');
      if (phoneInput && !phoneInput._iti) {
        console.log('Fallback: Initializing intl-tel-input (respecting current selection)...');
        var countrySelect = document.getElementById('country');
        var selectedValue = (countrySelect && countrySelect.value) ? countrySelect.value : 'india';
        var iso2 = (window.countryMapping && window.countryMapping[selectedValue]) || 'in';
        if (window.intlTelInput) {
          try {
            var iti = window.intlTelInput(phoneInput, {
              initialCountry: iso2,
              separateDialCode: true,
              nationalMode: false,
              autoPlaceholder: 'aggressive',
              utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/utils.js'
            });
            phoneInput._iti = iti;
            console.log('Fallback: intl-tel-input initialized with', iso2);
          } catch(e) {
            console.error('Fallback: Failed to initialize intl-tel-input:', e);
          }
        }
      }
    }, 1000);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();

// Floating WhatsApp chat button
(function(){
  function initWhatsAppFloat() {
    try {
      var existing = document.getElementById('whatsapp-float');
      if (existing) return;

      var link = document.createElement('a');
      link.id = 'whatsapp-float';
      link.className = 'whatsapp-float';
      link.href = 'https://wa.me/919879208178?text=Hello%2C%20I%20visited%20your%20website%20and%20want%20to%20know%20more.';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', 'Chat with us on WhatsApp');

      // Use the provided PNG asset (with cache-busting)
      var logoSrc = 'assets/img/whatsapp-logo.png?v=' + Date.now();
      link.innerHTML = '\n        <img src="' + logoSrc + '" alt="WhatsApp" decoding="async" />\n        <span class="whatsapp-tooltip">Chat with us</span>\n      ';

      // Ensure the image becomes visible despite global lazy opacity rule
      var img = link.querySelector('img');
      if (img) {
        var markLoaded = function(){ img.classList.add('loaded'); };
        // Add load handler and handle cached case
        img.addEventListener('load', markLoaded, { once: true });
        if (img.complete) { markLoaded(); }
      }

      // Append near end of body
      (document.body || document.documentElement).appendChild(link);

      // Prevent overlapping critical UI (e.g., back-to-top on right side)
      // Button is bottom-left; ensure it doesn't block footer actions by raising z-index and keeping distance.
    } catch (e) {
      console.error('Failed to initialize WhatsApp button', e);
    }
  }

  // Expose for reuse if needed elsewhere
  window.initWhatsAppFloat = initWhatsAppFloat;
})();


// Lightweight country code sync for contact form custom phone input
document.addEventListener('DOMContentLoaded', function() {
  try {
    var countrySelect = document.getElementById('country');
    var codeEl = document.getElementById('contact-dial-code');
    var phoneEl = document.getElementById('contact');
    if (!countrySelect || !codeEl || !phoneEl) return;

    // Build a robust slug -> {iso2, dialCode} map from intl-tel-input data
    function slugify(s){
      return String(s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    var slugToCountry = {};
    try {
      var cdList = (window.intlTelInputGlobals && window.intlTelInputGlobals.getCountryData)
        ? window.intlTelInputGlobals.getCountryData()
        : [];
      for (var i = 0; i < cdList.length; i++) {
        var cd = cdList[i];
        var base = slugify(cd.name);
        slugToCountry[base] = { iso2: cd.iso2, dialCode: String(cd.dialCode) };
        // Provide a few tolerant variants to match our select values
        // Remove common fillers like "of-the"
        var noOfThe = base.replace(/-of-the/g, '');
        slugToCountry[noOfThe] = slugToCountry[base];
        // Compact articles e.g., cote-d-ivoire -> cote-divoire
        var compactArticles = base.replace(/-d-/g, '-');
        slugToCountry[compactArticles] = slugToCountry[base];
      }
      // Also wire our existing value->iso2 mapping if present
      if (window.countryMapping) {
        Object.keys(window.countryMapping).forEach(function(val){
          var iso2 = window.countryMapping[val];
          var entry = null;
          var byText = slugToCountry[slugify(val)];
          if (byText && byText.dialCode) { entry = byText; }
          else if (window.iso2ToDial && window.iso2ToDial[iso2]) { entry = { iso2: iso2, dialCode: window.iso2ToDial[iso2] }; }
          if (entry) slugToCountry[slugify(val)] = entry;
        });
      }
    } catch(_){ }

    function getSelectedInfo(){
      var opt = countrySelect.options[countrySelect.selectedIndex];
      var value = countrySelect.value || '';
      var valSlug = slugify(value);
      var textSlug = slugify(opt ? opt.text : '');

      // 1) Prefer exact mapping value -> iso2 -> dial
      var iso2 = (window.countryMapping && window.countryMapping[value]) || null;
      if (!iso2 && window.countryMapping) {
        // try text slug lookup against keys
        Object.keys(window.countryMapping).some(function(k){
          if (slugify(k) === textSlug) { iso2 = window.countryMapping[k]; return true; }
          return false;
        });
      }
      if (iso2 && window.iso2ToDial && window.iso2ToDial[iso2]) {
        return { iso2: iso2, dial: String(window.iso2ToDial[iso2]) };
      }

      // 2) Use slug map built from intl data
      var match = slugToCountry[valSlug] || slugToCountry[textSlug];
      if (match) return { iso2: match.iso2, dial: match.dialCode };

      // 3) Fallback to plugin current selection
      try {
        if (phoneEl._iti && typeof phoneEl._iti.getSelectedCountryData === 'function') {
          var cur = phoneEl._iti.getSelectedCountryData();
          if (cur && cur.iso2 && cur.dialCode) return { iso2: cur.iso2, dial: String(cur.dialCode) };
        }
      } catch(_){ }

      return { iso2: 'in', dial: '91' };
    }

    function updateDialCode(){
      var info = getSelectedInfo();
      codeEl.textContent = '+' + info.dial;
      // If plugin exists, try to keep it in sync as well
      try {
        if (phoneEl._iti && typeof phoneEl._iti.setCountry === 'function' && info.iso2) {
          phoneEl._iti.setCountry(info.iso2);
        }
      } catch(_){ }
    }

    var timer = null;
    function scheduleUpdate(){
      if (timer) clearTimeout(timer);
      timer = setTimeout(updateDialCode, 50); // allow other listeners (like setCountry) first
    }

    // Precompute dial codes for each <option> for deterministic lookups
    (function buildOptionDialMap(){
      try {
        var countryData = (window.intlTelInputGlobals && window.intlTelInputGlobals.getCountryData)
          ? window.intlTelInputGlobals.getCountryData()
          : [];
        var byIso2 = {};
        for (var i=0;i<countryData.length;i++){ byIso2[countryData[i].iso2] = String(countryData[i].dialCode); }
        for (var j=0;j<countrySelect.options.length;j++){
          var opt = countrySelect.options[j];
          var v = opt.value || '';
          var iso2 = (window.countryMapping && window.countryMapping[v]) || null;
          if (!iso2) {
            // try match by text against our slug map
            var m = slugToCountry[slugify(opt.text)];
            if (m) iso2 = m.iso2;
          }
          var dial = (iso2 && (window.iso2ToDial && window.iso2ToDial[iso2])) ? window.iso2ToDial[iso2]
                    : (iso2 && byIso2[iso2]) ? byIso2[iso2]
                    : null;
          if (!dial) {
            var m2 = slugToCountry[slugify(opt.text)] || slugToCountry[slugify(v)];
            if (m2) dial = m2.dialCode;
          }
          if (dial) opt.dataset.dial = String(dial);
        }
      } catch(_){ }
    })();

    function updateFromOption(){
      var sel = countrySelect.options[countrySelect.selectedIndex];
      var info = getSelectedInfo();
      // Prefer driving plugin by iso2 derived from dropdown for 100% accuracy
      try {
        if (phoneEl._iti && typeof phoneEl._iti.setCountry === 'function' && info.iso2) {
          phoneEl._iti.setCountry(info.iso2);
          setTimeout(function(){
            try {
              var cd = phoneEl._iti.getSelectedCountryData();
              if (cd && cd.dialCode) { codeEl.textContent = '+' + String(cd.dialCode); return; }
            } catch(_) {}
            codeEl.textContent = '+' + info.dial;
          }, 10);
          return;
        }
      } catch(_) {}
      var dial = (sel && sel.dataset && sel.dataset.dial) ? sel.dataset.dial : info.dial;
      codeEl.textContent = '+' + dial;
    }

    countrySelect.addEventListener('change', function(){ scheduleUpdate(); setTimeout(updateFromOption, 20); });
    countrySelect.addEventListener('input', function(){ scheduleUpdate(); setTimeout(updateFromOption, 20); });
    // Initial default: use India only if nothing selected; otherwise honor current selection
    if (!countrySelect.value) { countrySelect.value = 'india'; }
    setTimeout(function(){
      try {
        if (phoneEl._iti) {
          var info = getSelectedInfo();
          if (info && info.iso2) { phoneEl._iti.setCountry(info.iso2); }
        }
      } catch(_){}
      updateFromOption();
    }, 250);

    // Also react when phone plugin country changes
    phoneEl.addEventListener('countrychange', function(){
      setTimeout(updateDialCode, 10);
    });
  } catch(_){ }
});

// Opening popup form (auto after load, once per user)
(function(){
  var STORAGE_KEY = 'openingPopupCompleted';
  var SHOW_DELAY_MS = 2000;

  function shouldShowPopup() {
    // Always show the popup on each refresh/load
    return true;
  }

  function markCompleted() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch(e) {}
  }

  function buildCountryOptions() {
    var select = document.getElementById('contact-form');
    var pageCountrySelect = document.getElementById('country');
    if (pageCountrySelect) {
      return pageCountrySelect.innerHTML;
    }
    return `
<option value="">Select country</option>
<option value="afghanistan">Afghanistan</option>
<option value="albania">Albania</option>
<option value="algeria">Algeria</option>
<option value="andorra">Andorra</option>
<option value="angola">Angola</option>
<option value="antigua-and-barbuda">Antigua and Barbuda</option>
<option value="argentina">Argentina</option>
<option value="armenia">Armenia</option>
<option value="australia">Australia</option>
<option value="austria">Austria</option>
<option value="azerbaijan">Azerbaijan</option>
<option value="bahamas">Bahamas</option>
<option value="bahrain">Bahrain</option>
<option value="bangladesh">Bangladesh</option>
<option value="barbados">Barbados</option>
<option value="belarus">Belarus</option>
<option value="belgium">Belgium</option>
<option value="belize">Belize</option>
<option value="benin">Benin</option>
<option value="bhutan">Bhutan</option>
<option value="bolivia">Bolivia</option>
<option value="bosnia-and-herzegovina">Bosnia and Herzegovina</option>
<option value="botswana">Botswana</option>
<option value="brazil">Brazil</option>
<option value="brunei">Brunei</option>
<option value="bulgaria">Bulgaria</option>
<option value="burkina-faso">Burkina Faso</option>
<option value="burundi">Burundi</option>
<option value="cabo-verde">Cabo Verde</option>
<option value="cambodia">Cambodia</option>
<option value="cameroon">Cameroon</option>
<option value="canada">Canada</option>
<option value="central-african-republic">Central African Republic</option>
<option value="chad">Chad</option>
<option value="chile">Chile</option>
<option value="china">China</option>
<option value="colombia">Colombia</option>
<option value="comoros">Comoros</option>
<option value="congo">Congo</option>
<option value="congo-democratic-republic">Congo, Democratic Republic of the</option>
<option value="costa-rica">Costa Rica</option>
<option value="cote-divoire">Côte d\'Ivoire</option>
<option value="croatia">Croatia</option>
<option value="cuba">Cuba</option>
<option value="cyprus">Cyprus</option>
<option value="czech-republic">Czech Republic</option>
<option value="denmark">Denmark</option>
<option value="djibouti">Djibouti</option>
<option value="dominica">Dominica</option>
<option value="dominican-republic">Dominican Republic</option>
<option value="ecuador">Ecuador</option>
<option value="egypt">Egypt</option>
<option value="el-salvador">El Salvador</option>
<option value="equatorial-guinea">Equatorial Guinea</option>
<option value="eritrea">Eritrea</option>
<option value="estonia">Estonia</option>
<option value="eswatini">Eswatini</option>
<option value="ethiopia">Ethiopia</option>
<option value="fiji">Fiji</option>
<option value="finland">Finland</option>
<option value="france">France</option>
<option value="gabon">Gabon</option>
<option value="gambia">Gambia</option>
<option value="georgia">Georgia</option>
<option value="germany">Germany</option>
<option value="ghana">Ghana</option>
<option value="greece">Greece</option>
<option value="grenada">Grenada</option>
<option value="guatemala">Guatemala</option>
<option value="guinea">Guinea</option>
<option value="guinea-bissau">Guinea-Bissau</option>
<option value="guyana">Guyana</option>
<option value="haiti">Haiti</option>
<option value="honduras">Honduras</option>
<option value="hungary">Hungary</option>
<option value="iceland">Iceland</option>
<option value="india">India</option>
<option value="indonesia">Indonesia</option>
<option value="iran">Iran</option>
<option value="iraq">Iraq</option>
<option value="ireland">Ireland</option>
<option value="israel">Israel</option>
<option value="italy">Italy</option>
<option value="jamaica">Jamaica</option>
<option value="japan">Japan</option>
<option value="jordan">Jordan</option>
<option value="kazakhstan">Kazakhstan</option>
<option value="kenya">Kenya</option>
<option value="kiribati">Kiribati</option>
<option value="korea-north">Korea, North</option>
<option value="korea-south">Korea, South</option>
<option value="kuwait">Kuwait</option>
<option value="kyrgyzstan">Kyrgyzstan</option>
<option value="laos">Laos</option>
<option value="latvia">Latvia</option>
<option value="lebanon">Lebanon</option>
<option value="lesotho">Lesotho</option>
<option value="liberia">Liberia</option>
<option value="libya">Libya</option>
<option value="liechtenstein">Liechtenstein</option>
<option value="lithuania">Lithuania</option>
<option value="luxembourg">Luxembourg</option>
<option value="madagascar">Madagascar</option>
<option value="malawi">Malawi</option>
<option value="malaysia">Malaysia</option>
<option value="maldives">Maldives</option>
<option value="mali">Mali</option>
<option value="malta">Malta</option>
<option value="marshall-islands">Marshall Islands</option>
<option value="mauritania">Mauritania</option>
<option value="mauritius">Mauritius</option>
<option value="mexico">Mexico</option>
<option value="micronesia">Micronesia</option>
<option value="moldova">Moldova</option>
<option value="monaco">Monaco</option>
<option value="mongolia">Mongolia</option>
<option value="montenegro">Montenegro</option>
<option value="morocco">Morocco</option>
<option value="mozambique">Mozambique</option>
<option value="myanmar">Myanmar</option>
<option value="namibia">Namibia</option>
<option value="nauru">Nauru</option>
<option value="nepal">Nepal</option>
<option value="netherlands">Netherlands</option>
<option value="new-zealand">New Zealand</option>
<option value="nicaragua">Nicaragua</option>
<option value="niger">Niger</option>
<option value="nigeria">Nigeria</option>
<option value="north-macedonia">North Macedonia</option>
<option value="norway">Norway</option>
<option value="oman">Oman</option>
<option value="pakistan">Pakistan</option>
<option value="palau">Palau</option>
<option value="palestine">Palestine</option>
<option value="panama">Panama</option>
<option value="papua-new-guinea">Papua New Guinea</option>
<option value="paraguay">Paraguay</option>
<option value="peru">Peru</option>
<option value="philippines">Philippines</option>
<option value="poland">Poland</option>
<option value="portugal">Portugal</option>
<option value="qatar">Qatar</option>
<option value="romania">Romania</option>
<option value="russia">Russia</option>
<option value="rwanda">Rwanda</option>
<option value="saint-kitts-and-nevis">Saint Kitts and Nevis</option>
<option value="saint-lucia">Saint Lucia</option>
<option value="saint-vincent-and-the-grenadines">Saint Vincent and the Grenadines</option>
<option value="samoa">Samoa</option>
<option value="san-marino">San Marino</option>
<option value="sao-tome-and-principe">São Tomé and Príncipe</option>
<option value="saudi-arabia">Saudi Arabia</option>
<option value="senegal">Senegal</option>
<option value="serbia">Serbia</option>
<option value="seychelles">Seychelles</option>
<option value="sierra-leone">Sierra Leone</option>
<option value="singapore">Singapore</option>
<option value="slovakia">Slovakia</option>
<option value="slovenia">Slovenia</option>
<option value="solomon-islands">Solomon Islands</option>
<option value="somalia">Somalia</option>
<option value="south-africa">South Africa</option>
<option value="south-sudan">South Sudan</option>
<option value="spain">Spain</option>
<option value="sri-lanka">Sri Lanka</option>
<option value="sudan">Sudan</option>
<option value="suriname">Suriname</option>
<option value="sweden">Sweden</option>
<option value="switzerland">Switzerland</option>
<option value="syria">Syria</option>
<option value="taiwan">Taiwan</option>
<option value="tajikistan">Tajikistan</option>
<option value="tanzania">Tanzania</option>
<option value="thailand">Thailand</option>
<option value="timor-leste">Timor-Leste</option>
<option value="togo">Togo</option>
<option value="tonga">Tonga</option>
<option value="trinidad-and-tobago">Trinidad and Tobago</option>
<option value="tunisia">Tunisia</option>
<option value="turkey">Turkey</option>
<option value="turkmenistan">Turkmenistan</option>
<option value="tuvalu">Tuvalu</option>
<option value="uganda">Uganda</option>
<option value="ukraine">Ukraine</option>
<option value="united-arab-emirates">United Arab Emirates</option>
<option value="united-kingdom">United Kingdom</option>
<option value="united-states">United States</option>
<option value="uruguay">Uruguay</option>
<option value="uzbekistan">Uzbekistan</option>
<option value="vanuatu">Vanuatu</option>
<option value="vatican-city">Vatican City</option>
<option value="venezuela">Venezuela</option>
<option value="vietnam">Vietnam</option>
<option value="yemen">Yemen</option>
<option value="zambia">Zambia</option>
<option value="zimbabwe">Zimbabwe</option>`;
  }

  function createPopup() {
    if (!shouldShowPopup()) return;

    var overlay = document.createElement('div');
    overlay.className = 'opening-popup-overlay';
    // Accessibility and interaction: explicit non-dismissable overlay
    overlay.setAttribute('aria-hidden', 'false');

    var card = document.createElement('div');
    card.className = 'opening-popup-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', "Let's Stay Connected");

    card.innerHTML = `
      <div class="opening-popup-header">
        <div>
          <h3 class="opening-popup-title">Let's Stay Connected</h3>
          <p class="opening-popup-subtitle">Please share your details so we can reach you better.</p>
        </div>
        <button type="button" class="opening-popup-close" aria-label="Close">×</button>
      </div>
      <form class="opening-popup-form" novalidate>
        <div class="field">
          <label for="op-country">Country*</label>
          <select id="op-country" name="country" required aria-required="true">${buildCountryOptions()}</select>
          <div class="error-text" data-for="country"></div>
        </div>
        <div class="field">
          <label for="op-phone">Phone Number*</label>
          <div class="opening-phone-wrap">
            <div class="opening-dial-code" id="op-dial-code">+91</div>
            <input id="op-phone" name="contactNumber" type="tel" placeholder="Phone Number" inputmode="tel" required aria-required="true">
          </div>
          <div class="error-text" data-for="phone"></div>
        </div>
        <div class="field">
          <label for="op-email">Email ID*</label>
          <input id="op-email" name="EmailID" type="email" placeholder="Email ID" inputmode="email" autocomplete="email" required aria-required="true">
          <div class="error-text" data-for="email"></div>
        </div>
        <div class="opening-popup-actions">
          <button type="submit" class="opening-popup-submit">Submit</button>
        </div>
        <div class="opening-popup-success" style="display:none;">Thank you! We'll be in touch soon.</div>
      </form>`;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Lock body scroll while popup is open
    var __prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    var closeBtn = card.querySelector('.opening-popup-close');
    var form = card.querySelector('form');
    var submitBtn = card.querySelector('.opening-popup-submit');
    var successEl = card.querySelector('.opening-popup-success');
    var popupCountry = card.querySelector('#op-country');
    var popupPhone = card.querySelector('#op-phone');
    var popupDialCode = card.querySelector('#op-dial-code');
    var popupEmail = card.querySelector('#op-email');
    
    // Country mappings available immediately (used for UI + intl-tel-input when loaded)
    var __countryIso2ByValue = {
      'afghanistan': 'af', 'albania': 'al', 'algeria': 'dz', 'andorra': 'ad', 'angola': 'ao',
      'argentina': 'ar', 'armenia': 'am', 'australia': 'au', 'austria': 'at', 'azerbaijan': 'az',
      'bahamas': 'bs', 'bahrain': 'bh', 'bangladesh': 'bd', 'belarus': 'by', 'belgium': 'be',
      'belize': 'bz', 'benin': 'bj', 'bhutan': 'bt', 'bolivia': 'bo', 'bosnia-and-herzegovina': 'ba',
      'botswana': 'bw', 'brazil': 'br', 'brunei': 'bn', 'bulgaria': 'bg', 'burkina-faso': 'bf',
      'burundi': 'bi', 'cambodia': 'kh', 'cameroon': 'cm', 'canada': 'ca', 'central-african-republic': 'cf',
      'chad': 'td', 'chile': 'cl', 'china': 'cn', 'colombia': 'co', 'comoros': 'km', 'congo': 'cg',
      'congo-democratic-republic': 'cd', 'costa-rica': 'cr', 'cote-divoire': 'ci', 'croatia': 'hr',
      'cuba': 'cu', 'cyprus': 'cy', 'czech-republic': 'cz', 'denmark': 'dk', 'djibouti': 'dj',
      'dominica': 'dm', 'dominican-republic': 'do', 'ecuador': 'ec', 'egypt': 'eg', 'el-salvador': 'sv',
      'equatorial-guinea': 'gq', 'eritrea': 'er', 'estonia': 'ee', 'eswatini': 'sz', 'ethiopia': 'et',
      'fiji': 'fj', 'finland': 'fi', 'france': 'fr', 'gabon': 'ga', 'gambia': 'gm', 'georgia': 'ge',
      'germany': 'de', 'ghana': 'gh', 'greece': 'gr', 'grenada': 'gd', 'guatemala': 'gt', 'guinea': 'gn',
      'guinea-bissau': 'gw', 'guyana': 'gy', 'haiti': 'ht', 'honduras': 'hn', 'hungary': 'hu',
      'iceland': 'is', 'india': 'in', 'indonesia': 'id', 'iran': 'ir', 'iraq': 'iq', 'ireland': 'ie',
      'israel': 'il', 'italy': 'it', 'jamaica': 'jm', 'japan': 'jp', 'jordan': 'jo', 'kazakhstan': 'kz',
      'kenya': 'ke', 'kiribati': 'ki', 'korea-north': 'kp', 'korea-south': 'kr', 'kuwait': 'kw',
      'kyrgyzstan': 'kg', 'laos': 'la', 'latvia': 'lv', 'lebanon': 'lb', 'lesotho': 'ls', 'liberia': 'lr',
      'libya': 'ly', 'liechtenstein': 'li', 'lithuania': 'lt', 'luxembourg': 'lu', 'madagascar': 'mg',
      'malawi': 'mw', 'malaysia': 'my', 'maldives': 'mv', 'mali': 'ml', 'malta': 'mt',
      'marshall-islands': 'mh', 'mauritania': 'mr', 'mauritius': 'mu', 'mexico': 'mx', 'micronesia': 'fm',
      'moldova': 'md', 'monaco': 'mc', 'mongolia': 'mn', 'montenegro': 'me', 'morocco': 'ma',
      'mozambique': 'mz', 'myanmar': 'mm', 'namibia': 'na', 'nauru': 'nr', 'nepal': 'np',
      'netherlands': 'nl', 'new-zealand': 'nz', 'nicaragua': 'ni', 'niger': 'ne', 'nigeria': 'ng',
      'north-macedonia': 'mk', 'norway': 'no', 'oman': 'om', 'pakistan': 'pk', 'palau': 'pw',
      'palestine': 'ps', 'panama': 'pa', 'papua-new-guinea': 'pg', 'paraguay': 'py', 'peru': 'pe',
      'philippines': 'ph', 'poland': 'pl', 'portugal': 'pt', 'qatar': 'qa', 'romania': 'ro',
      'russia': 'ru', 'rwanda': 'rw', 'samoa': 'ws', 'san-marino': 'sm', 'sao-tome-and-principe': 'st',
      'saudi-arabia': 'sa', 'senegal': 'sn', 'serbia': 'rs', 'seychelles': 'sc', 'sierra-leone': 'sl',
      'singapore': 'sg', 'slovakia': 'sk', 'slovenia': 'si', 'solomon-islands': 'sb', 'somalia': 'so',
      'south-africa': 'za', 'south-sudan': 'ss', 'spain': 'es', 'sri-lanka': 'lk', 'sudan': 'sd',
      'suriname': 'sr', 'sweden': 'se', 'switzerland': 'ch', 'syria': 'sy', 'taiwan': 'tw',
      'tajikistan': 'tj', 'tanzania': 'tz', 'thailand': 'th', 'timor-leste': 'tl', 'togo': 'tg',
      'tonga': 'to', 'trinidad-and-tobago': 'tt', 'tunisia': 'tn', 'turkey': 'tr', 'turkmenistan': 'tm',
      'tuvalu': 'tv', 'uganda': 'ug', 'ukraine': 'ua', 'united-arab-emirates': 'ae',
      'united-kingdom': 'gb', 'united-states': 'us', 'uruguay': 'uy', 'uzbekistan': 'uz',
      'vanuatu': 'vu', 'vatican-city': 'va', 'venezuela': 've', 'vietnam': 'vn', 'yemen': 'ye',
      'zambia': 'zm', 'zimbabwe': 'zw'
    };
    var __dialCodeByValue = {
      'afghanistan': '93', 'albania': '355', 'algeria': '213', 'andorra': '376', 'angola': '244',
      'argentina': '54', 'armenia': '374', 'australia': '61', 'austria': '43', 'azerbaijan': '994',
      'bahamas': '1242', 'bahrain': '973', 'bangladesh': '880', 'belarus': '375', 'belgium': '32',
      'belize': '501', 'benin': '229', 'bhutan': '975', 'bolivia': '591', 'bosnia-and-herzegovina': '387',
      'botswana': '267', 'brazil': '55', 'brunei': '673', 'bulgaria': '359', 'burkina-faso': '226',
      'burundi': '257', 'cambodia': '855', 'cameroon': '237', 'canada': '1', 'central-african-republic': '236',
      'chad': '235', 'chile': '56', 'china': '86', 'colombia': '57', 'comoros': '269', 'congo': '242',
      'congo-democratic-republic': '243', 'costa-rica': '506', 'cote-divoire': '225', 'croatia': '385',
      'cuba': '53', 'cyprus': '357', 'czech-republic': '420', 'denmark': '45', 'djibouti': '253',
      'dominica': '1767', 'dominican-republic': '1809', 'ecuador': '593', 'egypt': '20', 'el-salvador': '503',
      'equatorial-guinea': '240', 'eritrea': '291', 'estonia': '372', 'eswatini': '268', 'ethiopia': '251',
      'fiji': '679', 'finland': '358', 'france': '33', 'gabon': '241', 'gambia': '220', 'georgia': '995',
      'germany': '49', 'ghana': '233', 'greece': '30', 'grenada': '1473', 'guatemala': '502', 'guinea': '224',
      'guinea-bissau': '245', 'guyana': '592', 'haiti': '509', 'honduras': '504', 'hungary': '36',
      'iceland': '354', 'india': '91', 'indonesia': '62', 'iran': '98', 'iraq': '964', 'ireland': '353',
      'israel': '972', 'italy': '39', 'jamaica': '1876', 'japan': '81', 'jordan': '962', 'kazakhstan': '7',
      'kenya': '254', 'kiribati': '686', 'korea-north': '850', 'korea-south': '82', 'kuwait': '965',
      'kyrgyzstan': '996', 'laos': '856', 'latvia': '371', 'lebanon': '961', 'lesotho': '266', 'liberia': '231',
      'libya': '218', 'liechtenstein': '423', 'lithuania': '370', 'luxembourg': '352', 'madagascar': '261',
      'malawi': '265', 'malaysia': '60', 'maldives': '960', 'mali': '223', 'malta': '356',
      'marshall-islands': '692', 'mauritania': '222', 'mauritius': '230', 'mexico': '52', 'micronesia': '691',
      'moldova': '373', 'monaco': '377', 'mongolia': '976', 'montenegro': '382', 'morocco': '212',
      'mozambique': '258', 'myanmar': '95', 'namibia': '264', 'nauru': '674', 'nepal': '977',
      'netherlands': '31', 'new-zealand': '64', 'nicaragua': '505', 'niger': '227', 'nigeria': '234',
      'north-macedonia': '389', 'norway': '47', 'oman': '968', 'pakistan': '92', 'palau': '680',
      'palestine': '970', 'panama': '507', 'papua-new-guinea': '675', 'paraguay': '595', 'peru': '51',
      'philippines': '63', 'poland': '48', 'portugal': '351', 'qatar': '974', 'romania': '40',
      'russia': '7', 'rwanda': '250', 'samoa': '685', 'san-marino': '378', 'sao-tome-and-principe': '239',
      'saudi-arabia': '966', 'senegal': '221', 'serbia': '381', 'seychelles': '248', 'sierra-leone': '232',
      'singapore': '65', 'slovakia': '421', 'slovenia': '386', 'solomon-islands': '677', 'somalia': '252',
      'south-africa': '27', 'south-sudan': '211', 'spain': '34', 'sri-lanka': '94', 'sudan': '249',
      'suriname': '597', 'sweden': '46', 'switzerland': '41', 'syria': '963', 'taiwan': '886',
      'tajikistan': '992', 'tanzania': '255', 'thailand': '66', 'timor-leste': '670', 'togo': '228',
      'tonga': '676', 'trinidad-and-tobago': '1868', 'tunisia': '216', 'turkey': '90', 'turkmenistan': '993',
      'tuvalu': '688', 'uganda': '256', 'ukraine': '380', 'united-arab-emirates': '971',
      'united-kingdom': '44', 'united-states': '1', 'uruguay': '598', 'uzbekistan': '998',
      'vanuatu': '678', 'vatican-city': '379', 'venezuela': '58', 'vietnam': '84', 'yemen': '967',
      'zambia': '260', 'zimbabwe': '263'
    };
    
    function syncCountryUIAndITI(){
      if (!popupCountry) return;
      var val = popupCountry.value;
      // Update visible dial code immediately
      if (popupDialCode && __dialCodeByValue[val]) {
        popupDialCode.textContent = '+' + __dialCodeByValue[val];
      }
      // Update intl-tel-input when available
      try {
        if (popupPhone && popupPhone._iti && __countryIso2ByValue[val]) {
          popupPhone._iti.setCountry(__countryIso2ByValue[val]);
        }
      } catch(_) {}
    }
    
    // Attach listeners immediately so UI updates even before library loads
    if (popupCountry) {
      popupCountry.addEventListener('change', syncCountryUIAndITI);
      popupCountry.addEventListener('input', syncCountryUIAndITI);
      popupCountry.addEventListener('click', function(){ setTimeout(syncCountryUIAndITI, 0); });
    }
    
    // Default to India if no value is preselected
    if (popupCountry && !popupCountry.value) {
      try { popupCountry.value = 'india'; } catch(_) {}
    }
    // Ensure UI shows correct dial code immediately
    try { syncCountryUIAndITI && syncCountryUIAndITI(); } catch(_) {}

    // Initialize intl-tel-input for popup phone field
    (function initPopupIntlTel(){
      function loadCss(href){
        if (document.getElementById('__iti_css__')) return;
        var link = document.createElement('link'); 
        link.id = '__iti_css__';
        link.rel = 'stylesheet'; 
        link.href = href; 
        document.head.appendChild(link);
      }
      
      function loadScript(src, cb){
        var s = document.getElementById('__iti_js__');
        if (window.intlTelInput) { 
          cb && cb(); 
          return; 
        }
        if (!s) {
          s = document.createElement('script'); 
          s.id = '__iti_js__';
          s.src = src; 
          s.async = true; 
          s.onload = cb; 
          s.onerror = function(){}; 
          document.head.appendChild(s);
        } else {
          s.onload = cb;
        }
      }
      
      var cssUrl = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/css/intlTelInput.min.css';
      var jsUrl = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/intlTelInput.min.js';
      var utilsUrl = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.12/build/js/utils.js';
      
      try { loadCss(cssUrl); } catch(_) {}
      
      loadScript(jsUrl, function(){
        try {
          if (!window.intlTelInput || !popupPhone) return;
          
          var iti = window.intlTelInput(popupPhone, {
            initialCountry: 'in',
            separateDialCode: false,
            nationalMode: false, // capture full international format
            autoPlaceholder: 'aggressive',
            utilsScript: utilsUrl
          });
          
          popupPhone._iti = iti;
          
          // Sync with country select if present
          if (popupCountry) {
            // Use the same country mapping as main form
            var countryMapping = {
              'afghanistan': 'af', 'albania': 'al', 'algeria': 'dz', 'andorra': 'ad', 'angola': 'ao',
              'argentina': 'ar', 'armenia': 'am', 'australia': 'au', 'austria': 'at', 'azerbaijan': 'az',
              'bahamas': 'bs', 'bahrain': 'bh', 'bangladesh': 'bd', 'belarus': 'by', 'belgium': 'be',
              'belize': 'bz', 'benin': 'bj', 'bhutan': 'bt', 'bolivia': 'bo', 'bosnia-and-herzegovina': 'ba',
              'botswana': 'bw', 'brazil': 'br', 'brunei': 'bn', 'bulgaria': 'bg', 'burkina-faso': 'bf',
              'burundi': 'bi', 'cambodia': 'kh', 'cameroon': 'cm', 'canada': 'ca', 'central-african-republic': 'cf',
              'chad': 'td', 'chile': 'cl', 'china': 'cn', 'colombia': 'co', 'comoros': 'km', 'congo': 'cg',
              'congo-democratic-republic': 'cd', 'costa-rica': 'cr', 'cote-divoire': 'ci', 'croatia': 'hr',
              'cuba': 'cu', 'cyprus': 'cy', 'czech-republic': 'cz', 'denmark': 'dk', 'djibouti': 'dj',
              'dominica': 'dm', 'dominican-republic': 'do', 'ecuador': 'ec', 'egypt': 'eg', 'el-salvador': 'sv',
              'equatorial-guinea': 'gq', 'eritrea': 'er', 'estonia': 'ee', 'eswatini': 'sz', 'ethiopia': 'et',
              'fiji': 'fj', 'finland': 'fi', 'france': 'fr', 'gabon': 'ga', 'gambia': 'gm', 'georgia': 'ge',
              'germany': 'de', 'ghana': 'gh', 'greece': 'gr', 'grenada': 'gd', 'guatemala': 'gt', 'guinea': 'gn',
              'guinea-bissau': 'gw', 'guyana': 'gy', 'haiti': 'ht', 'honduras': 'hn', 'hungary': 'hu',
              'iceland': 'is', 'india': 'in', 'indonesia': 'id', 'iran': 'ir', 'iraq': 'iq', 'ireland': 'ie',
              'israel': 'il', 'italy': 'it', 'jamaica': 'jm', 'japan': 'jp', 'jordan': 'jo', 'kazakhstan': 'kz',
              'kenya': 'ke', 'kiribati': 'ki', 'korea-north': 'kp', 'korea-south': 'kr', 'kuwait': 'kw',
              'kyrgyzstan': 'kg', 'laos': 'la', 'latvia': 'lv', 'lebanon': 'lb', 'lesotho': 'ls', 'liberia': 'lr',
              'libya': 'ly', 'liechtenstein': 'li', 'lithuania': 'lt', 'luxembourg': 'lu', 'madagascar': 'mg',
              'malawi': 'mw', 'malaysia': 'my', 'maldives': 'mv', 'mali': 'ml', 'malta': 'mt',
              'marshall-islands': 'mh', 'mauritania': 'mr', 'mauritius': 'mu', 'mexico': 'mx', 'micronesia': 'fm',
              'moldova': 'md', 'monaco': 'mc', 'mongolia': 'mn', 'montenegro': 'me', 'morocco': 'ma',
              'mozambique': 'mz', 'myanmar': 'mm', 'namibia': 'na', 'nauru': 'nr', 'nepal': 'np',
              'netherlands': 'nl', 'new-zealand': 'nz', 'nicaragua': 'ni', 'niger': 'ne', 'nigeria': 'ng',
              'north-macedonia': 'mk', 'norway': 'no', 'oman': 'om', 'pakistan': 'pk', 'palau': 'pw',
              'palestine': 'ps', 'panama': 'pa', 'papua-new-guinea': 'pg', 'paraguay': 'py', 'peru': 'pe',
              'philippines': 'ph', 'poland': 'pl', 'portugal': 'pt', 'qatar': 'qa', 'romania': 'ro',
              'russia': 'ru', 'rwanda': 'rw', 'samoa': 'ws', 'san-marino': 'sm', 'sao-tome-and-principe': 'st',
              'saudi-arabia': 'sa', 'senegal': 'sn', 'serbia': 'rs', 'seychelles': 'sc', 'sierra-leone': 'sl',
              'singapore': 'sg', 'slovakia': 'sk', 'slovenia': 'si', 'solomon-islands': 'sb', 'somalia': 'so',
              'south-africa': 'za', 'south-sudan': 'ss', 'spain': 'es', 'sri-lanka': 'lk', 'sudan': 'sd',
              'suriname': 'sr', 'sweden': 'se', 'switzerland': 'ch', 'syria': 'sy', 'taiwan': 'tw',
              'tajikistan': 'tj', 'tanzania': 'tz', 'thailand': 'th', 'timor-leste': 'tl', 'togo': 'tg',
              'tonga': 'to', 'trinidad-and-tobago': 'tt', 'tunisia': 'tn', 'turkey': 'tr', 'turkmenistan': 'tm',
              'tuvalu': 'tv', 'uganda': 'ug', 'ukraine': 'ua', 'united-arab-emirates': 'ae',
              'united-kingdom': 'gb', 'united-states': 'us', 'uruguay': 'uy', 'uzbekistan': 'uz',
              'vanuatu': 'vu', 'vatican-city': 'va', 'venezuela': 've', 'vietnam': 'vn', 'yemen': 'ye',
              'zambia': 'zm', 'zimbabwe': 'zw'
            };
            
            // Direct country to dial code mapping as fallback
            var countryDialCodes = {
              'afghanistan': '93', 'albania': '355', 'algeria': '213', 'andorra': '376', 'angola': '244',
              'argentina': '54', 'armenia': '374', 'australia': '61', 'austria': '43', 'azerbaijan': '994',
              'bahamas': '1242', 'bahrain': '973', 'bangladesh': '880', 'belarus': '375', 'belgium': '32',
              'belize': '501', 'benin': '229', 'bhutan': '975', 'bolivia': '591', 'bosnia-and-herzegovina': '387',
              'botswana': '267', 'brazil': '55', 'brunei': '673', 'bulgaria': '359', 'burkina-faso': '226',
              'burundi': '257', 'cambodia': '855', 'cameroon': '237', 'canada': '1', 'central-african-republic': '236',
              'chad': '235', 'chile': '56', 'china': '86', 'colombia': '57', 'comoros': '269', 'congo': '242',
              'congo-democratic-republic': '243', 'costa-rica': '506', 'cote-divoire': '225', 'croatia': '385',
              'cuba': '53', 'cyprus': '357', 'czech-republic': '420', 'denmark': '45', 'djibouti': '253',
              'dominica': '1767', 'dominican-republic': '1809', 'ecuador': '593', 'egypt': '20', 'el-salvador': '503',
              'equatorial-guinea': '240', 'eritrea': '291', 'estonia': '372', 'eswatini': '268', 'ethiopia': '251',
              'fiji': '679', 'finland': '358', 'france': '33', 'gabon': '241', 'gambia': '220', 'georgia': '995',
              'germany': '49', 'ghana': '233', 'greece': '30', 'grenada': '1473', 'guatemala': '502', 'guinea': '224',
              'guinea-bissau': '245', 'guyana': '592', 'haiti': '509', 'honduras': '504', 'hungary': '36',
              'iceland': '354', 'india': '91', 'indonesia': '62', 'iran': '98', 'iraq': '964', 'ireland': '353',
              'israel': '972', 'italy': '39', 'jamaica': '1876', 'japan': '81', 'jordan': '962', 'kazakhstan': '7',
              'kenya': '254', 'kiribati': '686', 'korea-north': '850', 'korea-south': '82', 'kuwait': '965',
              'kyrgyzstan': '996', 'laos': '856', 'latvia': '371', 'lebanon': '961', 'lesotho': '266', 'liberia': '231',
              'libya': '218', 'liechtenstein': '423', 'lithuania': '370', 'luxembourg': '352', 'madagascar': '261',
              'malawi': '265', 'malaysia': '60', 'maldives': '960', 'mali': '223', 'malta': '356',
              'marshall-islands': '692', 'mauritania': '222', 'mauritius': '230', 'mexico': '52', 'micronesia': '691',
              'moldova': '373', 'monaco': '377', 'mongolia': '976', 'montenegro': '382', 'morocco': '212',
              'mozambique': '258', 'myanmar': '95', 'namibia': '264', 'nauru': '674', 'nepal': '977',
              'netherlands': '31', 'new-zealand': '64', 'nicaragua': '505', 'niger': '227', 'nigeria': '234',
              'north-macedonia': '389', 'norway': '47', 'oman': '968', 'pakistan': '92', 'palau': '680',
              'palestine': '970', 'panama': '507', 'papua-new-guinea': '675', 'paraguay': '595', 'peru': '51',
              'philippines': '63', 'poland': '48', 'portugal': '351', 'qatar': '974', 'romania': '40',
              'russia': '7', 'rwanda': '250', 'samoa': '685', 'san-marino': '378', 'sao-tome-and-principe': '239',
              'saudi-arabia': '966', 'senegal': '221', 'serbia': '381', 'seychelles': '248', 'sierra-leone': '232',
              'singapore': '65', 'slovakia': '421', 'slovenia': '386', 'solomon-islands': '677', 'somalia': '252',
              'south-africa': '27', 'south-sudan': '211', 'spain': '34', 'sri-lanka': '94', 'sudan': '249',
              'suriname': '597', 'sweden': '46', 'switzerland': '41', 'syria': '963', 'taiwan': '886',
              'tajikistan': '992', 'tanzania': '255', 'thailand': '66', 'timor-leste': '670', 'togo': '228',
              'tonga': '676', 'trinidad-and-tobago': '1868', 'tunisia': '216', 'turkey': '90', 'turkmenistan': '993',
              'tuvalu': '688', 'uganda': '256', 'ukraine': '380', 'united-arab-emirates': '971',
              'united-kingdom': '44', 'united-states': '1', 'uruguay': '598', 'uzbekistan': '998',
              'vanuatu': '678', 'vatican-city': '379', 'venezuela': '58', 'vietnam': '84', 'yemen': '967',
              'zambia': '260', 'zimbabwe': '263'
            };
            
            function syncCountryToPhone() {
              if (!popupCountry) {
                console.log('Popup sync failed: popupCountry not available');
                return;
              }
              var selectedValue = popupCountry.value;
              console.log('Popup country selected:', selectedValue);
              
              // Always use the fallback method first for immediate response
              updateDialCodeFallback(selectedValue);
              
              // Then try to update intl-tel-input if available (for phone validation)
              if (iti && selectedValue && countryMapping[selectedValue]) {
                var iso2 = countryMapping[selectedValue];
                console.log('Setting country to ISO2:', iso2);
                try {
                  iti.setCountry(iso2);
                  console.log('intl-tel-input country set to:', iso2);
                } catch(e) {
                  console.log('Error setting intl-tel-input country:', e);
                }
              }
            }
            
            function updateDialCodeFallback(selectedValue) {
              if (selectedValue && countryDialCodes[selectedValue]) {
                var dialCode = countryDialCodes[selectedValue];
                console.log('Using fallback dial code for', selectedValue, ':', dialCode);
                
                if (popupDialCode) {
                  popupDialCode.textContent = '+' + dialCode;
                  console.log('Updated dial code display to:', '+' + dialCode);
                }
              } else {
                console.log('No dial code mapping found for country:', selectedValue);
              }
            }
            
            // Add multiple event listeners to ensure we catch all changes
            popupCountry.addEventListener('change', function(){ 
              console.log('Popup country change event triggered');
              syncCountryToPhone();
            });
            popupCountry.addEventListener('input', function(){
              console.log('Popup country input event triggered');
              syncCountryToPhone();
            });
            popupCountry.addEventListener('click', function(){
              console.log('Popup country click event triggered');
              // Small delay to allow dropdown to update
              setTimeout(syncCountryToPhone, 50);
            });
            
            // Set initial country and sync immediately
            if (popupCountry.value) {
              syncCountryToPhone();
            } else {
              // Set default to India if no value
              popupCountry.value = 'india';
              syncCountryToPhone();
            }
          }
          
          console.log('intl-tel-input initialized for popup with India as default');
        } catch(e) {
          console.error('Failed to initialize popup intl-tel-input:', e);
        }
      });
    })();

    function removePopup() {
      if (!card) return;
      card.classList.add('fade-out');
      setTimeout(function(){
        overlay.remove();
        // Restore body scroll
        document.body.style.overflow = __prevBodyOverflow || '';
      }, 240);
    }

    function showError(key, msg) {
      var el = card.querySelector('.error-text[data-for="' + key + '"]');
      if (el) { el.textContent = msg || ''; el.classList.toggle('show', !!msg); }
    }

    function clearErrors() {
      ['country','phone','email'].forEach(function(k){ showError(k, ''); });
    }

    function validate(values) {
      var ok = true;
      clearErrors();
      if (!values.country) { showError('country', 'Please select country.'); ok = false; }
      if (!values.phone) { showError('phone', 'Please enter phone number.'); ok = false; }
      else if (!/^\+?[0-9\-()\s]{7,20}$/.test(values.phone)) { showError('phone', 'Not a valid phone number.'); ok = false; }
      if (!values.email) { showError('email', 'Please enter email.'); ok = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { showError('email', 'Please enter a valid email.'); ok = false; }
      return ok;
    }

    // Disable submit until all required fields are filled
    function updateSubmitState() {
      try {
        var hasCountry = !!(popupCountry && popupCountry.value);
        var hasPhone = !!(popupPhone && popupPhone.value.trim());
        var hasEmail = !!(popupEmail && popupEmail.value.trim());
        if (submitBtn) submitBtn.disabled = !(hasCountry && hasPhone && hasEmail);
      } catch(_) {}
    }
    if (submitBtn) submitBtn.disabled = true;
    if (popupCountry) popupCountry.addEventListener('change', updateSubmitState);
    if (popupPhone) popupPhone.addEventListener('input', updateSubmitState);
    if (popupEmail) popupEmail.addEventListener('input', updateSubmitState);
    // Initial state
    updateSubmitState();

    function onClose() {
      markCompleted();
      removePopup();
    }

    // Prevent overlay clicks from dismissing the popup or interacting with the page
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    closeBtn.addEventListener('click', function(e){ e.preventDefault(); onClose(); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var country = card.querySelector('#op-country').value || '';
      var phone = card.querySelector('#op-phone').value.trim();
      var email = card.querySelector('#op-email').value.trim();

      var values = { country: country, phone: phone, email: email };
      if (!validate(values)) return;

      submitBtn.disabled = true;

      // Prepare data and send to Google Apps Script used on the site
      var scriptUrl = (window.AppConfig && window.AppConfig.googleScriptUrl) || '';
      if (!scriptUrl) {
        // fallback: mark completed so we don't annoy users
        successEl.style.display = 'block';
        successEl.textContent = "Thank you! Your details have been submitted.";
        markCompleted();
        setTimeout(onClose, 1600);
        return;
      }

      var timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });

      // Get full phone number with country code from intl-tel-input
      var fullPhone = (function(){
        try {
          if (popupPhone && popupPhone._iti && typeof popupPhone._iti.getNumber === 'function') {
            var utils = (window.intlTelInputUtils || {}).numberFormat ? window.intlTelInputUtils : null;
            var number = utils ? popupPhone._iti.getNumber(utils.numberFormat.E164) : popupPhone._iti.getNumber();
            if (number) return String(number).replace(/\s+/g, '');
          }
        } catch(_) {}
        // Fallback: prefix with selected country's dial code, force E.164 like +<code><digits>
        try {
          var selectedVal = popupCountry && popupCountry.value;
          var dc = (selectedVal && (window.__dialCodeByValue || {}).hasOwnProperty ? (window.__dialCodeByValue[selectedVal]) : null) || (__dialCodeByValue && __dialCodeByValue[selectedVal]);
          var digits = (phone || '').replace(/\D/g, '');
          if (dc && digits) return '+' + dc + digits;
        } catch(_) {}
        return phone;
      })();

      // Normalize country text once to reuse across payload variants
      var countryText = (function(){
        try {
          var sel = popupCountry;
          if (sel) {
            var opt = sel.options && sel.options[sel.selectedIndex];
            return (opt && opt.text ? opt.text : (sel.value || '')).trim();
          }
        } catch(_) {}
        return country;
      })();

      // Build payload: include routing fields Apps Script expects AND exact header keys
      var data = {
        // routing/meta
        source: 'popup',
        submittedAt: timestamp,
        page: window.location.href,
        // standard keys that many scripts expect
        phone: fullPhone,
        email: email,
        country: countryText,
        // exact sheet headers to ensure correct placement
        'PHONE NUMBER': fullPhone,
        'MAIL ID': email,
        'Country': countryText
      };

      try {
        // Primary: JSON POST (no-cors) — Apps Script will still receive body
        try {
          fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        } catch(_) {}

        // Fallback: sendBeacon with JSON blob
        try {
          var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
          navigator.sendBeacon(scriptUrl, blob);
        } catch(_) {}

        // Final fallback: URL-encoded with both standard and header field names
        try {
          var formData = new URLSearchParams();
          formData.append('source', 'popup');
          formData.append('submittedAt', timestamp);
          formData.append('page', window.location.href);
          formData.append('phone', fullPhone);
          formData.append('email', email);
          formData.append('country', countryText);
          formData.append('PHONE NUMBER', fullPhone);
          formData.append('MAIL ID', email);
          formData.append('Country', countryText);
          fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });
        } catch(_) {}

        // User feedback
        successEl.style.display = 'block';
        successEl.textContent = "Thank you! Your details have been submitted.";
        markCompleted();
        setTimeout(onClose, 1400);
      } finally {
        setTimeout(function(){ submitBtn.disabled = false; }, 1600);
      }
    });
  }

  window.initOpeningPopup = function initOpeningPopup(){
    if (!shouldShowPopup()) return;
    setTimeout(createPopup, SHOW_DELAY_MS);
  };
})();



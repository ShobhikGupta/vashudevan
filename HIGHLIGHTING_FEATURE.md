# Smart Highlighting Feature

## Overview
The website now includes intelligent highlighting functionality that automatically detects text color and applies appropriate contrast for search results.

## How It Works

### Color Detection
The system automatically detects the text color of product names and applies highlighting with optimal contrast:

- **Black/Dark Text**: Gets highlighted with yellow background (`#FFA500`)
- **Yellow/Light Text**: Gets highlighted with black background (`#1f2937`)

### Implementation Details

#### Smart Highlighting Function
```javascript
function smartHighlightSearchTerm(text, searchTerm, contextElement = null) {
    // Detects text color using computed styles
    // Calculates luminance to determine if text is light or dark
    // Applies appropriate highlighting class
}
```

#### Highlighting Classes
- `.search-highlight-yellow` - Yellow background for dark text
- `.search-highlight-yellow-text` - Black background for light text

### Where It's Applied

1. **Main Product Search** (`products.html`)
   - Product names in search results
   - Subproduct names in search results

2. **Subproduct Search** (`product.html`)
   - Individual subproduct names
   - Filtered subproduct results

3. **Deep-linking Navigation**
   - Highlighted subproducts when navigating from search results

### Testing

Use the test page (`test-search.html`) to verify the highlighting works correctly:

1. Open `test-search.html` in your browser
2. Enter search terms in the test input field
3. Observe how black and yellow text get different highlighting styles
4. Test on the actual products page by searching for terms like "copper", "wheels", "aluminum"

### Browser Compatibility

The feature uses:
- `window.getComputedStyle()` for color detection
- CSS custom properties for theming
- Modern JavaScript features (ES6+)

Compatible with all modern browsers (Chrome, Firefox, Safari, Edge).

### CSS Variables Used

- `--text: #111827` (dark text color)
- `--brand: #FFA500` (yellow/orange brand color)

The highlighting automatically adapts to these theme colors and any future color changes.

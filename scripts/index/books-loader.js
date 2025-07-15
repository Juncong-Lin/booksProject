// Books-focused product loading script
import {booksProducts} from '../../data/books.js';
import { formatCurrency, formatPriceRange } from '../shared/money.js';

// Pagination configuration
const ITEMS_PER_PAGE = 20;
let currentPage = 1;
let totalItems = 0;
let currentProducts = [];

// Helper function to encode image URLs properly
function encodeImagePath(imagePath) {
  return imagePath.split('/').map(part => 
    part.includes('(') || part.includes(')') || part.includes('#') ? encodeURIComponent(part) : part
  ).join('/');
}

// Function to create pagination HTML
function createPaginationHTML(currentPage, totalPages, totalItems) {
  if (totalPages <= 1) return '';
  
  let paginationHTML = `
    <div class="pagination-container">
      <div class="pagination-info">
        Page ${currentPage} of ${totalPages} Results (${totalItems} total)
      </div>
      <div class="pagination-controls">
  `;
  
  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage - 1})">Previous</button>`;
  }
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentPage ? 'active' : '';
    paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }
  
  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})">Next</button>`;
  }
  
  // Last button
  if (currentPage < totalPages) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">Last</button>`;
  }
  
  paginationHTML += `
      </div>
    </div>
  `;
  
  return paginationHTML;
}

// Function to clear pagination display
function clearPaginationDisplay() {
  const paginationElement = document.querySelector('.pagination-wrapper');
  if (paginationElement) {
    paginationElement.remove();
  }
}

// Function to update pagination display
function updatePaginationDisplay(currentPage, totalPages, totalItems) {
  // Remove existing pagination if it exists
  let paginationElement = document.querySelector('.pagination-wrapper');
  if (paginationElement) {
    paginationElement.remove();
  }
  
  // Only create pagination if we have more than one page
  if (totalPages > 1) {
    // Create new pagination element
    paginationElement = document.createElement('div');
    paginationElement.className = 'pagination-wrapper';
    paginationElement.innerHTML = createPaginationHTML(currentPage, totalPages, totalItems);
    
    // Insert pagination after the products grid
    const mainElement = document.querySelector('.main');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    mainElement.insertBefore(paginationElement, productsGrid.nextSibling);
  }
}

// Function to get paginated products
function getPaginatedProducts(products, page = 1) {
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  return products.slice(startIndex, endIndex);
}

// Global function to change page
window.changePage = function(page) {
  currentPage = page;
  const paginatedProducts = getPaginatedProducts(currentProducts, currentPage);
  const productsHTML = renderProducts(paginatedProducts, 'book');
  const totalPages = Math.ceil(currentProducts.length / ITEMS_PER_PAGE);
  
  // Update products grid
  const productsGrid = document.querySelector('.js-prodcts-grid');
  productsGrid.innerHTML = productsHTML;
  
  // Update pagination separately
  updatePaginationDisplay(currentPage, totalPages, currentProducts.length);
  
  // Re-attach event listeners
  attachAddToCartListeners();
  
  // Scroll to top of products
  scrollToProducts();
};

// Unified product rendering function for books
function renderProducts(productList, type = 'book') {
  let productsHTML = '';
  productList.forEach((product) => {
    productsHTML += `
      <div class="product-container">        
        <div class="product-image-container">
          <a href="detail.html?productId=${product.id}" class="product-image-link">
            <img class="product-image" src="${encodeImagePath(product.image)}">
          </a>
        </div>
        <div class="product-name limit-text-to-3-lines">
          <a href="detail.html?productId=${product.id}" class="product-link">
            ${product.name}
          </a>
        </div>
        <div class="product-rating-container">
          <img class="product-rating-stars" src="images/ratings/rating-${product.star * 10}.png" alt="${product.star} stars">
        </div>
        <div class="product-price">
          ${formatPriceRange(product.lower_price, product.higher_price)}
        </div>
        <div class="product-quantity-container">
          <select>
            <option selected value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10+</option>
          </select>
        </div>
        <div class="product-spacer"></div>
        <a href="detail.html?productId=${product.id}" class="add-to-cart-button button-primary">
          View Details
        </a>
        <div class="added-message">
          <img src="images/icons/checkmark.png">
          Added
        </div>
      </div>
    `;
  });
  return productsHTML;
}

// Function to load all books with pagination
window.loadAllBooks = function() {
  // Hide the submenu after selection  
  hideActiveSubmenus();
  
  // Add loading animation
  showLoadingState();

  // Reset active nav items
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Set the "Browse All Books" link as active
  const allBooksLink = document.querySelector('.all-products-link');
  if (allBooksLink) {
    allBooksLink.classList.add('active');
  }

  // Clear URL hash
  if (history.pushState) {
    history.pushState(null, null, window.location.pathname);
  } else {
    location.hash = '';
  }

  setTimeout(() => {
    // Get all books from all categories
    let allBooks = [];
    for (const category in booksProducts) {
      allBooks = allBooks.concat(booksProducts[category]);
    }
    
    if (allBooks.length > 0) {
      currentProducts = allBooks;
      currentPage = 1;
      totalItems = allBooks.length;
      
      // Get paginated products for first page
      const paginatedProducts = getPaginatedProducts(allBooks, currentPage);
      const productsHTML = renderProducts(paginatedProducts, 'book');
      const totalPages = Math.ceil(allBooks.length / ITEMS_PER_PAGE);
      
      const productsGrid = document.querySelector('.js-prodcts-grid');
      productsGrid.innerHTML = productsHTML;
      productsGrid.classList.remove('showing-coming-soon');
      
      // Update pagination separately
      updatePaginationDisplay(currentPage, totalPages, allBooks.length);
      
      // Re-attach event listeners
      attachAddToCartListeners();
      
      // Update page header
      updatePageHeader('All Books', allBooks.length);
      
      // Remove breadcrumb for all books view
      const breadcrumbElement = document.querySelector('.breadcrumb-nav');
      if (breadcrumbElement) {
        breadcrumbElement.remove();
      }
      
      // Scroll to products
      scrollToProducts();
    }
  }, 200);
};

// Function to handle loading of specific book category products
window.loadSpecificCategory = function(categoryName) {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  // Add loading animation
  showLoadingState();

  // --- Highlight the corresponding nav item ---
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === categoryName) {
      link.classList.add('active');
    }
  });

  // Convert category for use in hash navigation
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '').replace(/'/g, '');

  // Update URL hash without triggering a navigation
  if (!window.preventHashUpdate) {
    window.updatingHashFromCategory = true;
    if (history.pushState) {
      history.pushState(null, null, `#${categorySlug}`);
    } else {
      location.hash = `#${categorySlug}`;
    }
    setTimeout(() => {
      window.updatingHashFromCategory = false;
    }, 100);
  }

  // Small delay for smooth transition
  setTimeout(() => {
    // Map category names to book category keys
    const categoryMap = {
      'Classics': 'classics',
      'Contemporary': 'contemporary',
      'Crime': 'crime', 
      'Erotica': 'erotica',
      'Fantasy': 'fantasy',
      'Historical Fiction': 'historical_fiction',
      'Horror': 'horror',
      'Mystery': 'mystery',
      'Novels': 'novels',
      'Paranormal': 'paranormal',
      'Romance': 'romance',
      'Science Fiction': 'science_fiction',
      'Short Stories': 'short_stories',
      'Suspense': 'suspense',
      'Thriller': 'thriller',
      'Womens Fiction': 'womens_fiction',
      'Women\'s Fiction': 'womens_fiction',
      'Nonfiction': 'nonfiction',
      'Non-Fiction': 'nonfiction',
      'Childrens': 'childrens',
      'Children\'s': 'childrens',
      'Young Adult': 'young_adult',
      'New Adult': 'new_adult',
      'Academic': 'academic',
      'Art': 'art',
      'Sequential Art': 'sequential_art',
      'Music': 'music',
      'Cultural': 'cultural',
      'Health': 'health',
      'Self Help': 'self_help',
      'Psychology': 'psychology',
      'Parenting': 'parenting',
      'Religion': 'religion',
      'Christian': 'christian',
      'Christian Fiction': 'christian_fiction',
      'Spirituality': 'spirituality',
      'Philosophy': 'philosophy',
      'Business': 'business',
      'Politics': 'politics',
      'Science': 'science',
      'Biography': 'biography',
      'Autobiography': 'autobiography',
      'History': 'history',
      'Historical': 'historical',
      'Poetry': 'poetry',
      'Humor': 'humor',
      'Sports and Games': 'sports_and_games',
      'Food and Drink': 'food_and_drink',
      'Travel': 'travel',
      'Adult Fiction': 'adult_fiction',
      'Default': 'default'
    };

    // Get the book category key
    const bookCategoryKey = categoryMap[categoryName];
    
    if (bookCategoryKey && booksProducts[bookCategoryKey]) {
      // Load books from the specific category
      const categoryBooks = booksProducts[bookCategoryKey];
      currentProducts = categoryBooks; // Store current products for pagination
      const paginatedProducts = getPaginatedProducts(currentProducts, currentPage);
      const productsHTML = renderProducts(paginatedProducts, 'book');
      const totalPages = Math.ceil(currentProducts.length / ITEMS_PER_PAGE);
      
      const productsGrid = document.querySelector('.js-prodcts-grid');
      productsGrid.innerHTML = productsHTML;
      productsGrid.classList.remove('showing-coming-soon');
      
      // Update pagination separately
      updatePaginationDisplay(currentPage, totalPages, currentProducts.length);
      
      // Re-attach event listeners
      attachAddToCartListeners();
      
      // Update page header
      updatePageHeader(categoryName, categoryBooks.length);
      
      // Update breadcrumb navigation
      updateBreadcrumb(bookCategoryKey);
      
      // Scroll to products
      scrollToProducts();
    } else {
      // Fallback for unknown categories
      const productsGrid = document.querySelector('.js-prodcts-grid');
      productsGrid.innerHTML = `
        <div class="coming-soon">
          <h2>Category Not Found</h2>
          <p>The category "${categoryName}" was not found. Please check the navigation menu.</p>
        </div>
      `;
      productsGrid.classList.add('showing-coming-soon');
      
      // Clear pagination for error state
      clearPaginationDisplay();
    }
  }, 200);
};

// Function to hide all active submenus
function hideActiveSubmenus() {
  document.querySelectorAll('.submenu.active').forEach(submenu => {
    submenu.classList.remove('active');
  });
  document.querySelectorAll('.expandable.active').forEach(link => {
    link.classList.remove('active');
  });
}

// Function to show loading state
function showLoadingState() {
  const productsGrid = document.querySelector('.js-prodcts-grid');
  productsGrid.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading books...</p>
    </div>
  `;
  productsGrid.classList.remove('showing-coming-soon');
}

// Function to scroll to products section
function scrollToProducts() {
  // Get the main container to scroll to
  const mainElement = document.querySelector('.main');
  
  if (mainElement) {
    // Scroll to the main section with a slight offset to show the header
    window.scrollTo({
      top: mainElement.offsetTop - 120,
      behavior: 'smooth'
    });
  }
}

// Function to update page header with optional product count
function updatePageHeader(title, productCount = null) {
  let headerElement = document.querySelector('.page-header');
  if (!headerElement) {
    // Create header if it doesn't exist
    headerElement = document.createElement('h2');
    headerElement.className = 'page-header';
    headerElement.style.margin = '20px 0';
    headerElement.style.textAlign = 'center';
    headerElement.style.fontSize = '24px';
    headerElement.style.fontWeight = 'bold';
    
    const mainElement = document.querySelector('.main');
    mainElement.insertBefore(headerElement, mainElement.firstChild);
  }
  
  // Format title with product count if provided
  if (productCount !== null && productCount !== undefined) {
    headerElement.textContent = `${title} (${productCount} books)`;
  } else {
    headerElement.textContent = title;
  }
}

// Function to update breadcrumb navigation
function updateBreadcrumb(category) {
  let breadcrumbElement = document.querySelector('.breadcrumb-nav');
  if (!breadcrumbElement) {
    // Create breadcrumb if it doesn't exist
    breadcrumbElement = document.createElement('div');
    breadcrumbElement.className = 'breadcrumb-nav';
    
    const mainElement = document.querySelector('.main');
    mainElement.insertBefore(breadcrumbElement, mainElement.firstChild);
  }
  
  if (category && category !== 'all') {
    breadcrumbElement.innerHTML = `
      <a href="index.html" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator"> > </span>
      <span class="breadcrumb-current">${category}</span>
    `;
  } else {
    // For homepage (all products), remove breadcrumb completely for clean look
    if (breadcrumbElement) {
      breadcrumbElement.remove();
    }
  }
}

// Function to attach add to cart event listeners (placeholder)
function attachAddToCartListeners() {
  // No-op function - cart functionality is disabled for now
}

// Function to find any product by ID (books)
export function findProductById(productId) {
  // Search through all book categories
  for (const category in booksProducts) {
    const categoryBooks = booksProducts[category];
    const product = categoryBooks.find(p => p.id === productId);
    if (product) {
      return product;
    }
  }
  return null;
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if this is the home page (no hash or specific parameters)
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  // If no specific category is requested, load all books
  if (!hash && !urlParams.get('category')) {
    loadAllBooks();
  }
});

import { booksProducts } from "../../data/books.js";
import { formatPriceRange } from "./money.js";
import { addToCart } from "../../data/cart.js";
import { updateCartQuantity } from "./cart-quantity.js";

// Helper function to encode image URLs properly
function encodeImagePath(imagePath) {
  return imagePath
    .split("/")
    .map((part) => {
      // Encode all parts that contain special characters
      if (part.match(/[()#:&?,\s]/)) {
        return encodeURIComponent(part);
      }
      return part;
    })
    .join("/");
}

// Search functionality for the header
class SearchSystem {
  constructor() {
    this.searchInput = null;
    this.searchButton = null;
    this.searchHistoryDropdown = null;
    this.isInitialized = false;
    this.maxHistoryItems = 10;
    this.searchHistory = this.loadSearchHistory();
  }
  init() {
    // Prevent double initialization
    if (this.isInitialized) {
      return;
    }

    // Wait for the header to be loaded
    this.waitForHeader();
  }
  waitForHeader() {
    // Check if header elements exist, if not wait and try again
    const checkInterval = setInterval(() => {
      this.searchInput = document.querySelector(".search-bar");
      this.searchButton = document.querySelector(".search-button");
      if (this.searchInput && this.searchButton && !this.isInitialized) {
        this.setupEventListeners();
        this.setupSearchHistory();
        this.isInitialized = true;
        clearInterval(checkInterval);

        // Check for URL search parameters
        this.handleURLSearchParams();
      }
    }, 100); // Check every 100ms

    // Stop checking after 10 seconds to avoid infinite loop
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }

  setupEventListeners() {
    if (!this.searchInput || !this.searchButton) return;

    // Handle search button click
    this.searchButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.performSearch();
    });

    // Handle Enter key press in search input
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.performSearch();
      }
    }); // Handle input changes for live search (optional)
    this.searchInput.addEventListener("input", (e) => {
      this.handleSearchInput(e.target.value);
    }); // Handle focus/blur for search history
    this.searchInput.addEventListener("focus", () => {
      if (this.searchHistory.length > 0) {
        this.showSearchHistory();
      }
    });

    this.searchInput.addEventListener("blur", (e) => {
      // Delay hiding to allow clicks on dropdown items
      setTimeout(() => {
        this.hideSearchHistory();
      }, 200);
    });

    // Also show on hover for better UX
    this.searchInput.addEventListener("mouseenter", () => {
      if (this.searchHistory.length > 0) {
        this.showSearchHistory();
      }
    });

    // Keep dropdown visible when hovering over it
    const searchContainer = this.searchInput.parentNode;
    if (searchContainer) {
      searchContainer.addEventListener("mouseleave", () => {
        setTimeout(() => {
          this.hideSearchHistory();
        }, 300);
      });
    } // Handle clicks outside to hide dropdown
    document.addEventListener("click", (e) => {
      if (
        !this.searchInput?.contains(e.target) &&
        !this.searchHistoryDropdown?.contains(e.target) &&
        !this.searchButton?.contains(e.target)
      ) {
        this.hideSearchHistory();
      }
    });
  }
  setupSearchHistory() {
    try {
      // Create search history dropdown
      this.searchHistoryDropdown = document.createElement("div");
      this.searchHistoryDropdown.className = "search-history-dropdown";

      // Insert after the search input
      const searchContainer = this.searchInput.parentNode;
      if (searchContainer) {
        searchContainer.appendChild(this.searchHistoryDropdown);
        this.updateSearchHistoryDisplay();
      }
    } catch (error) {
      // Silent error handling
    }
  }

  loadSearchHistory() {
    try {
      const stored = localStorage.getItem("qili_search_history");
      let history = stored ? JSON.parse(stored) : [];

      // Add some default search history for testing if none exists
      if (history.length === 0) {
        history = [
          { term: "fiction", timestamp: Date.now() - 1000000 },
          { term: "mystery", timestamp: Date.now() - 2000000 },
          { term: "romance", timestamp: Date.now() - 3000000 },
          { term: "fantasy", timestamp: Date.now() - 4000000 },
        ];
      }

      return history;
    } catch (e) {
      return [];
    }
  }

  saveSearchHistory() {
    try {
      localStorage.setItem(
        "qili_search_history",
        JSON.stringify(this.searchHistory)
      );
    } catch (e) {
      // Silent error handling
    }
  }

  addToSearchHistory(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) return;

    const term = searchTerm.trim();

    // Remove existing entry if it exists
    this.searchHistory = this.searchHistory.filter(
      (item) => item.term !== term
    );

    // Add to beginning of array
    this.searchHistory.unshift({
      term: term,
      timestamp: Date.now(),
    });

    // Keep only the most recent items
    this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);

    this.saveSearchHistory();
    this.updateSearchHistoryDisplay();
  }

  clearSearchHistory() {
    this.searchHistory = [];
    this.saveSearchHistory();
    this.updateSearchHistoryDisplay();
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  }

  updateSearchHistoryDisplay() {
    if (!this.searchHistoryDropdown) return;

    if (this.searchHistory.length === 0) {
      this.searchHistoryDropdown.innerHTML = `
        <div class="search-history-empty">No recent searches</div>
      `;
    } else {
      const historyItems = this.searchHistory
        .map(
          (item) => `
        <div class="search-history-item" data-term="${item.term}">
          <span class="search-history-text">${item.term}</span>
          <span class="search-history-time">${this.formatTimeAgo(
            item.timestamp
          )}</span>
        </div>
      `
        )
        .join("");

      this.searchHistoryDropdown.innerHTML = `
        <div class="search-history-header">Recent Searches</div>
        ${historyItems}
        <div class="search-history-clear">Clear History</div>
      `;

      // Add event listeners
      this.searchHistoryDropdown
        .querySelectorAll(".search-history-item")
        .forEach((item) => {
          item.addEventListener("click", (e) => {
            const term = e.currentTarget.getAttribute("data-term");
            this.searchInput.value = term;
            this.hideSearchHistory();
            this.performSearch();
          });
        });

      const clearButton = this.searchHistoryDropdown.querySelector(
        ".search-history-clear"
      );
      if (clearButton) {
        clearButton.addEventListener("click", (e) => {
          e.stopPropagation();
          this.clearSearchHistory();
        });
      }
    }
  }
  showSearchHistory() {
    if (!this.searchHistoryDropdown) return;
    if (this.searchHistory.length === 0) return;

    // Force the dropdown to appear
    this.searchHistoryDropdown.style.zIndex = "1001";
    this.searchHistoryDropdown.style.position = "absolute";
    this.searchHistoryDropdown.classList.add("show");
  }

  hideSearchHistory() {
    if (!this.searchHistoryDropdown) return;

    this.searchHistoryDropdown.classList.remove("show");
  }
  performSearch() {
    const searchTerm = this.searchInput.value.trim();

    // Enhanced validation
    if (!searchTerm) {
      this.showSearchMessage("Please enter a search term", "warning");
      this.searchInput.focus();
      return;
    }

    if (searchTerm.length < 2) {
      this.showSearchMessage(
        "Search term must be at least 2 characters",
        "warning"
      );
      return;
    }

    if (searchTerm.length > 100) {
      this.showSearchMessage(
        "Search term is too long (max 100 characters)",
        "warning"
      );
      return;
    }

    // Show loading state
    this.showSearchLoading(true);

    try {
      // Track search query
      if (window.analytics) {
        window.analytics.trackSearchQuery(searchTerm);
      }

      // Add to search history
      this.addToSearchHistory(searchTerm);

      // Hide search history dropdown
      this.hideSearchHistory();

      // Redirect to index page if not already there, then perform search
      if (!this.isIndexPage()) {
        // Navigate to index page with search parameter
        window.location.href = `index.html?search=${encodeURIComponent(
          searchTerm
        )}`;
        return;
      }

      // Perform search on current page
      this.searchProducts(searchTerm);
    } catch (error) {
      console.error("Search error:", error);
      this.showSearchMessage("Search failed. Please try again.", "error");
    } finally {
      this.showSearchLoading(false);
    }
  }
  searchProducts(searchTerm) {
    const searchTermLower = searchTerm.toLowerCase();
    let searchResults = [];
    try {
      // Check if product data is available, if not wait for it to load
      const hasProducts = window.booksProducts;

      if (!hasProducts) {
        // Wait for product data to load, then retry search
        this.waitForProductData(() => this.searchProducts(searchTerm));
        return;
      }

      // Search in books products only
      if (window.booksProducts) {
        for (const category in window.booksProducts) {
          const products = window.booksProducts[category];
          const matches = products.filter((product) =>
            this.productMatchesSearch(product, searchTermLower, {
              category: category,
              brand: null,
              type: "book",
            })
          );
          searchResults = searchResults.concat(
            matches.map((p) => ({ ...p, type: "book", category: category }))
          );
        }
      }

      this.displaySearchResults(searchResults, searchTerm);
    } catch (error) {
      this.showSearchMessage(
        "Search temporarily unavailable. Please try again."
      );
    }
  }
  productMatchesSearch(product, searchTerm, context = {}) {
    if (!product) return false;

    // Search in product name
    if (product.name && product.name.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in derived category (from data structure)
    if (
      context.category &&
      context.category.toLowerCase().includes(searchTerm)
    ) {
      return true;
    }

    // Search in product category (if exists)
    if (
      product.category &&
      product.category.toLowerCase().includes(searchTerm)
    ) {
      return true;
    }

    // Search in product subcategory (if exists)
    if (
      product.subcategory &&
      product.subcategory.toLowerCase().includes(searchTerm)
    ) {
      return true;
    }

    // Search in derived brand (from data structure)
    if (context.brand && context.brand.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in product brand (if exists)
    if (product.brand && product.brand.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Special handling for common search terms
    // Handle book-related searches
    if (context.type === "book") {
      // Handle generic book searches
      if (
        searchTerm.includes("book") ||
        searchTerm.includes("novel") ||
        searchTerm.includes("read")
      ) {
        return true;
      }

      // Handle fiction/non-fiction searches
      if (
        searchTerm.includes("fiction") &&
        (context.category.toLowerCase().includes("fiction") ||
          product.name.toLowerCase().includes("fiction"))
      ) {
        return true;
      }

      // Handle author searches (if the search term might be an author name)
      if (product.author && product.author.toLowerCase().includes(searchTerm)) {
        return true;
      }
    }

    return false;
  }
  displaySearchResults(results, searchTerm) {
    // Hide any active submenus
    if (window.hideActiveSubmenus) {
      window.hideActiveSubmenus();
    }

    // Clear any sub-header highlighting for search results
    this.clearSubHeaderHighlight();

    // Protect the search header from being overridden
    this.protectSearchHeader();

    // Force update the page header to show search results count
    this.updateSearchPageHeader(results.length);

    // Update breadcrumb
    this.updateSearchBreadcrumb(searchTerm);

    const productsGrid = document.querySelector(".js-prodcts-grid");
    if (!productsGrid) {
      this.showSearchMessage("Unable to display search results");
      return;
    }

    // Remove any existing search results header since we're showing count in page title
    const existingHeader = document.querySelector(".search-results-header");
    if (existingHeader) {
      existingHeader.remove();
    }

    if (results.length === 0) {
      // Clear pagination for no results
      this.clearPagination();

      productsGrid.innerHTML = `
        <div class="search-no-results">
          <h2>No results found for "${searchTerm}"</h2>
          <p>Try adjusting your search terms or browse our categories.</p>
          <div class="search-suggestions">
            <h3>Popular categories:</h3>
            <div class="suggestion-links">
              <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Fiction')">Fiction</a>
              <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Non-Fiction')">Non-Fiction</a>
              <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Mystery')">Mystery</a>
              <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Romance')">Romance</a>
              <a href="javascript:void(0)" onclick="window.loadAllBooks && window.loadAllBooks()">All Books</a>
            </div>
          </div>
        </div>
      `;
    } else {
      // Set up pagination for search results
      this.setupSearchPagination(results, searchTerm);
    }

    productsGrid.classList.remove("showing-coming-soon");

    // Scroll to products
    if (window.scrollToProducts) {
      window.scrollToProducts();
    }

    // Update URL with search parameter (only if not from pagination)
    if (!this.isFromPagination) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set("search", searchTerm);
      newUrl.searchParams.delete("page"); // Remove page param for new searches
      window.history.pushState(null, "", newUrl);
    }
    this.isFromPagination = false; // Reset flag
  }
  renderSearchResults(results, container) {
    // Remove the search results info since it's now displayed in the header
    let html = "";

    results.forEach((product) => {
      // Make sure we have a rating or default to 0
      const rating = product.star || 0;

      html += `
        <div class="product-container">        
          <div class="product-image-container">
            <a href="detail.html?productId=${
              product.id
            }" class="product-image-link">
              <img class="product-image" src="${encodeImagePath(
                product.image
              )}">
            </a>
          </div>
          <div class="product-name limit-text-to-3-lines">
            <a href="detail.html?productId=${product.id}" class="product-link">
              ${product.name}
            </a>
          </div>
          <div class="product-rating-container">
            <img class="product-rating-stars" src="images/ratings/rating-${
              rating * 10
            }.png" alt="${rating} stars">
          </div>
          <div class="product-price">
            ${(() => {
              if (
                product.lower_price !== undefined ||
                product.higher_price !== undefined
              ) {
                // Use the same price formatting as the main site
                const formatPriceRange =
                  window.formatPriceRange ||
                  ((lower, higher) => {
                    if (lower && higher) {
                      return `USD: $${(lower / 100).toFixed(0)} - $${(
                        higher / 100
                      ).toFixed(0)}`;
                    } else if (lower) {
                      return `USD: $${(lower / 100).toFixed(0)}`;
                    } else {
                      return "Contact for Price";
                    }
                  });
                return formatPriceRange(
                  product.lower_price,
                  product.higher_price
                );
              } else if (product.price) {
                return "USD: $" + (product.price / 100).toFixed(2);
              } else {
                return "Contact for Price";
              }
            })()}
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
          <button class="add-to-cart-button button-primary js-add-to-cart" data-product-id="${
            product.id
          }">
            Add to Cart
          </button>
          <div class="added-message">
            Added
          </div>
        </div>`;
    });

    container.innerHTML = html;

    // Add event listeners for add-to-cart buttons
    this.attachAddToCartListeners();
  }

  attachAddToCartListeners() {
    document.querySelectorAll(".js-add-to-cart").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const productId = button.dataset.productId;

          // Get the quantity from the dropdown
          const productContainer = button.closest(".product-container");
          const quantitySelect = productContainer.querySelector("select");
          const quantity = Number(quantitySelect.value) || 1;

          // Import and call addToCart with the selected quantity
          const { addToCart } = await import("../../data/cart.js");
          const { updateCartQuantity } = await import("./cart-quantity.js");

          const success = addToCart(productId, quantity, "search");

          if (success !== false) {
            // Track this as a search-to-cart conversion specifically
            if (window.analytics) {
              window.analytics.trackAddToCart(productId, "search", "search");
            }

            updateCartQuantity();

            // Show the 'Added' message
            const addedMessage =
              productContainer.querySelector(".added-message");
            if (addedMessage) {
              addedMessage.style.display = "block";
              setTimeout(() => {
                addedMessage.style.display = "none";
              }, 2000);
            }

            // Add visual feedback to button
            button.textContent = "Added!";
            button.disabled = true;
            setTimeout(() => {
              button.textContent = "Add to Cart";
              button.disabled = false;
            }, 2000);
          }
        } catch (error) {
          console.error("Error adding to cart:", error);
          // Show error feedback
          const originalText = button.textContent;
          button.textContent = "Error!";
          button.style.backgroundColor = "#ff4444";
          setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = "";
          }, 2000);
        }
      });
    });
  }

  updateSearchBreadcrumb(searchTerm) {
    let breadcrumbElement = document.querySelector(".breadcrumb-nav");
    if (!breadcrumbElement) {
      breadcrumbElement = document.createElement("div");
      breadcrumbElement.className = "breadcrumb-nav";

      const mainElement = document.querySelector(".main");
      if (mainElement) {
        mainElement.insertBefore(breadcrumbElement, mainElement.firstChild);
      }
    }

    breadcrumbElement.innerHTML = `
      <a href="javascript:void(0)" onclick="window.searchSystem.restoreOriginalPageHeader(); window.loadAllBooks && window.loadAllBooks()" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">Search: "${searchTerm}"</span>
    `;
  }
  handleSearchInput(value) {
    // Optional: implement live search suggestions
    // For now, we'll keep it simple and only search on Enter/Click
  }
  handleURLSearchParams() {
    // Check if there's a search parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    let searchTerm = urlParams.get("search");

    // If no search term in URL but we detected it early, use the stored term
    if (!searchTerm && window.earlySearchTerm) {
      searchTerm = window.earlySearchTerm;
    }

    if (searchTerm) {
      // Set the search input value
      if (this.searchInput) {
        this.searchInput.value = searchTerm;
      }

      // Add to search history (but only if not already added)
      this.addToSearchHistory(searchTerm);

      // If this was detected early, hide active submenus immediately
      if (window.isEarlySearchDetection) {
        // Hide any active submenus
        if (window.hideActiveSubmenus) {
          window.hideActiveSubmenus();
        }

        // Clear sub-header highlighting
        this.clearSubHeaderHighlight();
      }

      // Perform the search automatically
      this.searchProducts(searchTerm);
    }
  }

  showSearchMessage(message) {
    // Show temporary message to user
    const existingMessage = document.querySelector(".search-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = "search-message";
    messageDiv.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    // Remove message after 3 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  isIndexPage() {
    return (
      window.location.pathname.includes("index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname.endsWith("/")
    );
  }

  waitForProductData(callback) {
    // Show loading message
    this.showSearchMessage("Products are loading. Please wait...");

    // Check for product data availability every 100ms
    const checkInterval = setInterval(() => {
      const hasProducts = window.booksProducts;

      if (hasProducts) {
        clearInterval(checkInterval);
        callback();
      }
    }, 100);

    // Stop checking after 10 seconds to avoid infinite loop
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.booksProducts) {
        this.showSearchMessage(
          "Unable to load product data. Please refresh the page and try again."
        );
      }
    }, 10000);
  }

  clearSubHeaderHighlight() {
    // Remove any active highlighting from sub-header links
    const subHeaderLinks = document.querySelectorAll(".sub-header-link");
    subHeaderLinks.forEach((link) => {
      link.classList.remove("active");
    });
  }

  // Search pagination functionality
  setupSearchPagination(results, searchTerm) {
    const ITEMS_PER_PAGE = 20;
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
    const currentPage = this.getCurrentSearchPage();

    // Store search results and term for pagination
    this.currentSearchResults = results;
    this.currentSearchTerm = searchTerm;

    // Display current page of results
    this.displaySearchPage(currentPage, ITEMS_PER_PAGE);

    // Update pagination display
    this.updateSearchPagination(currentPage, totalPages, results.length);
  }

  getCurrentSearchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get("page")) || 1;
    return Math.max(1, page);
  }

  displaySearchPage(page, itemsPerPage) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResults = this.currentSearchResults.slice(startIndex, endIndex);

    const productsGrid = document.querySelector(".js-prodcts-grid");
    if (!productsGrid) return;

    // Always use renderProducts function now that it's globally available
    // This ensures search results match the normal product display
    if (window.renderProducts && typeof window.renderProducts === "function") {
      try {
        const productsHTML = window.renderProducts(pageResults, "book");
        productsGrid.innerHTML = productsHTML;

        // Re-attach event listeners
        if (
          window.attachAddToCartListeners &&
          typeof window.attachAddToCartListeners === "function"
        ) {
          window.attachAddToCartListeners();
        } else {
          // Fallback to our own add to cart listeners
          this.attachAddToCartListeners();
        }

        // Attach product click tracking for search results
        if (
          window.attachProductClickTracking &&
          typeof window.attachProductClickTracking === "function"
        ) {
          window.attachProductClickTracking("search");
        }

        // Enhance product images with fallback handling
        if (window.ImageLoader && window.ImageLoader.enhanceProductImages) {
          window.ImageLoader.enhanceProductImages();
        }
      } catch (error) {
        console.warn(
          "Error using global renderProducts, falling back to search renderResults:",
          error
        );
        // Fallback rendering
        this.renderSearchResults(pageResults, productsGrid);
      }
    } else {
      // Fallback rendering
      console.log(
        "Global renderProducts not available, using search renderResults"
      );
      this.renderSearchResults(pageResults, productsGrid);
    }
  }

  updateSearchPagination(currentPage, totalPages, totalItems) {
    // Remove existing pagination if it exists
    let paginationElement = document.querySelector(".pagination-wrapper");
    if (paginationElement) {
      paginationElement.remove();
    }

    // Only create pagination if we have more than one page
    if (totalPages > 1) {
      // Create new pagination element
      paginationElement = document.createElement("div");
      paginationElement.className = "pagination-wrapper";
      paginationElement.innerHTML = this.createSearchPaginationHTML(
        currentPage,
        totalPages,
        totalItems
      );

      // Insert pagination after the products grid
      const mainElement = document.querySelector(".main");
      if (mainElement) {
        mainElement.appendChild(paginationElement);
      }
    }
  }

  createSearchPaginationHTML(currentPage, totalPages, totalItems) {
    let paginationHTML = `
      <div class="pagination-container">
        <div class="pagination-info">
          Page ${currentPage} of ${totalPages} Results (${totalItems} total)
        </div>
        <div class="pagination-controls">
    `;

    // Previous button
    if (currentPage > 1) {
      paginationHTML += `<button class="pagination-btn" onclick="window.searchSystem.changeSearchPage(${
        currentPage - 1
      })">Previous</button>`;
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      paginationHTML += `<button class="pagination-btn" onclick="window.searchSystem.changeSearchPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? "active" : "";
      paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="window.searchSystem.changeSearchPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
      paginationHTML += `<button class="pagination-btn" onclick="window.searchSystem.changeSearchPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
      paginationHTML += `<button class="pagination-btn" onclick="window.searchSystem.changeSearchPage(${
        currentPage + 1
      })">Next</button>`;
    }

    // Last button
    if (currentPage < totalPages) {
      paginationHTML += `<button class="pagination-btn" onclick="window.searchSystem.changeSearchPage(${totalPages})">Last</button>`;
    }

    paginationHTML += `
        </div>
      </div>
    `;

    return paginationHTML;
  }

  changeSearchPage(page) {
    if (!this.currentSearchResults || !this.currentSearchTerm) return;

    const ITEMS_PER_PAGE = 20;
    const totalPages = Math.ceil(
      this.currentSearchResults.length / ITEMS_PER_PAGE
    );

    // Validate page number
    if (page < 1 || page > totalPages) return;

    // Track search pagination navigation
    if (window.analytics) {
      window.analytics.trackCategoryClick(
        "Search Pagination",
        `Page ${page} - "${this.currentSearchTerm}"`
      );
    }

    // Update URL with new page
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("search", this.currentSearchTerm);
    newUrl.searchParams.set("page", page.toString());
    window.history.pushState(null, "", newUrl);

    // Display the new page
    this.displaySearchPage(page, ITEMS_PER_PAGE);

    // Update pagination display
    this.updateSearchPagination(
      page,
      totalPages,
      this.currentSearchResults.length
    );

    // Scroll to top of products
    if (window.scrollToProducts) {
      window.scrollToProducts();
    }
  }

  clearPagination() {
    const paginationElement = document.querySelector(".pagination-wrapper");
    if (paginationElement) {
      paginationElement.remove();
    }
  }

  updateSearchPageHeader(resultCount) {
    // Force update the page header for search results
    let headerElement = document.querySelector(".page-header");
    if (!headerElement) {
      // Create header if it doesn't exist
      headerElement = document.createElement("h2");
      headerElement.className = "page-header";
      headerElement.style.margin = "20px 0";
      headerElement.style.textAlign = "center";
      headerElement.style.fontSize = "24px";
      headerElement.style.fontWeight = "bold";

      const mainElement = document.querySelector(".main");
      if (mainElement) {
        mainElement.insertBefore(headerElement, mainElement.firstChild);
      }
    }

    // Force the search result header text
    headerElement.textContent = `Search result (${resultCount} book${
      resultCount !== 1 ? "s" : ""
    })`;

    // Mark this header as a search header to prevent other scripts from overriding it
    headerElement.setAttribute("data-search-header", "true");

    // Protect search header from being overridden by other scripts
    this.protectSearchHeader();

    // Also try calling the global function as backup
    if (window.updatePageHeader) {
      setTimeout(() => {
        // Delay to ensure it runs after any other page header updates
        if (headerElement.getAttribute("data-search-header") === "true") {
          headerElement.textContent = `Search result (${resultCount} book${
            resultCount !== 1 ? "s" : ""
          })`;
        }
      }, 100);
    }
  }

  // Protect search header from being overridden by other scripts
  protectSearchHeader() {
    // Override the global updatePageHeader function temporarily for search results
    if (window.updatePageHeader && !window.originalUpdatePageHeader) {
      window.originalUpdatePageHeader = window.updatePageHeader;

      window.updatePageHeader = (title, count) => {
        const headerElement = document.querySelector(".page-header");
        // Only allow updates if this is not a search header
        if (
          !headerElement ||
          headerElement.getAttribute("data-search-header") !== "true"
        ) {
          window.originalUpdatePageHeader(title, count);
        }
      };
    }
  }

  // Restore the original updatePageHeader function
  restoreOriginalPageHeader() {
    const headerElement = document.querySelector(".page-header");
    if (headerElement) {
      headerElement.removeAttribute("data-search-header");
    }

    if (window.originalUpdatePageHeader) {
      window.updatePageHeader = window.originalUpdatePageHeader;
      window.originalUpdatePageHeader = null;
    }
  }

  // Helper function to show search message with different types
  showSearchMessage(message, type = "info") {
    // Remove existing message
    const existingMessage = document.querySelector(".search-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = `search-message search-message-${type}`;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "error"
          ? "#f44336"
          : type === "warning"
          ? "#ff9800"
          : "#2196F3"
      };
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    // Animate in
    setTimeout(() => {
      messageDiv.style.transform = "translateX(0)";
    }, 10);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (messageDiv && messageDiv.parentNode) {
        messageDiv.style.transform = "translateX(100%)";
        setTimeout(() => {
          if (messageDiv && messageDiv.parentNode) {
            messageDiv.remove();
          }
        }, 300);
      }
    }, 4000);
  }

  // Helper function to show search loading state
  showSearchLoading(show) {
    const button = this.searchButton;
    if (!button) return;

    if (show) {
      button.disabled = true;
      button.style.opacity = "0.6";
      button.style.cursor = "not-allowed";

      // Store original content
      if (!button.dataset.originalContent) {
        button.dataset.originalContent = button.innerHTML;
      }

      button.innerHTML = '<span style="font-size: 12px;">Searching...</span>';
    } else {
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";

      // Restore original content
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
      }
    }
  }
}

// Initialize search system
const searchSystem = new SearchSystem();

// Early detection of search parameters to prevent other scripts from overriding
const urlParams = new URLSearchParams(window.location.search);
const hasSearchParam = urlParams.get("search");
if (hasSearchParam) {
  // Set a flag to indicate early search detection
  window.isEarlySearchDetection = true;

  // Store the search term for later use
  window.earlySearchTerm = hasSearchParam;

  // Set up a very early initialization that runs before other scripts
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Initialize search immediately on DOM ready if search param detected
      searchSystem.init();
    });
  } else {
    // DOM already loaded, initialize immediately
    searchSystem.init();
  }
}

// Make search system globally available immediately
window.searchSystem = searchSystem;

// Also initialize search when header is loaded
window.addEventListener("headerLoaded", () => {
  if (!searchSystem.isInitialized) {
    searchSystem.init();
  }
});

// Initialize on DOMContentLoaded as fallback
document.addEventListener("DOMContentLoaded", () => {
  if (!searchSystem.isInitialized) {
    // Try to initialize search system after a short delay to allow header to load
    setTimeout(() => {
      searchSystem.init();
    }, 500);
  }
});

// Export for module usage
export { SearchSystem, searchSystem };

// Shared Header Loader
async function loadSharedHeader() {
  try {
    const response = await fetch("components/shared-header.html");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const headerHTML = await response.text();

    // Find the placeholder element for the header
    const placeholder = document.getElementById("shared-header-placeholder");
    if (placeholder) {
      // Replace placeholder with actual header content
      placeholder.innerHTML = headerHTML;

      // Initialize cart quantity after header is loaded
      initializeCartQuantityAfterHeaderLoad();

      // Initialize search functionality after header is loaded
      initializeSearchAfterHeaderLoad();

      // Add analytics tracking for dashboard clicks
      initializeDashboardAnalytics();

      // Initialize authentication UI
      initializeAuthenticationAfterHeaderLoad();

      // Dispatch event that header is loaded
      window.dispatchEvent(new CustomEvent("headerLoaded"));
    } else {
      console.error("Shared header placeholder not found");
    }
  } catch (error) {
    console.error("Error loading shared header:", error);

    // Show fallback header
    showFallbackHeader();
  }
}

function showFallbackHeader() {
  const placeholder = document.getElementById("shared-header-placeholder");
  if (placeholder) {
    placeholder.innerHTML = `
      <div class="qili-header fallback-header">
        <div class="qili-header-left-section">
          <a href="index.html" class="header-link">
            <span style="color: white; font-weight: bold;">BooksProject</span>
          </a>
        </div>
        <div class="qili-header-middle-section">
          <input class="search-bar" type="text" placeholder="Search" />
          <button class="search-button">Search</button>
        </div>
        <div class="qili-header-right-section">
          <a class="cart-link header-link" href="checkout.html">
            <span>Cart</span>
            <div class="cart-quantity js-cart-quantity empty-cart" style="display: flex;">0</div>
          </a>
        </div>
      </div>
    `;

    // Initialize cart quantity for fallback header too
    initializeCartQuantityAfterHeaderLoad();
  }
}

// Initialize search functionality after header is loaded
function initializeSearchAfterHeaderLoad() {
  // Initialize search system if it exists
  if (window.searchSystem) {
    window.searchSystem.init();
  }
}

// Initialize cart quantity display after header is loaded
async function initializeCartQuantityAfterHeaderLoad() {
  try {
    // Import the cart and updateCartQuantity function
    const { cart } = await import("../../data/cart.js");
    const { updateCartQuantity } = await import("./cart-quantity.js");

    // Update cart quantity using the imported function
    updateCartQuantity();
  } catch (error) {
    console.error("Error initializing cart quantity:", error);

    // Fallback: try to calculate cart quantity manually
    try {
      const { cart } = await import("../../data/cart.js");
      let cartQuantity = 0;

      if (cart && Array.isArray(cart)) {
        cart.forEach((cartItem) => {
          cartQuantity += cartItem.quantity;
        });
      }

      const cartQuantityElement = document.querySelector(".js-cart-quantity");
      if (cartQuantityElement) {
        cartQuantityElement.textContent = cartQuantity;
        cartQuantityElement.style.display = "flex";

        // Apply proper styling based on quantity
        if (cartQuantity > 0) {
          cartQuantityElement.classList.add("has-items");
          cartQuantityElement.classList.remove("empty-cart");
        } else {
          cartQuantityElement.classList.remove("has-items");
          cartQuantityElement.classList.add("empty-cart");
          cartQuantityElement.textContent = "0";
        }
      }
    } catch (fallbackError) {
      console.error(
        "Fallback cart quantity calculation failed:",
        fallbackError
      );
    }
  }
}

// Initialize dashboard analytics tracking
function initializeDashboardAnalytics() {
  // Add click tracking for dashboard link without counting as category click
  const dashboardLink = document.querySelector(".dashboard-link");
  if (dashboardLink) {
    dashboardLink.addEventListener("click", () => {
      // Track as a navigation event, not a category click
      if (window.analytics) {
        window.analytics.trackEvent("dashboard_navigation", {
          action: "navigate_to_dashboard",
          timestamp: Date.now(),
        });
      }
    });
  }
}

// Initialize authentication after header loads
function initializeAuthenticationAfterHeaderLoad() {
  // Function to update auth UI
  const updateAuthUI = () => {
    if (
      window.authService &&
      typeof window.authService.updateUI === "function"
    ) {
      window.authService.updateUI();
    }
  };

  // Try immediate update
  updateAuthUI();

  // Also set up a more robust check with retries
  let retryCount = 0;
  const maxRetries = 10;
  const checkAuthService = () => {
    if (
      window.authService &&
      typeof window.authService.updateUI === "function"
    ) {
      window.authService.updateUI();
    } else if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(checkAuthService, 100 * retryCount); // Progressive delay
    }
  };

  // Start checking after a short delay
  setTimeout(checkAuthService, 50);

  // Also listen for the auth service to be ready
  window.addEventListener("authServiceReady", updateAuthUI);
}

// Load the shared header when the DOM is loaded
document.addEventListener("DOMContentLoaded", loadSharedHeader);

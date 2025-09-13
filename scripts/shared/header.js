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
          <input class="search-bar" type="text" placeholder="Search">
        </div>
        <div class="qili-header-right-section">
          <a href="signin.html">Sign In</a>
        </div>
      </div>
    `;
  }
}

// Initialize cart quantity functionality after header loads
function initializeCartQuantityAfterHeaderLoad() {
  try {
    if (typeof updateCartQuantity === "function") {
      updateCartQuantity();
    } else {
      console.log("Cart quantity function not available yet");
    }
  } catch (error) {
    console.error("Error initializing cart quantity:", error);
  }
}

// Initialize search functionality after header loads
function initializeSearchAfterHeaderLoad() {
  try {
    if (typeof initializeSearch === "function") {
      initializeSearch();
    }
  } catch (error) {
    console.error("Error initializing search:", error);
  }
}

// Initialize dashboard analytics after header loads
function initializeDashboardAnalytics() {
  try {
    const dashboardLink = document.querySelector(".dashboard-link");
    if (dashboardLink) {
      dashboardLink.addEventListener("click", function () {
        console.log("Dashboard clicked from header");
        // Add analytics tracking here if needed
      });
    }
  } catch (error) {
    console.error("Error initializing dashboard analytics:", error);
  }
}

// Initialize authentication UI after header loads
function initializeAuthenticationAfterHeaderLoad() {
  try {
    // Wait for auth service to be available
    if (typeof authService !== "undefined" && authService.updateHeader) {
      authService.updateHeader();
    } else {
      // Retry after a short delay if auth service isn't ready yet
      setTimeout(() => {
        if (typeof authService !== "undefined" && authService.updateHeader) {
          authService.updateHeader();
        }
      }, 100);
    }
  } catch (error) {
    console.error("Error initializing authentication UI:", error);
  }
}

// Load header when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadSharedHeader();
});

// Re-export for compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadSharedHeader,
    initializeCartQuantityAfterHeaderLoad,
    initializeSearchAfterHeaderLoad,
    initializeDashboardAnalytics,
    initializeAuthenticationAfterHeaderLoad,
  };
}

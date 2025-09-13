// Shared Footer Loader
async function loadSharedFooter() {
  try {
    const response = await fetch("components/shared-footer.html");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const footerHTML = await response.text();

    // Find the placeholder element for the footer
    const placeholder = document.getElementById("shared-footer-placeholder");
    if (placeholder) {
      // Replace placeholder with actual footer content
      placeholder.innerHTML = footerHTML;

      // Initialize footer functionality
      initializeFooterAfterLoad();

      // Dispatch event that footer is loaded
      window.dispatchEvent(new CustomEvent("footerLoaded"));
    } else {
      console.log(
        "Shared footer placeholder not found - page may not use footer"
      );
    }
  } catch (error) {
    console.error("Error loading shared footer:", error);
  }
}

// Initialize footer functionality after it loads
function initializeFooterAfterLoad() {
  try {
    // Add any footer specific functionality here
    console.log("Footer loaded successfully");
  } catch (error) {
    console.error("Error initializing footer:", error);
  }
}

// Load footer when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadSharedFooter();
});

// Re-export for compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadSharedFooter,
    initializeFooterAfterLoad,
  };
}

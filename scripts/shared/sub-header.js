// Shared Sub-Header Loader
async function loadSharedSubHeader() {
  try {
    const response = await fetch("components/shared-subheader.html");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const subHeaderHTML = await response.text();

    // Find the placeholder element for the sub-header
    const placeholder = document.getElementById("shared-subheader-placeholder");
    if (placeholder) {
      // Replace placeholder with actual sub-header content
      placeholder.innerHTML = subHeaderHTML;

      // Initialize sub-header functionality
      initializeSubHeaderAfterLoad();

      // Dispatch event that sub-header is loaded
      window.dispatchEvent(new CustomEvent("subHeaderLoaded"));
    } else {
      console.log(
        "Shared sub-header placeholder not found - page may not use sub-header"
      );
    }
  } catch (error) {
    console.error("Error loading shared sub-header:", error);
  }
}

// Initialize sub-header functionality after it loads
function initializeSubHeaderAfterLoad() {
  try {
    // Add any sub-header specific functionality here
    if (typeof initializeSubHeaderNav === "function") {
      initializeSubHeaderNav();
    }
  } catch (error) {
    console.error("Error initializing sub-header:", error);
  }
}

// Load sub-header when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadSharedSubHeader();
});

// Re-export for compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadSharedSubHeader,
    initializeSubHeaderAfterLoad,
  };
}

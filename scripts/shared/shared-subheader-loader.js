// Shared Subheader Loader
async function loadSharedSubheader() {
  try {
    const response = await fetch('components/shared-subheader.html');
    const subheaderHTML = await response.text();
    
    // Find the placeholder element for the subheader
    const placeholder = document.getElementById('shared-subheader-placeholder');
    if (placeholder) {
      // Replace placeholder with actual subheader content
      placeholder.innerHTML = subheaderHTML;
      
      // Reinitialize sub-header navigation after content is loaded
      initializeSubHeaderAfterLoad();
    } else {
      // Fallback: Insert after main header if placeholder not found
      const headerElement = document.querySelector('.qili-header, .checkout-header');
      if (headerElement) {
        headerElement.insertAdjacentHTML('afterend', subheaderHTML);
        
        // Reinitialize sub-header navigation after content is loaded
        initializeSubHeaderAfterLoad();
      }
    }
  } catch (error) {
    console.error('Error loading shared subheader:', error);
  }
}

// Global navigation handler functions for the shared subheader
window.handleNavigationClick = function(hash) {  // Check if we're on the index page
  if (UrlUtils.isIndexPage()) {
    // We're on index page - update hash and let existing navigation handle it
    if (hash) {
      window.location.hash = hash;
    } else {
      // For "Browse All Books", load all books with pagination
      if (window.loadAllBooks && typeof window.loadAllBooks === 'function') {
        window.loadAllBooks();
      }
    }  } else {
    // We're on a different page - navigate to index with hash
    UrlUtils.navigateToIndex(hash || '');
  }
};

window.handleCategoryClick = function(categoryName) {
  // Hide the dropdown menu for all inkjet printer subcategories
  const inkjetCategories = [

  ];
  
  if (inkjetCategories.includes(categoryName) && window.subHeaderNav && window.subHeaderNav.hideAllSubmenus) {
    window.subHeaderNav.hideAllSubmenus();
  }

  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadSpecificCategory && typeof window.loadSpecificCategory === 'function') {
    // We're on index page - use existing function
    
    // Map category names to their correct hash values for consistency
    let hashValue = '';
    // Default hash conversion for all categories
    const categorySlug = categoryName.toLowerCase().replace(/&/g, '').replace(/'/g, '').replace(/\//g, '-').replace(/\s+/g, '-');
    hashValue = '#' + categorySlug;
    
    // First update the hash to ensure correct browser history
    if (history.pushState) {
      history.pushState(null, null, hashValue);
    } else {
      window.location.hash = hashValue;
    }
      // Then load the category content
    // For all categories, use the generic loader
    window.loadSpecificCategory(categoryName);
  } else {
    // We're on a different page - navigate to index and handle the category loading
    // Default hash conversion for all categories
    const categorySlug = categoryName.toLowerCase().replace(/&/g, '').replace(/'/g, '').replace(/\//g, '-').replace(/\s+/g, '-');
    const hashValue = '#' + categorySlug;
    
    // Navigate to index page with the appropriate hash
    UrlUtils.navigateToIndex(hashValue);
  }
};

// New handler for Economic Version Printers grid view
window.handleEconomicVersionClick = function() {
  // Hide the dropdown menu
  if (window.subHeaderNav && window.subHeaderNav.hideAllSubmenus) {
    window.subHeaderNav.hideAllSubmenus();
  }
  
  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadSpecificCategory && typeof window.loadSpecificCategory === 'function') {
    // We're on index page - use generic category loader
    window.loadSpecificCategory('Books');
    window.location.hash = 'books';
  } else {
    // We're on a different page - navigate to index with hash
    UrlUtils.navigateToIndex('#books');
  }
};

// Helper function to fix Print Spare Parts submenu items click behavior
function fixPrintSparePartsSubmenuItems() {
  // We specifically want to ensure these Print Spare Parts submenu items work on first click
  setTimeout(() => {
    // Find and fix the print spare parts submenu items
    const printSparePartsItems = document.querySelectorAll('.sub-header-submenu-item');
    
    printSparePartsItems.forEach(item => {
      const itemText = item.textContent.trim();
      
      // Target Print Spare Parts submenu items
      if (itemText.includes('Printer Parts') || itemText.includes('Printer Spare Parts')) {
        // Define the mapping for print spare parts categories
        let categoryName = "";
        let hashValue = "";
        
        if (itemText === 'Epson Printer Parts') {
          categoryName = 'Epson Printer Spare Parts';
          hashValue = 'epson-printer-spare-parts';
        } else if (itemText === 'Roland Printer Parts') {
          categoryName = 'Roland Printer Spare Parts';
          hashValue = 'roland-printer-spare-parts';
        } else if (itemText === 'Canon Printer Parts') {
          categoryName = 'Canon Printer Spare Parts';
          hashValue = 'canon-printer-spare-parts';
        } else if (itemText === 'Ricoh Printer Parts') {
          categoryName = 'Ricoh Printer Spare Parts';
          hashValue = 'ricoh-printer-spare-parts';
        } else if (itemText === 'HP Printer Parts') {
          categoryName = 'HP Printer Spare Parts';
          hashValue = 'hp-printer-spare-parts';
        } else if (itemText === 'Brother Printer Parts') {
          categoryName = 'Brother Printer Spare Parts';
          hashValue = 'brother-printer-spare-parts';
        } else if (itemText === 'Mutoh Printer Parts') {
          categoryName = 'Mutoh Printer Spare Parts';
          hashValue = 'mutoh-printer-spare-parts';
        } else if (itemText === 'Mimaki Printer Parts') {
          categoryName = 'Mimaki Printer Spare Parts';
          hashValue = 'mimaki-printer-spare-parts';
        } else if (itemText === 'Flora Printer Parts') {
          categoryName = 'Flora Printer Spare Parts';
          hashValue = 'flora-printer-spare-parts';
        } else if (itemText === 'Galaxy Printer Parts') {
          categoryName = 'Galaxy Printer Spare Parts';
          hashValue = 'galaxy-printer-spare-parts';        } else if (itemText === 'Infiniti/Challenger Parts') {
          categoryName = 'Infiniti / Challenger Printer Spare Parts';
          hashValue = 'infiniti-challenger-printer-spare-parts';
        } else if (itemText === 'Wit-color Printer Parts') {
          categoryName = 'Wit-color Printer Spare Parts';
          hashValue = 'wit-color-printer-spare-parts';
        } else if (itemText === 'Gongzheng Printer Parts') {
          categoryName = 'Gongzheng Printer Spare Parts';
          hashValue = 'gongzheng-printer-spare-parts';
        } else if (itemText === 'Human Printer Parts') {
          categoryName = 'Human Printer Spare Parts';
          hashValue = 'human-printer-spare-parts';
        } else if (itemText === 'Teflon Printer Parts') {
          categoryName = 'Teflon Printer Spare Parts';
          hashValue = 'teflon-printer-spare-parts';
        } else if (itemText === 'Wiper Printer Parts') {
          categoryName = 'Wiper Printer Spare Parts';
          hashValue = 'wiper-printer-spare-parts';
        } else if (itemText === 'Xaar Printer Parts') {
          categoryName = 'Xaar Printer Spare Parts';
          hashValue = 'xaar-printer-spare-parts';
        } else if (itemText === 'Toshiba Printer Parts') {
          categoryName = 'Toshiba Printer Spare Parts';
          hashValue = 'toshiba-printer-spare-parts';
        }
        
        // Only continue if we found a match
        if (categoryName && hashValue) {
          // Clone and replace the element to override any existing click handlers
          const newItem = item.cloneNode(true);
          item.parentNode.replaceChild(newItem, item);
          
          // Add a direct click event handler that will work on any page
          newItem.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Hide any active submenus
            document.querySelectorAll('.sub-header-submenu.active').forEach(submenu => {
              submenu.classList.remove('active');
            });
            
            // Check if we're on the index page or another page
            if (UrlUtils.isIndexPage() && window.loadSpecificCategory) {
              // We're on the index page - update hash and load content directly
              if (history.pushState) {
                history.pushState(null, null, `#${hashValue}`);
              } else {
                window.location.hash = `#${hashValue}`;
              }
              
              // Then load the category content
              window.loadSpecificCategory(categoryName);
            } else {
              // We're on a different page (like detail.html) - navigate to index page with hash
              UrlUtils.navigateToIndex(`#${hashValue}`);
            }
          });
        }
      }
    });
  }, 300); // Small delay to ensure shared subheader is fully loaded
}

window.handlePrintheadClick = function(brand) {
  // Hide any active submenus first
  document.querySelectorAll('.sub-header-submenu.active').forEach(submenu => {
    submenu.classList.remove('active');
  });
  
  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadPrintheadProducts && typeof window.loadPrintheadProducts === 'function') {
    // We're on index page - use existing function
    window.loadPrintheadProducts(brand);
    window.location.hash = 'printheads-' + brand;  } else {
    // We're on a different page - navigate to index with printhead hash
    UrlUtils.navigateToIndex('#printheads-' + brand);
  }
};

// Helper function to handle upgrading kit clicks from subheader
window.handleUpgradingKitClick = function(kitType) {
  // Hide any active submenus first
  document.querySelectorAll('.sub-header-submenu.active').forEach(submenu => {
    submenu.classList.remove('active');
  });
  
  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadUpgradingKitProducts && typeof window.loadUpgradingKitProducts === 'function') {
    // We're on the index page - load products directly
    window.loadUpgradingKitProducts(kitType);
    
    // Map kit types to hash values
    let hashValue = `upgrading-kit-${kitType}`;
    if (kitType === 'roll_to_roll_style') {
      hashValue = 'upgrading-kit-roll-to-roll';
    } else if (kitType === 'uv_flatbed') {
      hashValue = 'upgrading-kit-uv-flatbed';
    } else if (kitType === 'without_cable_work') {
      hashValue = 'upgrading-kit-without-cable';
    }
    
    // Update URL hash for proper navigation
    window.location.hash = hashValue;
  } else {
    // We're on a different page (like detail.html) - navigate to index page with hash
    let hashValue = `#upgrading-kit-${kitType}`;
    if (kitType === 'roll_to_roll_style') {
      hashValue = '#upgrading-kit-roll-to-roll';
    } else if (kitType === 'uv_flatbed') {
      hashValue = '#upgrading-kit-uv-flatbed';
    } else if (kitType === 'without_cable_work') {
      hashValue = '#upgrading-kit-without-cable';
    }
    UrlUtils.navigateToIndex(hashValue);
  }
};

// Helper function to handle material clicks from subheader
window.handleMaterialClick = function(materialCategory) {
  // Hide any active submenus first
  document.querySelectorAll('.sub-header-submenu.active').forEach(submenu => {
    submenu.classList.remove('active');
  });
  
  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadMaterialProducts && typeof window.loadMaterialProducts === 'function') {
    // We're on the index page - load products directly
    window.loadMaterialProducts(materialCategory);
    
    // Update URL hash for proper navigation
    window.location.hash = `material-${materialCategory}`;
  } else {
    // We're on a different page (like detail.html) - navigate to index page with hash
    UrlUtils.navigateToIndex(`#material-${materialCategory}`);
  }
};

// Helper function to handle LED & LCD clicks from subheader
window.handleLedLcdClick = function(ledLcdCategory) {
  // Hide any active submenus first
  document.querySelectorAll('.sub-header-submenu.active').forEach(submenu => {
    submenu.classList.remove('active');
  });
  
  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadLedLcdProducts && typeof window.loadLedLcdProducts === 'function') {
    // We're on the index page - load products directly
    window.loadLedLcdProducts(ledLcdCategory);
    
    // Update URL hash for proper navigation
    window.location.hash = `led-lcd-${ledLcdCategory}`;
  } else {
    // We're on a different page (like detail.html) - navigate to index page with hash
    UrlUtils.navigateToIndex(`#led-lcd-${ledLcdCategory}`);
  }
};

// Helper function to handle Channel Letter clicks from subheader
window.handleChannelLetterClick = function(channelLetterCategory) {
  // Hide any active submenus first
  document.querySelectorAll('.sub-header-submenu.active').forEach(submenu => {
    submenu.classList.remove('active');
  });
  
  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadChannelLetterProducts && typeof window.loadChannelLetterProducts === 'function') {
    // We're on the index page - load products directly
    window.loadChannelLetterProducts(channelLetterCategory);
    
    // Update URL hash for proper navigation
    window.location.hash = `channel-letter-${channelLetterCategory}`;
  } else {
    // We're on a different page (like detail.html) - navigate to index page with hash
    UrlUtils.navigateToIndex(`#channel-letter-${channelLetterCategory}`);
  }
};

// Helper function to handle Other clicks from subheader
window.handleOtherClick = function(otherCategory) {
  // Hide any active submenus first
  document.querySelectorAll('.sub-header-submenu.active').forEach(submenu => {
    submenu.classList.remove('active');
  });
  
  // Check if we're on the index page
  if (UrlUtils.isIndexPage() && window.loadOtherProducts && typeof window.loadOtherProducts === 'function') {
    // We're on the index page - load products directly
    window.loadOtherProducts(otherCategory);
    
    // Update URL hash for proper navigation
    window.location.hash = `other-${otherCategory}`;
  } else {
    // We're on a different page (like detail.html) - navigate to index page with hash
    UrlUtils.navigateToIndex(`#other-${otherCategory}`);
  }
};

// Function to initialize sub-header navigation after shared content is loaded
function initializeSubHeaderAfterLoad() {
  // Wait a bit to ensure DOM is fully updated
  setTimeout(() => {
    // Create a new instance of SubHeaderNavigation if the class exists
    if (typeof SubHeaderNavigation !== 'undefined') {
      window.subHeaderNav = new SubHeaderNavigation();
      
      // Fix for Print Spare Parts submenu items clicking issue
      fixPrintSparePartsSubmenuItems();
      
      // Handle URL hash navigation on initial page load if there's a hash
      let hash = window.location.hash.substring(1);
      
      // Check if the hash contains parameters to prevent scrolling
      const shouldSkipScroll = window.location.search.includes('noscroll=true') || 
                              hash.includes('noscroll=true');
      
      // Clean up the hash by removing any parameters
      if (hash.includes('?')) {
        hash = hash.split('?')[0];
      }
      
      if (hash && window.subHeaderNav.handleHashNavigation) {
        // If we should skip scrolling, temporarily disable the scroll function
        if (shouldSkipScroll && window.scrollToProducts) {
          const originalScrollToProducts = window.scrollToProducts;
          window.scrollToProducts = function() { /* do nothing */ };
          
          // Process the hash navigation
          window.subHeaderNav.handleHashNavigation(hash);
          
          // Restore the original function after a delay
          setTimeout(() => {
            window.scrollToProducts = originalScrollToProducts;
          }, 1000);
        } else {
          // Normal hash navigation
          window.subHeaderNav.handleHashNavigation(hash);
        }
      }
    }
  }, 50); // Small delay to ensure DOM is updated
}

// Load the subheader when the DOM is ready
document.addEventListener('DOMContentLoaded', loadSharedSubheader);

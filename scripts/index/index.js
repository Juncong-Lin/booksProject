import {cart, addToCart} from '../../data/cart.js'; 
import {products} from '../../data/products.js';
import {booksProducts} from '../../data/books.js';
import { formatCurrency, formatPriceRange } from '../shared/money.js';

// Helper function to encode image URLs properly
function encodeImagePath(imagePath) {
  return imagePath.split('/').map(part => 
    part.includes('(') || part.includes(')') || part.includes('#') ? encodeURIComponent(part) : part
  ).join('/');
}

// Unified product rendering function with optional type parameter
function renderProducts(productList, type = 'regular') {
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
        ${type === 'book' && product.star !== undefined ? `
        <div class="product-rating">
          <img class="product-rating-stars" src="images/ratings/rating-${product.star * 10}.png" alt="${product.star} stars">
          <div class="product-rating-count">${Math.floor(Math.random() * 500) + 50}</div>
        </div>` : ''}
        <div class="product-price">
          ${(() => {
            if (type === 'regular' && product.getPrice) {
              return product.getPrice();
            } else if (product.lower_price !== undefined || product.higher_price !== undefined) {
              return formatPriceRange(product.lower_price, product.higher_price);
            } else if (product.price) {
              return 'USD:' + formatCurrency(product.price);
            } else {
              return 'USD: #NA';
            }
          })()}</div>
        <div class="product-quantity-section">
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
              <option value="10">10</option>
            </select>
          </div>
          <div class="added-message">Added</div>
        </div>
        <div class="product-spacer"></div>
        <button class="add-to-cart-button button-primary js-add-to-cart" data-product-id="${product.id}">
          Add to Cart
        </button>
      </div>`;
  });
  return productsHTML;
}

// Function to load all regular products (default view)
window.loadAllProducts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  // Highlight selected menu item
  highlightSelectedMenuItem('all');
  
  // Clear products grid for homepage
  const productsGrid = document.querySelector('.js-prodcts-grid');
  productsGrid.innerHTML = '';
  productsGrid.classList.remove('showing-coming-soon');
  
  // Remove page header for clean homepage
  const pageHeader = document.querySelector('.page-header');
  if (pageHeader) {
    pageHeader.remove();
  }
  
  // Remove breadcrumb for clean homepage
  const breadcrumbElement = document.querySelector('.breadcrumb-nav');
  if (breadcrumbElement) {
    breadcrumbElement.remove();
  }
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
      <p>Loading products...</p>
    </div>
  `;
  productsGrid.classList.remove('showing-coming-soon');
}

// Function to show coming soon message
function showComingSoonMessage() {
  const productsGrid = document.querySelector('.js-prodcts-grid');
  productsGrid.innerHTML = `
    <div class="coming-soon">
      <h2>Loading Products...</h2>
      <p>Please wait while we load the products for you.</p>
    </div>
  `;
  productsGrid.classList.add('showing-coming-soon');
}

// Function to scroll to products section
function scrollToProducts() {
  // Get the main container to scroll to
  const mainElement = document.querySelector('.main');
  
  if (mainElement) {
    // Scroll to the main section with a slight offset to show the header
    window.scrollTo({
      top: mainElement.offsetTop - 120, // Reduce the scroll distance with an offset
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
    headerElement.textContent = `${title} (Total: ${productCount})`;
  } else {
    headerElement.textContent = title;
  }
}

// Function to update breadcrumb navigation
function updateBreadcrumb(brand) {
  let breadcrumbElement = document.querySelector('.breadcrumb-nav');
  if (!breadcrumbElement) {
    // Create breadcrumb if it doesn't exist
    breadcrumbElement = document.createElement('div');
    breadcrumbElement.className = 'breadcrumb-nav';
    
    const mainElement = document.querySelector('.main');
    mainElement.insertBefore(breadcrumbElement, mainElement.firstChild);
  }
  
  // Check if we're on the detail page
  const isDetailPage = window.location.pathname.includes('detail.html');
    if (brand && brand !== 'all') {
    // Special case for 'printHeads' which is the main category
    if (brand === 'printHeads') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Print Heads</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Print Heads</span>
        `;
      }
    } else if (brand === 'inkjetPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Inkjet Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Inkjet Printers</span>
        `;
      }
    } else if (brand === 'printSpareParts') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Print Spare Parts</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Print Spare Parts</span>
        `;
      }
    } else if (brand === 'economicVersionPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Eco-Solvent Inkjet Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Eco-Solvent Inkjet Printers</span>
        `;
      }
    } else if (brand === 'xp600-printers' || brand === 'xp600Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjetprinters-ecosolvent" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With XP600 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Eco-Solvent Inkjet Printers')" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With XP600 Printhead</span>
        `;
      }
    } else if (brand === 'i1600-printers' || brand === 'i1600Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjetprinters-ecosolvent" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I1600 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Eco-Solvent Inkjet Printers')" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I1600 Printhead</span>
        `;
      }
    } else if (brand === 'i3200-printers' || brand === 'i3200Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjetprinters-ecosolvent" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I3200 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Eco-Solvent Inkjet Printers')" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I3200 Printhead</span>
        `;
      }
    } else if (brand === 'directToFabricFilm') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Direct to Fabric & Film</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Direct to Fabric & Film</span>
        `;
      }
    } else if (brand === 'dtfPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadDirectToFabricFilmPrinters()" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">DTF Printer</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadDirectToFabricFilmPrinters()" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">DTF Printer</span>
        `;
      }
    } else if (brand === 'uvDtfPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadDirectToFabricFilmPrinters()" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">UV DTF Printer</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadDirectToFabricFilmPrinters()" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">UV DTF Printer</span>
        `;
      }
    } else if (brand === 'solventPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Solvent Inkjet Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Solvent Inkjet Printers</span>
        `;
      }
    } else if (brand === 'solventKM512iPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllSolventPrinters && window.loadAllSolventPrinters()" class="breadcrumb-link">Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM512i Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllSolventPrinters && window.loadAllSolventPrinters()" class="breadcrumb-link">Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM512i Printhead</span>
        `;
      }
    } else if (brand === 'solventKM1024iPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllSolventPrinters && window.loadAllSolventPrinters()" class="breadcrumb-link">Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllSolventPrinters && window.loadAllSolventPrinters()" class="breadcrumb-link">Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      }
    } else if (brand === 'sublimationPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Sublimation Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Sublimation Printers</span>
        `;
      }
    } else if (brand === 'sublimationXP600Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#sublimation-printers" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With XP600 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Sublimation Printers')" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With XP600 Printhead</span>
        `;
      }
    } else if (brand === 'sublimationI1600Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#sublimation-printers" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I1600 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Sublimation Printers')" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I1600 Printhead</span>
        `;
      }
    } else if (brand === 'sublimationI3200Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#sublimation-printers" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I3200 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadSpecificCategory && window.loadSpecificCategory('Sublimation Printers')" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I3200 Printhead</span>
        `;
      }
    } else if (brand === 'epsonPrinterSpareParts') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#print-spare-parts" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Epson Printer Spare Parts</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllPrintSpareParts()" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Epson Printer Spare Parts</span>        `;
      }    } else if (brand === 'rolandPrinterSpareParts') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#print-spare-parts" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Roland Printer Spare Parts</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllPrintSpareParts()" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Roland Printer Spare Parts</span>
        `;
      }    } else if (brand === 'canonPrinterSpareParts') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#print-spare-parts" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Canon Printer Spare Parts</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllPrintSpareParts()" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Canon Printer Spare Parts</span>
        `;
      }    } else if (brand === 'ricohPrinterSpareParts') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#print-spare-parts" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Ricoh Printer Spare Parts</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllPrintSpareParts()" class="breadcrumb-link">Print Spare Parts</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Ricoh Printer Spare Parts</span>
        `;
      }
    } else if (brand === 'upgradingKit') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Upgrading Kit</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Upgrading Kit</span>
        `;
      }
    } else if (brand === 'hoson' || brand === 'mimaki' || brand === 'mutoh' || brand === 'roll_to_roll_style' || brand === 'uv_flatbed' || brand === 'without_cable_work') {
      // These are upgrading kit brands
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#upgrading-kit" class="breadcrumb-link">Upgrading Kit</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" class="breadcrumb-link" onclick="loadUpgradingKitProducts('${brand}')">${brand.charAt(0).toUpperCase() + brand.slice(1).replace(/_/g, ' ')} Products</a>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllUpgradingKitProducts()" class="breadcrumb-link">Upgrading Kit</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${brand.charAt(0).toUpperCase() + brand.slice(1).replace(/_/g, ' ')} Products</span>        `;
      }
    } else if (brand === 'material') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Material</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Material</span>
        `;
      }
    } else if (brand.startsWith('material-')) {
      // These are material categories like material-adhevie, material-flex, etc.
      const materialCategory = brand.substring(9); // Remove 'material-' prefix
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#material" class="breadcrumb-link">Material</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" class="breadcrumb-link" onclick="loadMaterialProducts('${materialCategory}')">${materialCategory.charAt(0).toUpperCase() + materialCategory.slice(1)} Materials</a>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllMaterialProducts()" class="breadcrumb-link">Material</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${materialCategory.charAt(0).toUpperCase() + materialCategory.slice(1)} Materials</span>        `;
      }
    } else if (brand.startsWith('led-lcd-')) {
      // These are LED & LCD categories like led-lcd-display, led-lcd-outdoor, etc.
      const ledLcdCategory = brand.substring(8); // Remove 'led-lcd-' prefix
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#led-lcd" class="breadcrumb-link">LED & LCD</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" class="breadcrumb-link" onclick="loadLedLcdProducts('${ledLcdCategory}')">${ledLcdCategory.charAt(0).toUpperCase() + ledLcdCategory.slice(1)} LED & LCD</a>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllLedLcdProducts()" class="breadcrumb-link">LED & LCD</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${ledLcdCategory.charAt(0).toUpperCase() + ledLcdCategory.slice(1)} LED & LCD</span>        `;
      }
    } else if (brand.startsWith('channel-letter-')) {
      // These are Channel Letter categories like channel-letter-aluminum, channel-letter-automatic, etc.
      const channelLetterCategory = brand.substring(15); // Remove 'channel-letter-' prefix
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#channel-letter" class="breadcrumb-link">Channel Letter</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${channelLetterCategory.charAt(0).toUpperCase() + channelLetterCategory.slice(1)} Channel Letter</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" class="breadcrumb-link" onclick="loadChannelLetterProducts('${channelLetterCategory}')">${channelLetterCategory.charAt(0).toUpperCase() + channelLetterCategory.slice(1)} Channel Letter</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllChannelLetterProducts()" class="breadcrumb-link">Channel Letter</a>        `;
      }
    } else if (brand.startsWith('other-')) {
      // These are Other categories like other-spectrophotometer, etc.
      const otherCategory = brand.substring(6); // Remove 'other-' prefix
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#other" class="breadcrumb-link">Other</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${otherCategory.charAt(0).toUpperCase() + otherCategory.slice(1)} Other Products</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" class="breadcrumb-link" onclick="loadOtherProducts('${otherCategory}')">${otherCategory.charAt(0).toUpperCase() + otherCategory.slice(1)} Other Products</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllOtherProducts()" class="breadcrumb-link">Other</a>
        `;
      }
    } else if (brand === 'other') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Other</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Other</span>
        `;
      }
    } else if (brand === 'channel-letter') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Channel Letter</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Channel Letter</span>
        `;
      }
    } else if (brand === 'uvInkjetPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">UV Inkjet Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">UV Inkjet Printers</span>
        `;
      }
    } else if (brand === 'uvRicohGen6Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-inkjet-printers" class="breadcrumb-link">UV Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen6 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvInkjetPrinters && window.loadAllUvInkjetPrinters()" class="breadcrumb-link">UV Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen6 Printhead</span>
        `;
      }
    } else if (brand === 'uvInkjetKonica1024iPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-inkjet-printers" class="breadcrumb-link">UV Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvInkjetPrinters && window.loadAllUvInkjetPrinters()" class="breadcrumb-link">UV Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      }
    } else if (brand === 'uvFlatbedRicohGen6Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen6 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvFlatbedPrinters && window.loadAllUvFlatbedPrinters()" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen6 Printhead</span>
        `;
      }
    } else if (brand === 'uvFlatbedRicohGen5Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen5 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvFlatbedPrinters && window.loadAllUvFlatbedPrinters()" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen5 Printhead</span>
        `;
      }
    } else if (brand === 'uvFlatbedI3200Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I3200 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvFlatbedPrinters && window.loadAllUvFlatbedPrinters()" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With I3200 Printhead</span>
        `;
      }
    } else if (brand === 'uvFlatbedXP600Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With XP600 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvFlatbedPrinters && window.loadAllUvFlatbedPrinters()" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With XP600 Printhead</span>
        `;
      }
    } else if (brand === 'uvKonica1024iPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvFlatbedPrinters && window.loadAllUvFlatbedPrinters()" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      }
    } else if (brand === 'uvFlatbedPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">UV Flatbed Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">UV Flatbed Printers</span>
        `;
      }
    } else if (brand === 'uvHybridKonica1024iPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-hybrid-inkjet-printers" class="breadcrumb-link">Hybrid UV Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvHybridPrinters && window.loadAllUvHybridPrinters()" class="breadcrumb-link">Hybrid UV Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Konica KM1024i Printhead</span>
        `;
      }
    } else if (brand === 'uvHybridRicohGen6Printers') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-hybrid-inkjet-printers" class="breadcrumb-link">Hybrid UV Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen6 Printhead</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllUvHybridPrinters && window.loadAllUvHybridPrinters()" class="breadcrumb-link">Hybrid UV Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">With Ricoh Gen6 Printhead</span>
        `;
      }
    } else if (brand === 'uvHybridPrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Hybrid UV Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Hybrid UV Printers</span>
        `;
      }
    } else if (brand === 'doubleSidePrinters') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Double Side Printers</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Double Side Printers</span>
        `;
      }
    } else if (brand === 'doubleSideDirectPrinting') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#double-side-printers" class="breadcrumb-link">Double Side Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Direct Printing</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadInkjetPrinters()" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="window.loadAllDoubleSidePrinters && window.loadAllDoubleSidePrinters()" class="breadcrumb-link">Double Side Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">Direct Printing</span>
        `;
      }
    } else if (brand === 'led-lcd') {
      if (isDetailPage) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">LED & LCD</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">LED & LCD</span>
        `;
      }
    } else {
      if (isDetailPage) {
        // On detail page, make brand level clickable to go back to brand listings
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#printheads" class="breadcrumb-link">Print Heads</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" class="breadcrumb-link" onclick="loadPrintheadProducts('${brand}')">${brand.charAt(0).toUpperCase() + brand.slice(1)} Printheads</a>
        `;
      } else {
        // On index page, brand level is current/non-clickable
        breadcrumbElement.innerHTML = `
          <a href="javascript:void(0)" onclick="loadAllProducts()" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="javascript:void(0)" onclick="loadAllPrintheadProducts()" class="breadcrumb-link">Print Heads</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${brand.charAt(0).toUpperCase() + brand.slice(1)} Printheads</span>
        `;
      }
    }  } else {
    // For homepage (all products), remove breadcrumb completely for clean look
    if (breadcrumbElement) {
      breadcrumbElement.remove();
    }
  }
}

// Function to attach add to cart event listeners
function attachAddToCartListeners() {
  document.querySelectorAll('.js-add-to-cart')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const productId = button.dataset.productId;
        
        // Get the quantity from the dropdown
        const productContainer = button.closest('.product-container');
        const quantitySelect = productContainer.querySelector('select');
        const quantity = Number(quantitySelect.value);

        // Call addToCart with the selected quantity
        addToCart(productId, quantity);
        updateCartQuantity();

        // Show the 'Added' message
        const addedMessage = productContainer.querySelector('.added-message');
        if (addedMessage) {
          addedMessage.style.display = 'block';
          setTimeout(() => {
            addedMessage.style.display = 'none';
          }, 2000);
        }
      });
    });
}

// Load default products on page load
document.addEventListener('DOMContentLoaded', () => {
  // Only run on the main index page, not on checkout or other pages
  const isIndexPage = document.querySelector('.products-grid') || document.querySelector('#products-grid');
    if (isIndexPage) {
    // Initialize cart quantity display on page load immediately
    updateCartQuantity();
      // Small delay to ensure sub-header navigation is initialized
    setTimeout(() => {
      // Check for search parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const isSearchRequest = urlParams.has('search');
      
      // If this is a search request, don't load default products - let search system handle it
      if (isSearchRequest) {
        return;
      }
      
      // Check if there's a hash in the URL that should load specific content
      const hash = window.location.hash.substring(1);    
      if (hash) {
        // If there's a hash, let the sub-header navigation handle it instead of loading all products
        // Check if sub-header navigation is available and can handle the hash
        if (window.subHeaderNav && window.subHeaderNav.handleHashNavigation) {
          // Sub-header nav will handle the hash, don't load all products
          return;
        } else {
          // Fallback: wait a bit more for sub-header to initialize
          setTimeout(() => {
            if (window.subHeaderNav && window.subHeaderNav.handleHashNavigation) {
              return;
            } else {
              // If still no sub-header nav, try to handle hash ourselves or load all products
              handleHashFallback(hash);
            }
          }, 200);
          return;
        }
      } else {
        // Only load all products if there's no hash and no search request
        loadAllProducts();
      }
    }, 100);
  }
});

// Fallback function to handle hash navigation when sub-header nav is not available
function handleHashFallback(hash) {
  // For a books website, most hashes should be handled by loadSpecificCategory
  if (window.loadSpecificCategory) {
    // Check if hash is being updated by category loading to prevent conflicts
    if (window.updatingHashFromCategory) {
      return;
    }
    
    // Try to handle category hashes - mostly book categories
    const categoryMap = {
      'fiction': 'Fiction',
      'nonfiction': 'Nonfiction', 
      'non-fiction': 'Nonfiction',
      'childrens': 'Childrens',
      'children': 'Childrens',
      'young-adult': 'Young Adult',
      'romance': 'Romance',
      'mystery': 'Mystery',
      'science-fiction': 'Science Fiction',
      'fantasy': 'Fantasy',
      'biography': 'Biography',
      'history': 'History',
      'science': 'Science',
      'self-help': 'Self Help',
      'business': 'Business'
    };
    
    if (categoryMap[hash]) {
      window.loadSpecificCategory(categoryMap[hash]);
    } else {
      loadAllProducts();
    }
  } else {
    loadAllProducts();
  }
}

function updateCartQuantity() {
  // Temporarily disabled since cart is hidden from header
  // Original cart quantity functionality is preserved for future reuse
  /*
  let cartQuantity = 0;
  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity;
  });
  
  const cartQuantityElement = document.querySelector('.js-cart-quantity');
  if (cartQuantityElement) {
    cartQuantityElement.innerHTML = cartQuantity;
  }
  */
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
  
  // Fallback to regular products if books not found (for backward compatibility)
  return products.find(p => p.id === productId);
};

// Function to highlight selected menu item
function highlightSelectedMenuItem(brand) {
  // Remove the 'selected-brand' class from all submenu items
  document.querySelectorAll('.department-link.selected-brand').forEach(link => {
    link.classList.remove('selected-brand');
  });

  // Add the 'selected-brand' class to the currently selected submenu item
  if (brand && brand !== 'all') {
    // For books website, we don't have brand-specific loading functions anymore
    // This is kept for compatibility but may not be actively used
  } else {
    // Highlight "All Products" if showing all products
    const allProductsLink = document.querySelector(`[onclick="loadAllProducts()"]`);
    if (allProductsLink) {
      allProductsLink.classList.add('selected-brand');
    }
  }
}

// Add click handler for menu items
document.addEventListener('DOMContentLoaded', () => {
  // Add click listener to "All Products" link
  const allProductsLink = document.querySelector('[onclick="loadAllProducts()"]');
  if (allProductsLink) {
    allProductsLink.addEventListener('click', function() {
      // No direct style changes here! Only rely on .selected-brand class
    });
  }
});

// --- Highlight sub-header link when sidebar is clicked (handles nested/child links) ---
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.department-link').forEach(link => {
    link.addEventListener('click', function(e) {
      // Find the main sidebar category for this link
      let sidebarCategory = link.textContent.trim();
      // If this is a child link, try to get the parent expandable's text
      const expandableParent = link.closest('.department-group, .department-subgroup');
      let mainCategory = sidebarCategory;
      if (expandableParent) {
        const parentExpandable = expandableParent.querySelector('.expandable');
        if (parentExpandable && parentExpandable !== link) {
          mainCategory = parentExpandable.textContent.trim();
        }
      }
      // Map sidebar category names to sub-header link names if needed
      const categoryMap = {
        'See All Departments': 'See All Departments',
        'Inkjet Printers': 'Inkjet Printers',
        'Print Heads': 'Print Heads',
        'Print Spare Parts': 'Print Spare Parts',
        'Upgrading Kit': 'Upgrading Kit',
        'Material': 'Material',
        'LED & LCD': 'LED & LCD',
        'Laser': 'Laser',
        'Cutting': 'Cutting',
        'Channel Letter': 'Channel Letter',
        'CNC': 'CNC',
        'Dispalys': 'Displays',
        'Other': 'Other'
      };
      // Use mainCategory if it matches a sub-header, else fallback to sidebarCategory
      const matchCategory = categoryMap[mainCategory] || categoryMap[sidebarCategory];
      document.querySelectorAll('.sub-header-link').forEach(subLink => {
        subLink.classList.remove('active');
        if (matchCategory && subLink.textContent.trim() === matchCategory) {
          subLink.classList.add('active');
        }
      });
    });
  });
});

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
  const categorySlug = categoryName.toLowerCase().replace(/&/g, '').replace(/'/g, '').replace(/\s+/g, '-');

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
    // Check if this is a book category - if so, delegate to books-loader.js
    const bookCategories = [
      'Classics', 'Contemporary', 'Crime', 'Erotica', 'Fantasy', 'Historical Fiction', 
      'Horror', 'Mystery', 'Novels', 'Paranormal', 'Romance', 'Science Fiction', 
      'Short Stories', 'Suspense', 'Thriller', 'Womens Fiction', 'Women\'s Fiction',
      'Fiction', 'Nonfiction', 'Non-Fiction', 'Childrens', 'Children\'s', 'Young Adult', 
      'New Adult', 'Academic', 'Art', 'Sequential Art', 'Music', 'Cultural', 'Health', 
      'Self Help', 'Psychology', 'Parenting', 'Religion', 'Christian', 'Christian Fiction', 
      'Spirituality', 'Philosophy', 'Business', 'Politics', 'Science', 'Biography', 
      'Autobiography', 'History', 'Historical', 'Poetry', 'Humor', 'Sports and Games', 
      'Food and Drink', 'Travel', 'Adult Fiction', 'Default', 'Children & Young Adult',
      'Academic & Educational', 'Arts & Culture', 'Health & Self-Help', 'Religion & Spirituality',
      'Business & Politics', 'Science & Technology', 'Biography & History', 'Poetry & Literature',
      'Specialty Genres'
    ];
    
    if (bookCategories.includes(categoryName)) {
      // This is a book category - let books-loader.js handle it
      console.log('Delegating book category to books-loader.js:', categoryName);
      return;
    }
    
    // Handle non-book categories below
    // For now, show "Category Not Found" for non-book categories
    // since this is primarily a book website
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = `
      <div class="coming-soon">
        <h2>Category Not Found</h2>
        <p>The category "${categoryName}" was not found. Please check the navigation menu.</p>
      </div>
    `;
    productsGrid.classList.add('showing-coming-soon');
  }, 200);
};

// Function to load Inkjet Printers
window.loadInkjetPrinters = function() {
  window.loadSpecificCategory('Inkjet Printers');
};

// Function to load Inkjet Printers
window.loadInkjetPrinters = function() {
  window.loadSpecificCategory('Inkjet Printers');
};

// Function to load Print Spare Parts  
window.loadPrintSpareParts = function() {
  window.loadSpecificCategory('Print Spare Parts');
};

// Function to load all print spare parts
window.loadAllPrintSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Print Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get all print spare parts
    let allPrintSpareParts = [];
    for (const category in printSparePartProducts) {
      allPrintSpareParts = allPrintSpareParts.concat(printSparePartProducts[category]);
    }
    
    const productsHTML = renderProducts(allPrintSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show print spare parts category
    updatePageHeader('Print Spare Parts', allPrintSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('printSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Epson Printer Spare Parts specifically
window.loadEpsonPrinterSpareParts = function() {
  // Hide the submenu after selection

  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Epson Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {    // Get Epson printer spare parts
    const epsonSpareParts = printSparePartProducts.epson || [];
    
    const productsHTML = renderProducts(epsonSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Epson printer spare parts category
    updatePageHeader('Epson Printer Spare Parts', epsonSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('epsonPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Roland Printer Spare Parts specifically
window.loadRolandPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Roland Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {    // Get Roland printer spare parts
    const rolandSpareParts = printSparePartProducts.roland || [];
    
    const productsHTML = renderProducts(rolandSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Roland printer spare parts category
    updatePageHeader('Roland Printer Spare Parts', rolandSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('rolandPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Canon Printer Spare Parts specifically
window.loadCanonPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Canon Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {    // Get Canon printer spare parts
    const canonSpareParts = printSparePartProducts.canon || [];
    
    const productsHTML = renderProducts(canonSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Canon printer spare parts category
    updatePageHeader('Canon Printer Spare Parts', canonSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('canonPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Ricoh Printer Spare Parts specifically
window.loadRicohPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Ricoh Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {    // Get Ricoh printer spare parts
    const ricohSpareParts = printSparePartProducts.ricoh || [];
    
    const productsHTML = renderProducts(ricohSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Ricoh printer spare parts category
    updatePageHeader('Ricoh Printer Spare Parts', ricohSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('ricohPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Infiniti/Challenger Printer Spare Parts specifically
window.loadInfinitiChallengerPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Infiniti / Challenger Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get Infiniti/Challenger printer spare parts
    const infinitiChallengerSpareParts = printSparePartProducts.infiniti_challenger || [];
    
    const productsHTML = renderProducts(infinitiChallengerSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Infiniti/Challenger printer spare parts category
    updatePageHeader('Infiniti / Challenger Printer Spare Parts', infinitiChallengerSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('infinitiChallengerPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Flora Printer Spare Parts specifically
window.loadFloraPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Flora Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get Flora printer spare parts
    const floraSpareParts = printSparePartProducts.flora || [];
    
    const productsHTML = renderProducts(floraSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Flora printer spare parts category
    updatePageHeader('Flora Printer Spare Parts', floraSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('floraPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Galaxy Printer Spare Parts specifically
window.loadGalaxyPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Galaxy Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition

  setTimeout(() => {
    // Get Galaxy printer spare parts
    const galaxySpareParts = printSparePartProducts.galaxy || [];
    
    const productsHTML = renderProducts(galaxySpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Galaxy printer spare parts category
    updatePageHeader('Galaxy Printer Spare Parts', galaxySpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('galaxyPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Mimaki Printer Spare Parts specifically
window.loadMimakiPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Mimaki Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get Mimaki printer spare parts
    const mimakiSpareParts = printSparePartProducts.mimaki || [];
    
    const productsHTML = renderProducts(mimakiSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();      // Update page title or add a header to show Mimaki printer spare parts category
    updatePageHeader('Mimaki Printer Spare Parts', mimakiSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('mimakiPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Mutoh Printer Spare Parts specifically
window.loadMutohPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Mutoh Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get Mutoh printer spare parts
    const mutohSpareParts = printSparePartProducts.mutoh || [];
    
    const productsHTML = renderProducts(mutohSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();
    
    // Update page title or add a header to show Mutoh printer spare parts category
    updatePageHeader('Mutoh Printer Spare Parts', mutohSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('mutohPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Wit-color Printer Spare Parts specifically
window.loadWitColorPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Wit-color Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get Wit-color printer spare parts
    const witcolorSpareParts = printSparePartProducts.witcolor || [];
    
    const productsHTML = renderProducts(witcolorSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();
    
    // Update page title or add a header to show Wit-color printer spare parts category
    updatePageHeader('Wit-color Printer Spare Parts', witcolorSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('witColorPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Gongzheng Printer Spare Parts specifically
window.loadGongzhengPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Gongzheng Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get Gongzheng printer spare parts
    const gongzhengSpareParts = printSparePartProducts.gongzheng || [];
    
    const productsHTML = renderProducts(gongzhengSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();
    
    // Update page title or add a header to show Gongzheng printer spare parts category
    updatePageHeader('Gongzheng Printer Spare Parts', gongzhengSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('gongzhengPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Function to load Human Printer Spare Parts specifically
window.loadHumanPrinterSpareParts = function() {
  // Hide the submenu after selection
  hideActiveSubmenus();
  
  
  // Highlight selected menu item in the navigation
  document.querySelectorAll('.sub-header-link').forEach(link => {
    link.classList.remove('active');
    if (link.textContent.trim() === 'Human Printer Spare Parts') {
      link.classList.add('active');
    }
  });
  
  // Add loading animation
  showLoadingState();
  
  // Small delay for smooth transition
  setTimeout(() => {
    // Get Human printer spare parts
    const humanSpareParts = printSparePartProducts.human || [];
    
    const productsHTML = renderProducts(humanSpareParts, 'printsparepart');
    const productsGrid = document.querySelector('.js-prodcts-grid');
    productsGrid.innerHTML = productsHTML;
    productsGrid.classList.remove('showing-coming-soon');
    
    // Re-attach event listeners for the new add to cart buttons
    attachAddToCartListeners();
    
    // Update page title or add a header to show Human printer spare parts category
    updatePageHeader('Human Printer Spare Parts', humanSpareParts.length);
    
    // Update breadcrumb navigation
    updateBreadcrumb('humanPrinterSpareParts');
    
    // Check if we need to skip scrolling
    const urlSearchParams = new URLSearchParams(window.location.search);
    const skipScroll = urlSearchParams.get('noscroll') === 'true';
    
    // Scroll to top of products only if not skipping
    if (!skipScroll) {
      scrollToProducts();
    }
  }, 200);
};

// Removed multiple printer spare parts functions - this is now a books website

// Removed Xaar and Toshiba printer spare parts functions - this is now a books website

// Expose utility functions globally for search system (books website)
window.updatePageHeader = updatePageHeader;
window.hideActiveSubmenus = hideActiveSubmenus;
window.renderProducts = renderProducts;
window.attachAddToCartListeners = attachAddToCartListeners;
window.scrollToProducts = scrollToProducts;

// Expose books products globally for search system
window.booksProducts = booksProducts;

// End of index.js - This is now a clean books website


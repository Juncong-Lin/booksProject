import { products } from "../../data/products.js";
import { booksProducts } from "../../data/books.js";
import { cart, addToCart } from "../../data/cart.js";
import { updateCartQuantity } from "../shared/cart-quantity.js";
import { parseMarkdown } from "../shared/markdown-parser.js";
import { formatPriceRange, formatCurrency } from "../shared/money.js";
import { analytics } from "../shared/analytics.js";
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
let productId;
let productType = "regular"; // Can be 'regular', 'printhead', 'printer', or 'printsparepart'
let productBrand = "";
// Helper function to find book by ID across all categories
function findBookById(id) {
  // First try direct match
  for (const category in booksProducts) {
    const product = booksProducts[category].find((item) => item.id === id);
    if (product) {
      return { ...product, category };
    }
  }
  // If direct match fails, try normalized ID (replace # with -, & with -, etc.)
  const normalizedId = id
    .replace(/#/g, "-")
    .replace(/&/g, "-")
    .replace(/\s+/g, "-");
  if (normalizedId !== id) {
    for (const category in booksProducts) {
      const product = booksProducts[category].find(
        (item) => item.id === normalizedId
      );
      if (product) {
        return { ...product, category };
      }
    }
  }
  return null;
}
// Get the product ID and type from URL parameters
const urlParams = new URLSearchParams(window.location.search);
let rawProductId =
  urlParams.get("id") || urlParams.get("productId") || urlParams.get("product");
// Decode the product ID to handle special characters like #, &, etc.
productId = rawProductId ? decodeURIComponent(rawProductId) : null;
const urlProductType = urlParams.get("productType");
// If productType is specified in URL, use it directly
if (urlProductType) {
  productType = urlProductType;
}
let product = null;
// If product type is specified in URL, search in the appropriate data structure
if (productType === "book" || productType === "books") {
  product = findBookById(productId);
  if (product) {
    productBrand = product.category;
  }
} else {
  // Search in regular products or auto-detect if no productType specified
  product = products.find((product) => product.id === productId);
}

// If productType was not specified in URL and product not found, try auto-detection
if (!product && !urlProductType) {
  // If not found in regular products, search in Books
  product = findBookById(productId);
  if (product) {
    productType = "book";
    productBrand = product.category;
  }
}
if (product) {
  // Track product view
  if (window.analytics) {
    window.analytics.trackProductClick(
      product.name,
      productBrand || productType
    );
  }

  // Unified breadcrumb rendering
  updateBreadcrumbDetail(product, productType, productBrand);
  // Update the product details on the page
  const productImageElement = document.querySelector(".js-product-image");
  productImageElement.src = encodeImagePath(product.image);
  productImageElement.setAttribute("data-original-src", product.image);
  document.querySelector(".js-product-name").textContent = product.name;

  // Enhance product image with fallback handling
  if (window.ImageLoader) {
    setTimeout(() => {
      window.ImageLoader.enhanceProductImages();
    }, 100);
  }
  // For printer products, hide the product description (red box)
  if (productType === "printer") {
    const descriptionElement = document.querySelector(
      ".js-product-description"
    );
    if (descriptionElement) {
      descriptionElement.style.display = "none";
    }
  }
  // Handle rating display - hide rating elements for printhead products since ratings were removed
  const ratingElement = document.querySelector(".js-product-rating");
  const ratingCountElement = document.querySelector(".js-product-rating-count");
  // Check for both rating formats: product.rating.stars (regular products) and product.star (books)
  if (
    (product.rating &&
      typeof product.rating === "object" &&
      product.rating.stars) ||
    product.star
  ) {
    // For regular products that have ratings or books with star rating
    let stars, count;
    if (product.rating && product.rating.stars) {
      stars = product.rating.stars;
      count = product.rating.count;
    } else if (product.star) {
      stars = product.star;
      count = 0; // Books might not have rating count
    }
    ratingElement.src = `images/ratings/rating-${Math.round(stars * 10)}.png`;
    ratingElement.style.display = "block";
    if (count > 0) {
      ratingCountElement.textContent = `(${count})`;
      ratingCountElement.style.display = "block";
    } else {
      ratingCountElement.style.display = "none";
    }
  } else {
    // For printhead products or products without ratings, hide rating elements
    const ratingContainer = document.querySelector(".product-rating-container");
    if (ratingContainer) ratingContainer.style.display = "none";
  } // Handle price display - different product types have different price formats
  let priceText;
  if (product.getPrice) {
    // Regular products with getPrice() method
    priceText = product.getPrice();
  } else if (
    product.lower_price !== undefined ||
    product.higher_price !== undefined
  ) {
    // Products with new price range format (printhead, printer, print spare parts)
    priceText = formatPriceRange(product.lower_price, product.higher_price);
  } else if (product.price) {
    // Fallback for products still using old price format
    priceText = `USD: $${(product.price / 100).toFixed(0)}`;
  } else {
    priceText = "USD: #NA";
  }
  document.querySelector(".js-product-price").textContent = priceText;
  // If there's an original price (for sale items), show it
  const originalPriceElement = document.querySelector(
    ".js-product-original-price"
  );
  if (product.originalPrice) {
    const originalPriceText = `$${(product.originalPrice / 100).toFixed(2)}`;
    originalPriceElement.textContent = originalPriceText;
    originalPriceElement.style.display = "block";
  } else {
    originalPriceElement.style.display = "none";
  }
  // Add product tags if any
  const tagsContainer = document.querySelector(".js-product-tags");
  if (productType === "printhead") {
    tagsContainer.innerHTML = `
      <div class="product-tag primary">
        <span>Original OEM</span>
      </div>
      <div class="product-tag">
        <span>In Stock</span>
      </div>
    `;
  } else if (product.tags && product.tags.length > 0) {
    tagsContainer.innerHTML = product.tags
      .map(
        (tag) =>
          `<div class="product-tag">
        <span>${tag}</span>
      </div>`
      )
      .join("");
  }
  // Set basic product description
  document.querySelector(".js-product-description").textContent =
    product.description || "";
  // Update the page title
  document.title = `${product.name} - Qilitrading.com`; // Load content based on product type
  if (productType === "printhead") {
    loadPrintheadDetails(product);
  } else if (
    productType === "printsparepart" ||
    productType === "print-spare-parts"
  ) {
    setupPrintSparePartContent(product);
  } else if (
    productType === "upgradingkit" ||
    productType === "upgrading-kit"
  ) {
    setupUpgradingKitContent(product);
  } else if (productType === "material") {
    setupMaterialProductContent(product);
  } else if (productType === "ledlcd" || productType === "led-lcd") {
    setupLedLcdProductContent(product);
  } else if (
    productType === "channelletter" ||
    productType === "channel-letter"
  ) {
    setupChannelLetterProductContent(product);
  } else if (productType === "other") {
    setupOtherProductContent(product);
  } else if (productType === "book" || productType === "books") {
    setupBookProductContent(product);
  } else if (productType === "printer") {
    setupPrinterProductContent(product);
  } else {
    setupRegularProductContent(product);
  }
  // Set up the product image gallery
  setupImageGallery(product);
  // Set up product information tabs
  setupProductTabs();
  // Initialize cart quantity display on page load
  updateCartQuantity();
} else {
  // Handle case when product is not found
  document.querySelector(".product-detail-grid").innerHTML = `
    <div class="error-message">
      Product not found. <a href="index.html">Return to homepage</a>
    </div>
  `;
}
/**
 * Sets up the product image gallery with thumbnails
 */
function setupImageGallery(product) {
  let mainImagePath = product.image;
  const thumbnailsContainer = document.querySelector(".js-product-thumbnails");
  if (productType === "printhead") {
    try {
      const imageParts = mainImagePath.split("/");
      const fileName = imageParts[imageParts.length - 1];
      const basePath = mainImagePath.substring(
        0,
        mainImagePath.lastIndexOf("/") + 1
      );
      const baseFileName = fileName.split(".img_")[0];
      const imagePaths = [];
      for (let i = 1; i <= 10; i++) {
        imagePaths.push(`${basePath}${baseFileName}.img_${i}.jpg`);
      }
      // Check which images actually exist before creating thumbnails
      let validImages = [];
      let loadPromises = [];
      // Create promises to check each image
      imagePaths.forEach((path, index) => {
        const promise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ path, index, exists: true });
          img.onerror = () => resolve({ path, index, exists: false });
          img.src = path;
        });
        loadPromises.push(promise);
      });
      // Wait for all image checks to complete
      Promise.all(loadPromises).then((results) => {
        // Filter only existing images
        validImages = results.filter((img) => img.exists);
        let thumbnailsHTML = "";
        if (validImages.length === 0) {
          // If no thumbnail images exist, use the main product image
          thumbnailsHTML = `
            <div class="thumbnail-item active" data-image="${encodeImagePath(
              product.image
            )}" data-index="0">
              <img src="${encodeImagePath(product.image)}" alt="${
            product.name
          } thumbnail" class="thumbnail-img">
            </div>
          `;
        } else {
          // Create thumbnails for existing images only
          validImages.forEach((img, i) => {
            thumbnailsHTML += `
              <div class="thumbnail-item ${
                i === 0 ? "active" : ""
              }" data-image="${encodeImagePath(img.path)}" data-index="${i}">
                <img src="${encodeImagePath(img.path)}" alt="${
              product.name
            } thumbnail ${i + 1}" class="thumbnail-img">
              </div>
            `;
          });
          // Set main image to first valid image
          document.querySelector(".js-product-image").src = validImages[0].path;
        }
        thumbnailsContainer.innerHTML = thumbnailsHTML;
        // Setup thumbnail gallery functionality
        setupThumbnailGalleryLogic();
        // Setup image magnifier
        setupImageMagnifier();
      });
    } catch (error) {
      // Error handling for printhead image gallery setup
    }
  } else if (
    productType === "printer" &&
    product.additionalImages &&
    product.additionalImages.length > 0
  ) {
    // Handle printer products with additional images
    try {
      // Start with main product image
      const allImages = [{ path: product.image, label: "Main Product Image" }];
      // Add additional images with descriptive labels
      product.additionalImages.forEach((imagePath, index) => {
        let label = "Additional Image";
        if (imagePath.includes("ink-supply-system")) {
          label = "Ink Supply System";
        } else if (imagePath.includes("maintenance-station")) {
          label = "Maintenance Station";
        } else if (imagePath.includes("media-pinch-roller")) {
          label = "Media Pinch Roller";
        }
        allImages.push({ path: imagePath, label: label });
      });
      // Check which images actually exist
      let validImages = [];
      let loadPromises = [];
      allImages.forEach((imageObj, index) => {
        const promise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ ...imageObj, index, exists: true });
          img.onerror = () => resolve({ ...imageObj, index, exists: false });
          img.src = imageObj.path;
        });
        loadPromises.push(promise);
      });
      // Wait for all image checks to complete
      Promise.all(loadPromises).then((results) => {
        // Filter only existing images
        validImages = results.filter((img) => img.exists);
        let thumbnailsHTML = "";
        if (validImages.length === 0) {
          // Fallback to main product image only
          thumbnailsHTML = `
            <div class="thumbnail-item active" data-image="${encodeImagePath(
              product.image
            )}" data-index="0">
              <img src="${encodeImagePath(product.image)}" alt="${
            product.name
          } thumbnail" class="thumbnail-img">
            </div>
          `;
        } else {
          // Create thumbnails for existing images
          validImages.forEach((img, i) => {
            thumbnailsHTML += `
              <div class="thumbnail-item ${
                i === 0 ? "active" : ""
              }" data-image="${encodeImagePath(
              img.path
            )}" data-index="${i}" title="${img.label}">
                <img src="${encodeImagePath(img.path)}" alt="${
              img.label
            }" class="thumbnail-img">
              </div>
            `;
          });
          // Set main image to first valid image
          document.querySelector(".js-product-image").src = validImages[0].path;
        }
        thumbnailsContainer.innerHTML = thumbnailsHTML;
        // Setup thumbnail gallery functionality
        setupThumbnailGalleryLogic();
        // Setup image magnifier
        setupImageMagnifier();
      });
    } catch (error) {
      // Error handling for printer image gallery setup
      // Fallback to main image only
      setupSingleImageGallery(product);
    }
  } else if (productType === "printsparepart") {
    // For print spare parts - check for multiple images like printhead products
    try {
      const imageParts = mainImagePath.split("/");
      const fileName = imageParts[imageParts.length - 1];
      const basePath = mainImagePath.substring(
        0,
        mainImagePath.lastIndexOf("/") + 1
      );
      const baseFileName = fileName.split(".img_")[0];
      const imagePaths = [];
      for (let i = 1; i <= 10; i++) {
        imagePaths.push(`${basePath}${baseFileName}.img_${i}.jpg`);
      }
      // Check which images actually exist before creating thumbnails
      let validImages = [];
      let loadPromises = [];
      // Create promises to check each image
      imagePaths.forEach((path, index) => {
        const promise = new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ path, index, exists: true });
          img.onerror = () => resolve({ path, index, exists: false });
          img.src = path;
        });
        loadPromises.push(promise);
      });
      // Wait for all image checks to complete
      Promise.all(loadPromises).then((results) => {
        // Filter only existing images
        validImages = results.filter((img) => img.exists);
        let thumbnailsHTML = "";
        if (validImages.length === 0) {
          // If no thumbnail images exist, use the main product image
          thumbnailsHTML = `
            <div class="thumbnail-item active" data-image="${encodeImagePath(
              product.image
            )}" data-index="0">
              <img src="${encodeImagePath(product.image)}" alt="${
            product.name
          } thumbnail" class="thumbnail-img">
            </div>
          `;
        } else {
          // Create thumbnails for existing images only
          validImages.forEach((img, i) => {
            thumbnailsHTML += `
              <div class="thumbnail-item ${
                i === 0 ? "active" : ""
              }" data-image="${encodeImagePath(img.path)}" data-index="${i}">
                <img src="${encodeImagePath(img.path)}" alt="${
              product.name
            } thumbnail ${i + 1}" class="thumbnail-img">
              </div>
            `;
          }); // Set main image to first valid image
          document.querySelector(".js-product-image").src = validImages[0].path;
        }
        thumbnailsContainer.innerHTML = thumbnailsHTML;
        // Setup thumbnail gallery functionality
        setupThumbnailGalleryLogic();
        // Setup image magnifier
        setupImageMagnifier();
      });
    } catch (error) {
      // Error handling for print spare part image gallery setup
      // Fallback to main image only
      setupSingleImageGallery(product);
    }
  } else {
    // For books and products with only main image (regular products or printers without additional images)
    if (productType === "book" || productType === "books") {
      setupBookImageGallery(product);
    } else {
      setupSingleImageGallery(product);
    }
  }
}
/**
 * Setup gallery for products with multiple images (like print spare parts)
 */
function setupMultipleImageGallery(product) {
  const thumbnailsContainer = document.querySelector(".js-product-thumbnails");
  let thumbnailsHTML = "";
  product.images.forEach((imagePath, index) => {
    thumbnailsHTML += `
      <div class="thumbnail-item ${
        index === 0 ? "active" : ""
      }" data-image="${imagePath}" data-index="${index}">
        <img src="${imagePath}" alt="${product.name} thumbnail ${
      index + 1
    }" class="thumbnail-img">
      </div>
    `;
  });
  thumbnailsContainer.innerHTML = thumbnailsHTML;
  // Set main image to first image
  document.querySelector(".js-product-image").src = product.images[0];
  // Setup thumbnail gallery functionality
  setupThumbnailGalleryLogic();
  // Setup image magnifier
  setupImageMagnifier();
}
/**
 * Setup gallery for products with only a main image
 */
function setupSingleImageGallery(product) {
  const thumbnailsContainer = document.querySelector(".js-product-thumbnails");
  thumbnailsContainer.innerHTML = `
    <div class="thumbnail-item active" data-image="${encodeImagePath(
      product.image
    )}" data-index="0">
      <img src="${encodeImagePath(product.image)}" alt="${
    product.name
  } thumbnail" class="thumbnail-img">
    </div>
  `;
  // Hide arrows for single image
  const leftArrow = document.querySelector(".js-thumbnail-arrow-left");
  const rightArrow = document.querySelector(".js-thumbnail-arrow-right");
  if (leftArrow) leftArrow.style.display = "none";
  if (rightArrow) rightArrow.style.display = "none";
  // Setup basic thumbnail click functionality
  const thumbnail = document.querySelector(".thumbnail-item");
  if (thumbnail) {
    thumbnail.addEventListener("click", () => {
      document.querySelector(".js-product-image").src = thumbnail.dataset.image;
      // Reinitialize magnifier for the new image
      if (window.imageMagnifier) {
        setupImageMagnifier();
      }
    });
  }
  // Setup image magnifier
  setupImageMagnifier();
}
/**
 * Setup gallery specifically for book products with enhanced book cover display
 */
function setupBookImageGallery(product) {
  const thumbnailsContainer = document.querySelector(".js-product-thumbnails");
  const mainImageContainer = document.querySelector(
    ".product-main-image-container"
  );
  // Add book-specific CSS class for styling
  mainImageContainer.classList.add("book-cover-container");
  thumbnailsContainer.innerHTML = `
    <div class="thumbnail-item active book-thumbnail" data-image="${encodeImagePath(
      product.image
    )}" data-index="0">
      <img src="${encodeImagePath(product.image)}" alt="${
    product.name
  } book cover" class="thumbnail-img book-cover-thumbnail">
    </div>
  `;
  // Hide arrows for single image
  const leftArrow = document.querySelector(".js-thumbnail-arrow-left");
  const rightArrow = document.querySelector(".js-thumbnail-arrow-right");
  if (leftArrow) leftArrow.style.display = "none";
  if (rightArrow) rightArrow.style.display = "none";
  // Setup basic thumbnail click functionality
  const thumbnail = document.querySelector(".thumbnail-item");
  if (thumbnail) {
    thumbnail.addEventListener("click", () => {
      document.querySelector(".js-product-image").src = thumbnail.dataset.image;
      // Reinitialize magnifier for the new image
      if (window.imageMagnifier) {
        setupImageMagnifier();
      }
    });
  }
  // Setup image magnifier specifically for book covers
  setupImageMagnifier();
  // Add book-specific image styling
  const productImage = document.querySelector(".js-product-image");
  if (productImage) {
    productImage.classList.add("book-cover-image");
    productImage.alt = `${product.name} - Book Cover`;
  }
}
/**
 * Setup thumbnail gallery navigation logic (shared between printhead and printer galleries)
 */
function setupThumbnailGalleryLogic() {
  // Now setup scrolling logic with the actual thumbnails
  let startIndex = 0;
  const maxVisible = 5;
  const thumbnails = Array.from(document.querySelectorAll(".thumbnail-item"));
  function updateVisibleThumbnails() {
    thumbnails.forEach((thumb, idx) => {
      if (idx >= startIndex && idx < startIndex + maxVisible) {
        thumb.style.display = "";
      } else {
        thumb.style.display = "none";
      }
    });
  }
  // Only show arrows if we have more thumbnails than maxVisible
  const leftArrow = document.querySelector(".js-thumbnail-arrow-left");
  const rightArrow = document.querySelector(".js-thumbnail-arrow-right");
  // Check if we're on mobile (integrated mobile functionality)
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    // On mobile, show arrows and setup touch scrolling
    leftArrow.style.display = "flex";
    rightArrow.style.display = "flex";
    // Show all thumbnails on mobile (scroll-based approach)
    thumbnails.forEach((thumb) => (thumb.style.display = ""));
    // Setup mobile-specific touch scrolling and arrow functionality
    setupMobileArrowScrolling(
      leftArrow,
      rightArrow,
      document.querySelector(".js-product-thumbnails")
    );
  } else {
    // Show arrows and setup scrolling (desktop - visibility-based approach)
    leftArrow.style.display = "flex";
    rightArrow.style.display = "flex";
    // If we have 5 or fewer thumbnails, show all and disable arrow functionality
    if (thumbnails.length <= maxVisible) {
      // Show all thumbnails when we have 5 or fewer
      thumbnails.forEach((thumb) => (thumb.style.display = ""));
      // Disable arrows since no scrolling is needed
      leftArrow.disabled = true;
      rightArrow.disabled = true;
    } else {
      // Enable arrows and setup scrolling for more than 5 thumbnails
      leftArrow.disabled = false;
      rightArrow.disabled = false;
      updateVisibleThumbnails();
      function updateArrows() {
        leftArrow.disabled = startIndex === 0;
        rightArrow.disabled = startIndex + maxVisible >= thumbnails.length;
      }
      updateArrows();
      leftArrow.addEventListener("click", () => {
        if (startIndex > 0) {
          startIndex--;
          updateVisibleThumbnails();
          updateArrows();
        }
      });
      rightArrow.addEventListener("click", () => {
        if (startIndex + maxVisible < thumbnails.length) {
          startIndex++;
          updateVisibleThumbnails();
          updateArrows();
        }
      });
    }
  }
  // Thumbnail click event
  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      document.querySelector(".js-product-image").src = thumbnail.dataset.image;
      thumbnails.forEach((t) => t.classList.remove("active"));
      thumbnail.classList.add("active");
      // Reinitialize magnifier for the new image
      if (window.imageMagnifier) {
        setupImageMagnifier();
      }
    });
  });
  // Mobile touch scrolling for thumbnails
  setupMobileTouchScrolling(document.querySelector(".js-product-thumbnails"));
  // Mobile-friendly image sizing
  setupMobileImageSizing();
  // Setup image magnifier
  setupImageMagnifier();
  // Handle window resize to switch between mobile and desktop scrolling modes
  function handleResize() {
    const isMobileNow = window.innerWidth <= 768;
    const leftArrowResize = document.querySelector(".js-thumbnail-arrow-left");
    const rightArrowResize = document.querySelector(
      ".js-thumbnail-arrow-right"
    );
    // Always show arrows regardless of thumbnail count
    leftArrowResize.style.display = "flex";
    rightArrowResize.style.display = "flex";
    if (isMobileNow) {
      // Switch to mobile mode: show all thumbnails, enable mobile scrolling
      thumbnails.forEach((thumb) => (thumb.style.display = ""));
      setupMobileArrowScrolling(
        leftArrowResize,
        rightArrowResize,
        document.querySelector(".js-product-thumbnails")
      );
    } else {
      // Switch to desktop mode: use visibility-based scrolling
      // Clean up mobile scroll handlers
      if (leftArrowResize._mobileHandler) {
        leftArrowResize.removeEventListener(
          "click",
          leftArrowResize._mobileHandler,
          true
        );
      }
      if (rightArrowResize._mobileHandler) {
        rightArrowResize.removeEventListener(
          "click",
          rightArrowResize._mobileHandler,
          true
        );
      }
      // Restore normal overflow for desktop visibility-based scrolling
      document.querySelector(".js-product-thumbnails").style.overflow =
        "hidden";
      document.querySelector(".js-product-thumbnails").style.scrollBehavior =
        "auto";
      if (thumbnails.length <= maxVisible) {
        // Show all thumbnails and disable arrows when we have 5 or fewer
        thumbnails.forEach((thumb) => (thumb.style.display = ""));
        leftArrowResize.disabled = true;
        rightArrowResize.disabled = true;
      } else {
        // Enable arrows and reset to beginning for more than 5 thumbnails
        leftArrowResize.disabled = false;
        rightArrowResize.disabled = false;
        startIndex = 0; // Reset to beginning
        updateVisibleThumbnails();
        updateArrows();
      }
    }
  }
  // Listen for resize events
  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);
}
/**
 * Load detailed information for printhead products
 */
async function loadPrintheadDetails(product) {
  try {
    // Extract the path to the markdown file
    const imagePath = product.image;
    // Get the brand and model name from the image path
    // Format: products/printhead/Canon printhead/Canon PF-03 Printhead/image/...
    const pathParts = imagePath.split("/");
    const brandFolder = pathParts[2]; // "Canon printhead"
    const modelFolder = pathParts[3]; // "Canon PF-03 Printhead"
    // Construct path to MD file
    const mdFilePath = `products/printhead/${brandFolder}/${modelFolder}/${modelFolder}.md`;
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackPrintheadContent(product);
      return;
    }
    const mdContent = await response.text();
    // For printhead products, load the entire markdown content directly
    const parsedContent = parseMarkdown(mdContent);
    // Update the product details tab content with the full markdown content
    document.querySelector(".js-product-details-content").innerHTML =
      parsedContent || "";
    // Hide compatibility and specifications sections since we're loading everything from markdown
    document.querySelector(".product-compatibility-section").style.display =
      "none";
    document.querySelector(".product-specifications-section").style.display =
      "none";
  } catch (error) {
    // Error handling for printhead details loading
    // Fallback to hardcoded content if there's an error
    setupFallbackPrintheadContent(product);
  }
}
/**
 * Load markdown content for printer products (similar to print heads)
 */
async function loadPrinterMarkdownContent(product) {
  try {
    const imagePath = product.image;
    const pathParts = imagePath.split("/");
    let mdFilePath = "";
    // Handle different path structures for printer products
    if (
      pathParts.length >= 6 &&
      pathParts[1] === "inkjetPrinter" &&
      pathParts[2] === "economic version"
    ) {
      // Economic version format: products/inkjetPrinter/economic version/Product Name/image/Product Name.jpg
      const productFolder = pathParts[3]; // Product folder is at index 3
      mdFilePath = `products/inkjetPrinter/economic version/${productFolder}/${productFolder}.md`;
    } else if (
      pathParts.length >= 6 &&
      pathParts[1] === "inkjetPrinter" &&
      pathParts[2] === "inkjet" &&
      pathParts[3] === "printer" &&
      pathParts[4] === "with"
    ) {
      // Old format: products/inkjetPrinter/inkjet printer with/.../Product Name/Product Name.md
      const productFolder = pathParts[pathParts.length - 2]; // Folder containing the image
      const pathUpToProduct = pathParts.slice(0, -1).join("/"); // Path up to the product folder
      // Try to find markdown file with same name as product folder
      mdFilePath = `${pathUpToProduct}/${productFolder}.md`;
      // If image has a special suffix, try that for the MD file too
      const imageName = pathParts[pathParts.length - 1];
      const baseImageName = imageName.split(".")[0];
      if (baseImageName !== productFolder) {
        mdFilePath = `${pathUpToProduct}/${baseImageName}.md`;
      }
    } else if (pathParts.length >= 5 && pathParts[1] === "inkjetPrinter") {
      // Standard printer format: products/inkjetPrinter/category/Product Name/image/Product Name.jpg
      const productFolder = pathParts[3]; // Product folder is at index 3
      const category = pathParts[2]; // Category like 'solvent', 'double side', 'uv flatbed', etc.
      // Construct path: products/inkjetPrinter/category/Product Name/Product Name.md
      mdFilePath = `products/inkjetPrinter/${category}/${productFolder}/${productFolder}.md`;
    } else {
      // Fallback to basic content if path doesn't match expected format
      setupBasicPrinterContent(product);
      return;
    }
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to basic content if markdown file is not found
      setupBasicPrinterContent(product);
      return;
    }
    const mdContent = await response.text();
    // Parse and display the markdown content
    const parsedContent = parseMarkdown(mdContent);
    // Update the product details tab content with the full markdown content
    document.querySelector(".js-product-details-content").innerHTML =
      parsedContent || "";
    // Hide compatibility and specifications sections since we're loading everything from markdown
    const compatibilitySection = document.querySelector(
      ".product-compatibility-section"
    );
    const specificationsSection = document.querySelector(
      ".product-specifications-section"
    );
    if (compatibilitySection) compatibilitySection.style.display = "none";
    if (specificationsSection) specificationsSection.style.display = "none";
  } catch (error) {
    // Error handling for printer markdown content loading
    // Fallback to basic content if there's an error
    setupBasicPrinterContent(product);
  }
}
/**
 * Set up the product information tabs
 */
function setupProductTabs() {
  const tabHeaders = document.querySelectorAll(".tab-header");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      // Remove active class from all headers and panels
      tabHeaders.forEach((h) => h.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      // Add active class to clicked header
      header.classList.add("active");
      // Add active class to corresponding panel
      const tabId = header.dataset.tab;
      document.getElementById(tabId).classList.add("active");
    });
  });
}
/**
 * Set up content for regular (non-printhead) products
 */
async function setupRegularProductContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    const pathParts = imagePath.split("/");
    // Check if this is an inkjet printer product
    if (pathParts.length >= 5 && pathParts[2] === "inkjetPrinter") {
      // This is a printer product, use the same logic as dedicated printer content loader
      await loadPrinterMarkdownContent(product);
      return;
    }
    // For non-printer products, use the existing logic
    if (
      pathParts.length >= 6 &&
      pathParts[3] === "inkjet" &&
      pathParts[4] === "printer" &&
      pathParts[5] === "with"
    ) {
      // Handle old format: products/inkjetPrinter/inkjet printer with/...
      // Find the product folder (usually the second-to-last folder before the image file)
      const productFolder = pathParts[pathParts.length - 2]; // Folder containing the image
      const pathUpToProduct = pathParts.slice(0, -1).join("/"); // Path up to the product folder
      // Try to find markdown file with same name as product folder
      let mdFilePath = `${pathUpToProduct}/${productFolder}.md`;
      // If image has a special suffix like "(the economic version)", try that for the MD file too
      const imageName = pathParts[pathParts.length - 1];
      const baseImageName = imageName.split(".")[0];
      if (baseImageName !== productFolder) {
        mdFilePath = `${pathUpToProduct}/${baseImageName}.md`;
      }
      // Fetch the markdown file content
      const response = await fetch(mdFilePath);
      if (!response.ok) {
        // Fallback to hardcoded content if markdown file is not found
        setupFallbackRegularProductContent(product);
        return;
      }
      const mdContent = await response.text();
      // Update product description and content with the markdown content
      // For regular products, we'll use the entire markdown content as the main content
      const parsedContent = parseMarkdown(mdContent);
      // Update the product details tab content with the full markdown content
      document.querySelector(".js-product-details-content").innerHTML =
        parsedContent || "";
      // Hide compatibility and specifications sections since we're loading everything from markdown
      document.querySelector(".product-compatibility-section").style.display =
        "none";
      document.querySelector(".product-specifications-section").style.display =
        "none";
    } else {
      // If path doesn't match expected format, use fallback
      setupFallbackRegularProductContent(product);
    }
  } catch (error) {
    // Error handling for regular product details loading
    // Fallback to hardcoded content if there's an error
    setupFallbackRegularProductContent(product);
  }
}
/**
 * Fallback function for regular product content when markdown loading fails
 */
function setupFallbackRegularProductContent(product) {
  // Set minimal fallback content
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>Product information is currently being updated. Please contact us for detailed specifications.</p>
  `;
  // Hide sections since we don't have structured data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
/**
 * Fallback function for printhead content when markdown loading fails
 */
function setupFallbackPrintheadContent(product) {
  // Set minimal fallback content for printheads
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>High-quality printhead for industrial inkjet printing applications. Product information is currently being updated. Please contact us for detailed specifications and compatibility information.</p>
  `;
  // Hide sections since we don't have structured data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
/**
 * Set up content for printer products (now uses markdown loading like print heads)
 */
async function setupPrinterProductContent(product) {
  // Set basic product description
  document.querySelector(".js-product-description").innerHTML =
    product.description ||
    "High-quality inkjet printer designed for professional printing applications.";
  // Try to load markdown content for printer products
  try {
    await loadPrinterMarkdownContent(product);
  } catch (error) {
    // Error handling for printer markdown content loading
    // Fallback to basic content if markdown loading fails
    setupBasicPrinterContent(product);
  }
}
/**
 * Fallback function for printer content when document loading fails
 */
function setupBasicPrinterContent(product) {
  // Set basic content for printers that don't have documents or when document loading fails
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>Product specifications and detailed information are being updated. Please contact our support team for the latest details and technical specifications.</p>
  `;
  // Hide sections that aren't relevant for basic printer display
  const compatibilitySection = document.querySelector(
    ".product-compatibility-section"
  );
  const specificationsSection = document.querySelector(
    ".product-specifications-section"
  );
  if (compatibilitySection) compatibilitySection.style.display = "none";
  if (specificationsSection) specificationsSection.style.display = "none";
}
/**
 * Clean up formatting issues in upgrading kit markdown content
 */
function cleanUpgradingKitMarkdown(mdContent) {
  if (!mdContent) return "";
  let cleaned = mdContent;
  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
  // Split into lines for processing
  let lines = cleaned.split("\n");
  let processedLines = [];
  let currentSection = "";
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    // Skip empty lines at this stage
    if (!line) {
      processedLines.push("");
      continue;
    }
    // Keep headers as-is
    if (line.startsWith("#")) {
      processedLines.push(line);
      continue;
    }
    // Keep price lines as-is
    if (line.startsWith("Price:")) {
      processedLines.push(line);
      processedLines.push(""); // Add empty line after price
      continue;
    }
    // Handle section headers (like "Product Details:", "Application:", etc.)
    if (line.endsWith(":") && !line.includes(" ")) {
      currentSection = line;
      processedLines.push(`### ${line}`);
      continue;
    }
    // Handle multi-word section headers
    if (
      line.match(
        /^(Product Details|Application|Software|Supported ink|Comment|Inkjet Printer|Supported inkjet series|Price|Features|Specifications).*:$/
      )
    ) {
      currentSection = line;
      processedLines.push(`### ${line}`);
      continue;
    }
    // Handle broken lines - if current line seems incomplete, try to join with next non-empty line
    if (
      line.length > 0 &&
      !line.endsWith(".") &&
      !line.endsWith(",") &&
      !line.endsWith(")") &&
      !line.endsWith(":") &&
      !line.match(/^(Photo|Below|Image|\d+\.)/)
    ) {
      let nextLineIndex = i + 1;
      let combinedLine = line;
      // Look ahead to combine broken lines
      while (nextLineIndex < lines.length) {
        let nextLine = lines[nextLineIndex].trim();
        if (!nextLine) {
          nextLineIndex++;
          continue;
        }
        // If next line starts with uppercase or looks like a new section, don't combine
        if (
          nextLine.startsWith("#") ||
          nextLine.endsWith(":") ||
          nextLine.startsWith("Price:")
        ) {
          break;
        }
        // If next line is very short (likely continuation), combine it
        if (
          nextLine.length <= 50 &&
          !nextLine.match(/^(Photo \d+|Below Photo)/)
        ) {
          combinedLine += " " + nextLine;
          i = nextLineIndex; // Skip the next line since we combined it
          nextLineIndex++;
        } else {
          break;
        }
      }
      processedLines.push(combinedLine);
    } else {
      processedLines.push(line);
    }
  }
  // Join lines back together
  cleaned = processedLines.join("\n");
  // Clean up multiple consecutive empty lines
  cleaned = cleaned.replace(/\n\n\n+/g, "\n\n");
  // Remove empty photo references
  cleaned = cleaned.replace(/Photo \d+:\s*\n/g, "");
  cleaned = cleaned.replace(/photo \d+:\s*\n/g, "");
  cleaned = cleaned.replace(/Below Photo Referencia[^\n]*\n/g, "");
  // Fix common formatting issues
  cleaned = cleaned.replace(/：/g, ":"); // Replace Chinese colon with regular colon
  cleaned = cleaned.replace(/，/g, ","); // Replace Chinese comma with regular comma
  // Clean up spacing around punctuation
  cleaned = cleaned.replace(/\s+([,.;:])/g, "$1");
  cleaned = cleaned.replace(/([,.;:])\s+/g, "$1 ");
  return cleaned;
}
/**
 * Set up content for upgrading kit products
 */
async function setupUpgradingKitContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    // Get the brand folder and product folder from the image path
    // Format: products/upgradingKit/Brand/Product Name/image/...
    const pathParts = imagePath.split("/");
    const brandFolder = pathParts[2]; // Brand folder
    const productFolder = pathParts[3]; // Product name folder
    // Construct path to MD file
    const mdFilePath = `products/upgradingKit/${brandFolder}/${productFolder}/${productFolder}.md`;
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackUpgradingKitContent(product);
      return;
    }
    const mdContent = await response.text();
    // Clean up the markdown content to fix formatting issues
    const cleanedMdContent = cleanUpgradingKitMarkdown(mdContent);
    if (cleanedMdContent && cleanedMdContent.trim()) {
      // Update product description and content with the cleaned markdown content
      // For upgrading kits, we'll use the entire markdown content as the main content
      const parsedContent = parseMarkdown(cleanedMdContent);
      // Update the product details tab content with the full markdown content
      document.querySelector(".js-product-details-content").innerHTML =
        parsedContent || "";
    } else {
      setupFallbackUpgradingKitContent(product);
    }
    // Hide compatibility and specifications sections since upgrading kits typically don't have structured sections
    document.querySelector(".product-compatibility-section").style.display =
      "none";
    document.querySelector(".product-specifications-section").style.display =
      "none";
  } catch (error) {
    // Error handling for upgrading kit details loading
    // Fallback to hardcoded content if there's an error
    setupFallbackUpgradingKitContent(product);
  }
}
/**
 * Fallback function for upgrading kit content when markdown loading fails
 */
function setupFallbackUpgradingKitContent(product) {
  // Set more informative fallback content based on product name analysis
  const brandName =
    product.brand.charAt(0).toUpperCase() +
    product.brand.slice(1).replace(/_/g, " ");
  const productName = product.name;
  // Extract key information from product name
  let printerType = "inkjet printer";
  let printHeadInfo = "";
  let styleInfo = "";
  // Detect printer style
  if (productName.toLowerCase().includes("flatbed")) {
    printerType = "flatbed printer";
    styleInfo = "This kit is designed for flatbed printer applications.";
  } else if (productName.toLowerCase().includes("roll to roll")) {
    printerType = "roll-to-roll printer";
    styleInfo = "This kit is designed for roll-to-roll printer applications.";
  } else if (productName.toLowerCase().includes("uv")) {
    printerType = "UV printer";
    styleInfo = "This kit is designed for UV printing applications.";
  }
  // Extract printhead information
  if (productName.match(/(\d+)\s*(piece|pieces|head|heads)/i)) {
    const match = productName.match(/(\d+)\s*(piece|pieces|head|heads)/i);
    printHeadInfo = `This kit supports ${match[1]} printhead${
      match[1] > 1 ? "s" : ""
    }.`;
  }
  // Extract printhead type
  let headType = "";
  if (productName.toLowerCase().includes("i3200")) {
    headType = "I3200 printheads";
  } else if (productName.toLowerCase().includes("xp600")) {
    headType = "XP600 printheads";
  } else if (productName.toLowerCase().includes("tx800")) {
    headType = "TX800 printheads";
  } else if (productName.toLowerCase().includes("i1600")) {
    headType = "I1600 printheads";
  }
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${productName}</h3>
    <div class="product-info-section">
      <h4>Product Overview</h4>
      <p>This is a ${brandName} upgrading kit designed to upgrade your existing ${printerType} with modern components and improved performance.</p>
      ${headType ? `<p><strong>Printhead Type:</strong> ${headType}</p>` : ""}
      ${
        printHeadInfo
          ? `<p><strong>Configuration:</strong> ${printHeadInfo}</p>`
          : ""
      }
      ${styleInfo ? `<p><strong>Application:</strong> ${styleInfo}</p>` : ""}
    </div>
    <div class="product-info-section">
      <h4>General Features</h4>
      <ul>
        <li>Complete upgrading solution with all necessary components</li>
        <li>Compatible with various Chinese inkjet printer brands</li>
        <li>Includes control boards and cable work</li>
        <li>Professional installation recommended</li>
      </ul>
    </div>
    <div class="product-info-section">
      <h4>Typical Applications</h4>
      <ul>
        <li>Upgrading older inkjet printers</li>
        <li>Replacing obsolete printhead systems</li>
        <li>Improving print quality and reliability</li>
        <li>Extending printer lifespan</li>
      </ul>
    </div>
    <div class="contact-info">
      <p><strong>Need More Information?</strong></p>
      <p>For detailed specifications, compatibility information, and installation support, please contact our technical team.</p>
    </div>
  `;
  // Hide sections since we don't have detailed structured data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
/**
 * Set up content for print spare parts products
 */
async function setupPrintSparePartContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    // Get the brand folder and product folder from the image path
    // Format: products/printSparePart/Brand/Product Name/image/...
    const pathParts = imagePath.split("/");
    const brandFolder = pathParts[2]; // Brand folder
    const productFolder = pathParts[3]; // Product name folder
    // Construct path to MD file
    const mdFilePath = `products/printSparePart/${brandFolder}/${productFolder}/${productFolder}.md`;
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackPrintSparePartContent(product);
      return;
    }
    const mdContent = await response.text();
    // Update product description and content with the markdown content
    // For spare parts, we'll use the entire markdown content as the main content
    const parsedContent = parseMarkdown(mdContent);
    // Update the product details tab content with the full markdown content
    document.querySelector(".js-product-details-content").innerHTML =
      parsedContent || "";
    // Hide compatibility and specifications sections since spare parts typically don't have structured sections
    document.querySelector(".product-compatibility-section").style.display =
      "none";
    document.querySelector(".product-specifications-section").style.display =
      "none";
  } catch (error) {
    // Fallback to hardcoded content if there's an error
    setupFallbackPrintSparePartContent(product);
  }
}
/**
 * Fallback function for print spare part content when markdown loading fails
 */
function setupFallbackPrintSparePartContent(product) {
  // Set minimal fallback content
  const brandName =
    product.brand.charAt(0).toUpperCase() + product.brand.slice(1);
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>${brandName} printer spare part. Product information is currently being updated. Please contact us for detailed specifications.</p>
  `;
  // Hide sections since we don't have detailed data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
/**
 * Set up content for material products
 */
async function setupMaterialProductContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    // Get the category folder and product folder from the image path
    // Format: products/material/Category/Product Name/image/...
    const pathParts = imagePath.split("/");
    const categoryFolder = pathParts[2]; // Category folder
    const productFolder = pathParts[3]; // Product name folder
    // Construct path to MD file
    const mdFilePath = `products/material/${categoryFolder}/${productFolder}/${productFolder}.md`;
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackMaterialContent(product);
      return;
    }
    const mdContent = await response.text();
    // Update product description and content with the markdown content
    // For materials, we'll use the entire markdown content as the main content
    const parsedContent = parseMarkdown(mdContent);
    // Update the product details tab content with the full markdown content
    document.querySelector(".js-product-details-content").innerHTML =
      parsedContent || "";
    // Hide compatibility and specifications sections since materials typically don't have structured sections
    document.querySelector(".product-compatibility-section").style.display =
      "none";
    document.querySelector(".product-specifications-section").style.display =
      "none";
  } catch (error) {
    // Fallback to hardcoded content if there's an error
    setupFallbackMaterialContent(product);
  }
}
/**
 * Fallback function for material content when markdown loading fails
 */
function setupFallbackMaterialContent(product) {
  // Set minimal fallback content
  const categoryName =
    product.category.charAt(0).toUpperCase() + product.category.slice(1);
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>${categoryName} material for printing applications. Product information is currently being updated. Please contact us for detailed specifications.</p>
    <div class="product-specifications">
      <h4>Product Category</h4>
      <p>${categoryName}</p>
      <h4>Applications</h4>
      <p>Suitable for various printing and signage applications.</p>
      <p><strong>Need More Information?</strong></p>
      <p>For detailed specifications, compatibility information, and application guidelines, please contact our technical team.</p>
    </div>
  `;
  // Hide sections since we don't have detailed data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
/**
 * Set up content for LED & LCD products
 */
async function setupLedLcdProductContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    // Get the category folder and product folder from the image path
    // Format: products/ledAndLcd/Category/Product Name/image/...
    const pathParts = imagePath.split("/");
    const categoryFolder = pathParts[2]; // Category folder
    const productFolder = pathParts[3]; // Product name folder
    // Construct path to MD file
    const mdFilePath = `products/ledAndLcd/${categoryFolder}/${productFolder}/${productFolder}.md`;
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackLedLcdContent(product);
      return;
    }
    const mdContent = await response.text();
    // Update product description and content with the markdown content
    // For LED & LCD, we'll use the entire markdown content as the main content
    const parsedContent = parseMarkdown(mdContent);
    // Update the product details tab content with the full markdown content
    document.querySelector(".js-product-details-content").innerHTML =
      parsedContent || "";
    // Hide compatibility and specifications sections since LED & LCD typically don't have structured sections
    document.querySelector(".product-compatibility-section").style.display =
      "none";
    document.querySelector(".product-specifications-section").style.display =
      "none";
  } catch (error) {
    // Fallback to hardcoded content if there's an error
    setupFallbackLedLcdContent(product);
  }
}
/**
 * Fallback function for LED & LCD content when markdown loading fails
 */
function setupFallbackLedLcdContent(product) {
  // Set minimal fallback content
  const categoryName =
    product.category.charAt(0).toUpperCase() + product.category.slice(1);
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>${categoryName} LED & LCD display for professional applications. Product information is currently being updated. Please contact us for detailed specifications.</p>
    <div class="product-specifications">
      <h4>Product Category</h4>
      <p>${categoryName} LED & LCD</p>
      <h4>Applications</h4>
      <p>Suitable for various display and signage applications.</p>
      <p><strong>Need More Information?</strong></p>
      <p>For detailed specifications, compatibility information, and application guidelines, please contact our technical team.</p>
    </div>
  `;
  // Hide sections since we don't have detailed data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
/**
 * Set up content for Channel Letter Bending Machine products
 */
async function setupChannelLetterProductContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    // Get the category folder and product folder from the image path
    // Format: products/channelLetterBendingMechine/Category/Product Name/image/...
    const pathParts = imagePath.split("/");
    const categoryFolder = pathParts[2]; // Category folder
    const productFolder = pathParts[3]; // Product name folder
    // Construct path to MD file
    const mdFilePath = `products/channelLetterBendingMechine/${categoryFolder}/${productFolder}/${productFolder}.md`;
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackChannelLetterContent(product);
      return;
    }
    const mdContent = await response.text();
    // Update product description and content with the markdown content
    // For Channel Letter, we'll use the entire markdown content as the main content
    const parsedContent = parseMarkdown(mdContent);
    // Update the product details tab content with the full markdown content
    document.querySelector(".js-product-details-content").innerHTML =
      parsedContent || "";
    // Hide compatibility and specifications sections since Channel Letter typically don't have structured sections
    document.querySelector(".product-compatibility-section").style.display =
      "none";
    document.querySelector(".product-specifications-section").style.display =
      "none";
  } catch (error) {
    // Fallback to hardcoded content if there's an error
    setupFallbackChannelLetterContent(product);
  }
}
/**
 * Fallback function for Channel Letter content when markdown loading fails
 */
function setupFallbackChannelLetterContent(product) {
  // Set minimal fallback content
  const categoryName =
    product.category.charAt(0).toUpperCase() + product.category.slice(1);
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>${categoryName} Channel Letter Bending Machine for professional signage manufacturing. Product information is currently being updated. Please contact us for detailed specifications.</p>
    <div class="product-specifications">
      <h4>Product Category</h4>
      <p>${categoryName} Channel Letter Bending Machine</p>
      <h4>Applications</h4>
      <p>Suitable for various channel letter and signage manufacturing applications.</p>
      <p><strong>Need More Information?</strong></p>
      <p>For detailed specifications, compatibility information, and application guidelines, please contact our technical team.</p>
    </div>
  `;
  // Hide sections since we don't have detailed data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
/**
 * Set up content for Other products
 */
async function setupOtherProductContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    // Get the category folder and product folder from the image path
    // Format: products/other/Category/Product Name/image/...
    const pathParts = imagePath.split("/");
    const categoryFolder = pathParts[2]; // Category folder
    const productFolder = pathParts[3]; // Product name folder
    // Construct path to MD file
    const mdFilePath = `products/other/${categoryFolder}/${productFolder}/${productFolder}.md`;
    // Fetch the markdown file content
    const response = await fetch(mdFilePath);
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackOtherContent(product);
      return;
    }
    const mdContent = await response.text();
    // Update product description and content with the markdown content
    // For Other products, we'll use the entire markdown content as the main content
    const parsedContent = parseMarkdown(mdContent);
    // Update the product details tab content with the full markdown content
    document.querySelector(".js-product-details-content").innerHTML =
      parsedContent || "";
    // Hide compatibility and specifications sections since Other products typically don't have structured sections
    document.querySelector(".product-compatibility-section").style.display =
      "none";
    document.querySelector(".product-specifications-section").style.display =
      "none";
  } catch (error) {
    // Fallback to hardcoded content if there's an error
    setupFallbackOtherContent(product);
  }
}
/**
 * Fallback function for Other product content when markdown loading fails
 */
function setupFallbackOtherContent(product) {
  // Set minimal fallback content
  const categoryName =
    product.category.charAt(0).toUpperCase() + product.category.slice(1);
  document.querySelector(".js-product-details-content").innerHTML = `
    <h3>${product.name}</h3>
    <p>${categoryName} product for professional applications. Product information is currently being updated. Please contact us for detailed specifications.</p>
    <div class="product-specifications">
      <h4>Product Category</h4>
      <p>${categoryName}</p>
      <h4>Applications</h4>
      <p>Suitable for various professional applications.</p>
      <p><strong>Need More Information?</strong></p>
      <p>For detailed specifications, compatibility information, and application guidelines, please contact our technical team.</p>
    </div>
  `;
  // Hide sections since we don't have detailed data
  document.querySelector(".product-compatibility-section").style.display =
    "none";
  document.querySelector(".product-specifications-section").style.display =
    "none";
}
async function setupBookProductContent(product) {
  try {
    // Extract the path to the markdown file from the image path
    const imagePath = product.image;
    // Get the category folder and product folder from the image path
    // Format: products/books/Category/Product Name/image/...
    const pathParts = imagePath.split("/");
    const categoryFolder = pathParts[2]; // Category folder
    const productFolder = pathParts[3]; // Product name folder
    // Construct path to MD file - encode folder name for file system compatibility
    const encodedProductFolder = encodeURIComponent(productFolder);
    const mdFilePath = `products/books/${categoryFolder}/${encodedProductFolder}/${encodedProductFolder}.md`;
    // Try to fetch the markdown file content
    let response = await fetch(mdFilePath);
    // If that fails, try with the original folder name
    if (!response.ok) {
      const originalMdFilePath = `products/books/${categoryFolder}/${productFolder}/${productFolder}.md`;
      response = await fetch(originalMdFilePath);
    }
    if (!response.ok) {
      // Fallback to hardcoded content if markdown file is not found
      setupFallbackBookContent(product);
      return;
    }
    const mdContent = await response.text();
    // Parse book details from markdown content
    const bookDetails = parseBookMarkdownContent(
      mdContent,
      product,
      categoryFolder
    );
    // Update the product details tab content with enhanced book display
    setupEnhancedBookDisplay(bookDetails, product);
    // Show product description but customize product information for books
    document.querySelector(".product-compatibility-section").style.display =
      "block";
    document.querySelector(".product-specifications-section").style.display =
      "block";

    // Populate the product information table with book details
    populateProductInfoTable(product, bookDetails);
  } catch (error) {
    setupFallbackBookContent(product);
  }
}
// Function to populate the product information table
function populateProductInfoTable(product, bookDetails) {
  // Set UPC from the book details if available
  const upcElement = document.querySelector(".js-product-upc");

  if (bookDetails && bookDetails.productInfo && bookDetails.productInfo.upc) {
    upcElement.textContent = bookDetails.productInfo.upc;
  } else {
    // Fallback to default UPC format
    upcElement.textContent = "a8-o-Onbfa1210";
  }

  // Set product type
  document.querySelector(".js-product-type").textContent = "Books";

  // Set prices from book details if available
  const priceExclElement = document.querySelector(".js-product-price-excl-tax");
  const priceInclElement = document.querySelector(".js-product-price-incl-tax");
  const taxElement = document.querySelector(".js-product-tax");

  if (bookDetails && bookDetails.productInfo) {
    // Use prices from markdown if available
    if (bookDetails.productInfo.price_excl_tax) {
      let price = bookDetails.productInfo.price_excl_tax;
      // Ensure the price starts with $
      if (!price.startsWith("$")) {
        price = price.startsWith("£") ? price.replace("£", "$") : `$${price}`;
      }
      priceExclElement.textContent = price;
    } else if (product.lower_price) {
      priceExclElement.textContent = formatCurrency(product.lower_price);
    } else {
      priceExclElement.textContent = "$45.17";
    }

    if (bookDetails.productInfo.price_incl_tax) {
      let price = bookDetails.productInfo.price_incl_tax;
      // Ensure the price starts with $
      if (!price.startsWith("$")) {
        price = price.startsWith("£") ? price.replace("£", "$") : `$${price}`;
      }
      priceInclElement.textContent = price;
    } else if (product.lower_price) {
      priceInclElement.textContent = formatCurrency(product.lower_price);
    } else {
      priceInclElement.textContent = "$45.17";
    }

    if (bookDetails.productInfo.tax) {
      let tax = bookDetails.productInfo.tax;
      // Ensure the tax starts with $
      if (!tax.startsWith("$")) {
        tax = tax.startsWith("£") ? tax.replace("£", "$") : `$${tax}`;
      }
      taxElement.textContent = tax;
    } else {
      taxElement.textContent = "$0.00";
    }
  } else if (product.lower_price) {
    // Use product price if no book details
    const formattedPrice = formatCurrency(product.lower_price);
    priceExclElement.textContent = formattedPrice;
    priceInclElement.textContent = formattedPrice;
    taxElement.textContent = "$0.00";
  } else {
    // Use default prices if nothing else is available
    priceExclElement.textContent = "$45.17";
    priceInclElement.textContent = "$45.17";
    taxElement.textContent = "$0.00";
  }

  // Set availability from book details if available
  const availabilityElement = document.querySelector(
    ".js-product-availability"
  );
  if (
    bookDetails &&
    bookDetails.productInfo &&
    bookDetails.productInfo.availability
  ) {
    availabilityElement.textContent = bookDetails.productInfo.availability;
  } else {
    // Fallback to generated availability
    const stockNumber = product.id
      ? Math.max(
          1,
          (product.id.charCodeAt(0) + (product.id.charCodeAt(1) || 0)) % 30
        )
      : 19;
    availabilityElement.textContent = `In stock (${stockNumber} available)`;
  }

  // Set review count from book details if available and hide row if count is 0
  const reviewCountElement = document.querySelector(".js-product-review-count");
  const reviewRow = document
    .querySelector(".js-product-review-count")
    .closest("tr");

  let reviewCount = "0";
  if (
    bookDetails &&
    bookDetails.productInfo &&
    bookDetails.productInfo.reviews
  ) {
    reviewCount = bookDetails.productInfo.reviews;
  } else {
    reviewCount = product.reviewCount || "0";
  }

  // Set the text content
  reviewCountElement.textContent = reviewCount;

  // Hide the row if review count is 0
  if (reviewCount === "0" || reviewCount === 0) {
    reviewRow.style.display = "none";
  }
}
// Expose product data globally for search system
window.products = products;
window.booksProducts = booksProducts;

// Add to cart functionality
document.querySelector(".js-add-to-cart").addEventListener("click", () => {
  if (!productId) return;
  const quantitySelect = document.querySelector(".js-quantity-selector");
  const quantity = Number(quantitySelect.value);
  addToCart(productId, quantity);

  // Track add to cart analytics
  const product = [...products, ...booksProducts].find(
    (p) => p.id === productId
  );
  if (product) {
    analytics.trackAddToCart(product.name, product.category, quantity);
  }

  updateCartQuantity();
  // Show the "Added" message
  const addedMessage = document.querySelector(".js-added-message");
  addedMessage.style.opacity = "1";
  // Hide the message after 2 seconds
  setTimeout(() => {
    addedMessage.style.opacity = "0";
  }, 2000);
});
/**
 * Setup mobile touch scrolling for thumbnail gallery
 */
function setupMobileTouchScrolling(thumbnailsContainer) {
  if (!thumbnailsContainer) return;
  let touchStartX = 0;
  let touchEndX = 0;
  thumbnailsContainer.addEventListener(
    "touchstart",
    function (e) {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  thumbnailsContainer.addEventListener(
    "touchend",
    function (e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    },
    { passive: true }
  );
  function handleSwipe() {
    const touchDiff = touchStartX - touchEndX;
    // Scroll the container by the swipe distance
    thumbnailsContainer.scrollLeft += touchDiff;
  }
}
/**
 * Setup mobile-friendly image sizing
 */
function setupMobileImageSizing() {
  function adjustImageHeight() {
    const imageContainer = document.querySelector(
      ".product-main-image-container"
    );
    const image = document.querySelector(".product-image");
    if (imageContainer && image) {
      // For mobile phones in portrait mode
      if (window.innerWidth < 600 && window.innerHeight > window.innerWidth) {
        const maxHeight = window.innerHeight * 0.45; // 45% of screen height
        image.style.maxHeight = `${maxHeight}px`;
      } else if (window.innerWidth < 900) {
        // For tablets or phones in landscape
        const maxHeight = window.innerHeight * 0.65; // 65% of screen height
        image.style.maxHeight = `${maxHeight}px`;
      } else {
        // For desktop
        image.style.maxHeight = "500px";
      }
    }
  }
  // Call once on load and on resize
  adjustImageHeight();
  window.addEventListener("resize", adjustImageHeight);
  window.addEventListener("orientationchange", adjustImageHeight);
}
/**
 * Setup mobile arrow scrolling for thumbnail navigation
 */
function setupMobileArrowScrolling(leftArrow, rightArrow, thumbnailsContainer) {
  if (!leftArrow || !rightArrow || !thumbnailsContainer) return;
  const scrollAmount = 90; // Approximate width of thumbnail + margin
  // Remove existing mobile handlers to avoid duplicates
  leftArrow.removeEventListener("click", leftArrow._mobileHandler, true);
  rightArrow.removeEventListener("click", rightArrow._mobileHandler, true);
  // Create new mobile handlers
  leftArrow._mobileHandler = function (e) {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      e.stopPropagation();
      thumbnailsContainer.scrollLeft -= scrollAmount;
    }
  };
  rightArrow._mobileHandler = function (e) {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      e.stopPropagation();
      thumbnailsContainer.scrollLeft += scrollAmount;
    }
  };
  // Add mobile handlers with high priority (capture phase)
  leftArrow.addEventListener("click", leftArrow._mobileHandler, true);
  rightArrow.addEventListener("click", rightArrow._mobileHandler, true);
  // Setup mobile scroll behavior
  thumbnailsContainer.style.overflow = "hidden auto";
  thumbnailsContainer.style.scrollBehavior = "smooth";
}
// Function to extract and display document content directly for all printer products
function updateBreadcrumbDetail(product, productType, productBrand) {
  let breadcrumbElement = document.querySelector(".breadcrumb-nav");
  if (!breadcrumbElement) {
    // Create breadcrumb if it doesn't exist
    breadcrumbElement = document.createElement("div");
    breadcrumbElement.className = "breadcrumb-nav";
    const mainElement = document.querySelector(".main");
    mainElement.insertBefore(breadcrumbElement, mainElement.firstChild);
  }
  if (productType === "printhead") {
    if (
      !productBrand ||
      productBrand === "all" ||
      productBrand === "printHeads"
    ) {
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">Print Heads</span>
      `;
    } else {
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#printheads" class="breadcrumb-link">Print Heads</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#printheads-${productBrand}" class="breadcrumb-link">${
        productBrand.charAt(0).toUpperCase() + productBrand.slice(1)
      } Printheads</a>
      `;
    }
  } else if (productType === "printer") {
    // For printer products, show proper breadcrumb navigation
    if (productBrand === "dtf_printer") {
      // Check for printhead type in DTF printers
      let printheadType = "";
      let printheadLink = "";
      if (product.name.toLowerCase().includes("i3200")) {
        printheadType = "With I3200 Printhead";
        printheadLink = "index.html#dtf-i3200-printers";
      } else if (product.name.toLowerCase().includes("i1600")) {
        printheadType = "With I1600 Printhead";
        printheadLink = "index.html#dtf-i1600-printers";
      } else if (product.name.toLowerCase().includes("xp600")) {
        printheadType = "With XP600 Printhead";
        printheadLink = "index.html#dtf-xp600-printers";
      }
      if (printheadType) {
        // 6-level breadcrumb with printhead specification
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#direct-to-fabric-film" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#dtf-printers" class="breadcrumb-link">DTF Printer</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="${printheadLink}" class="breadcrumb-link">${printheadType}</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        // 5-level breadcrumb without printhead specification
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#direct-to-fabric-film" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#dtf-printers" class="breadcrumb-link">DTF Printer</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "uv_dtf") {
      // Check for printhead type in UV DTF printers
      let printheadType = "";
      let printheadLink = "";
      if (product.name.toLowerCase().includes("i3200")) {
        printheadType = "With I3200 Printhead";
        printheadLink = "index.html#uv-dtf-i3200-printers";
      } else if (product.name.toLowerCase().includes("i1600")) {
        printheadType = "With I1600 Printhead";
        printheadLink = "index.html#uv-dtf-i1600-printers";
      } else if (product.name.toLowerCase().includes("xp600")) {
        printheadType = "With XP600 Printhead";
        printheadLink = "index.html#uv-dtf-xp600-printers";
      }
      if (printheadType) {
        // 6-level breadcrumb with printhead specification
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#direct-to-fabric-film" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-dtf-printer" class="breadcrumb-link">UV DTF Printer</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="${printheadLink}" class="breadcrumb-link">${printheadType}</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        // 5-level breadcrumb without printhead specification
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#direct-to-fabric-film" class="breadcrumb-link">Direct to Fabric & Film</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-dtf-printer" class="breadcrumb-link">UV DTF Printer</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "sublimation") {
      // Check for printhead type in sublimation printers
      let printheadType = "";
      let printheadLink = "";
      let sublimationCategory = "Sublimation Printers";
      if (product.name.toLowerCase().includes("i3200")) {
        printheadType = "With I3200 Printhead";
        printheadLink = "index.html#sublimation-i3200-printers";
      } else if (product.name.toLowerCase().includes("i1600")) {
        printheadType = "With I1600 Printhead";
        printheadLink = "index.html#sublimation-i1600-printers";
      } else if (product.name.toLowerCase().includes("xp600")) {
        printheadType = "With XP600 Printhead";
        printheadLink = "index.html#sublimation-xp600-printers";
      }
      if (printheadType) {
        // 5-level breadcrumb with printhead specification
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#sublimation-printers" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="${printheadLink}" class="breadcrumb-link">${printheadType}</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        // 4-level breadcrumb without printhead specification
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#sublimation-printers" class="breadcrumb-link">Sublimation Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "solvent") {
      // Determine specific printhead type for breadcrumb
      let printheadLink = "index.html#solvent-inkjet-printers";
      let printheadText = "Solvent Inkjet Printers";
      if (
        product.name.toLowerCase().includes("512i") ||
        product.name.toLowerCase().includes("km512i")
      ) {
        printheadLink = "index.html#solvent-km512i-printers";
        printheadText = "With Konica KM512i Printhead";
      } else if (
        product.name.toLowerCase().includes("1024i") ||
        product.name.toLowerCase().includes("km1024i")
      ) {
        printheadLink = "index.html#solvent-km1024i-printers";
        printheadText = "With Konica KM1024i Printhead";
      } else if (
        product.name.toLowerCase().includes("gen5") ||
        product.name.toLowerCase().includes("ricoh gen5")
      ) {
        printheadLink = "index.html#solvent-ricoh-gen5-printers";
        printheadText = "With Ricoh Gen5 Printhead";
      } else if (
        product.name.toLowerCase().includes("gen6") ||
        product.name.toLowerCase().includes("ricoh gen6")
      ) {
        printheadLink = "index.html#solvent-ricoh-gen6-printers";
        printheadText = "With Ricoh Gen6 Printhead";
      }
      if (printheadText === "Solvent Inkjet Printers") {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#solvent-inkjet-printers" class="breadcrumb-link">Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#solvent-inkjet-printers" class="breadcrumb-link">Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="${printheadLink}" class="breadcrumb-link">${printheadText}</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "double_side") {
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#double-side-printers" class="breadcrumb-link">Double Side Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#double-side-printers---direct-printing" class="breadcrumb-link">Direct Printing</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">${product.name}</span>
      `;
    } else if (productBrand === "hybrid_uv") {
      // Check if the product has specific printhead
      if (
        product.name.toLowerCase().includes("konica") &&
        (product.name.toLowerCase().includes("km1024i") ||
          product.name.toLowerCase().includes("k24i") ||
          product.name.toLowerCase().includes("1024i"))
      ) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-hybrid-inkjet-printers" class="breadcrumb-link">Hybrid UV Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-hybrid-konica-km1024i-printers" class="breadcrumb-link">With Konica KM1024i Printhead</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else if (
        product.name.toLowerCase().includes("ricoh") &&
        (product.name.toLowerCase().includes("gen6") ||
          product.name.toLowerCase().includes("g6"))
      ) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-hybrid-inkjet-printers" class="breadcrumb-link">Hybrid UV Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-hybrid-ricoh-gen6-printers" class="breadcrumb-link">With Ricoh Gen6 Printhead</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        // Default hybrid UV breadcrumb
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-hybrid-inkjet-printers" class="breadcrumb-link">Hybrid UV Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "uv_flatbed") {
      // Check if the product has XP600 printhead
      if (product.name.toLowerCase().includes("xp600")) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#xp600-printhead" class="breadcrumb-link">XP600 Printhead</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else if (
        product.name.toLowerCase().includes("ricoh gen5") ||
        product.name.toLowerCase().includes("gen5")
      ) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#ricoh-gen5" class="breadcrumb-link">Ricoh Gen5</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else if (
        product.name.toLowerCase().includes("ricoh gen6") ||
        product.name.toLowerCase().includes("gen6")
      ) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers---with-konica-ricoh-gen6-printhead" class="breadcrumb-link">With Konica Ricoh Gen6 Printhead</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else if (
        product.name.toLowerCase().includes("konica 1024i") ||
        product.name.toLowerCase().includes("km1024i") ||
        product.name.toLowerCase().includes("k24i")
      ) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-konica-km1024i-printers" class="breadcrumb-link">With Konica KM1024i Printhead</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "amo_uv_inkjet") {
      // Check if the product has XP600 printhead
      if (product.name.toLowerCase().includes("xp600")) {
        // Check if this is a flatbed printer
        if (product.name.toLowerCase().includes("flatbed")) {
          breadcrumbElement.innerHTML = `
            <a href="index.html" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#xp600-printhead" class="breadcrumb-link">XP600 Printhead</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">${product.name}</span>
          `;
        } else {
          breadcrumbElement.innerHTML = `
            <a href="index.html" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-inkjet-printers" class="breadcrumb-link">UV Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#xp600-printhead" class="breadcrumb-link">XP600 Printhead</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">${product.name}</span>
          `;
        }
      } else if (
        product.name.toLowerCase().includes("ricoh gen5") ||
        product.name.toLowerCase().includes("gen5")
      ) {
        // Check if this is a flatbed printer
        if (product.name.toLowerCase().includes("flatbed")) {
          breadcrumbElement.innerHTML = `
            <a href="index.html" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#ricoh-gen5" class="breadcrumb-link">Ricoh Gen5</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">${product.name}</span>
          `;
        } else {
          breadcrumbElement.innerHTML = `
            <a href="index.html" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-inkjet-printers" class="breadcrumb-link">UV Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#ricoh-gen5" class="breadcrumb-link">Ricoh Gen5</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">${product.name}</span>
          `;
        }
      } else if (
        product.name.toLowerCase().includes("ricoh gen6") ||
        product.name.toLowerCase().includes("gen6")
      ) {
        // Check if this is a flatbed printer
        if (product.name.toLowerCase().includes("flatbed")) {
          breadcrumbElement.innerHTML = `
            <a href="index.html" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-flatbed-printers" class="breadcrumb-link">UV Flatbed Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-flatbed-printers---with-konica-ricoh-gen6-printhead" class="breadcrumb-link">With Konica Ricoh Gen6 Printhead</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">${product.name}</span>
          `;
        } else {
          breadcrumbElement.innerHTML = `
            <a href="index.html" class="breadcrumb-link">Home</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-inkjet-printers" class="breadcrumb-link">UV Inkjet Printers</a>
            <span class="breadcrumb-separator">&gt;</span>
            <a href="index.html#uv-inkjet-printers---with-ricoh-gen6-printhead" class="breadcrumb-link">With Ricoh Gen6 Printhead</a>
            <span class="breadcrumb-separator">&gt;</span>
            <span class="breadcrumb-current">${product.name}</span>
          `;
        }
      } else if (
        product.name.toLowerCase().includes("konica 1024i") ||
        product.name.toLowerCase().includes("km1024i") ||
        product.name.toLowerCase().includes("k24i")
      ) {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-inkjet-printers" class="breadcrumb-link">UV Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-konica-km1024i-printers" class="breadcrumb-link">With Konica KM1024i Printhead</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#uv-inkjet-printers" class="breadcrumb-link">UV Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "economic_version") {
      // Check the printhead type from the product name to show correct breadcrumb
      let printheadType = "";
      let printheadLink = "";
      if (product.name.toLowerCase().includes("xp600")) {
        printheadType = "With XP600 Printhead";
        printheadLink = "index.html#eco-solvent-xp600-printers";
      } else if (product.name.toLowerCase().includes("i1600")) {
        printheadType = "With I1600 Printhead";
        printheadLink = "index.html#eco-solvent-i1600-printers";
      } else if (product.name.toLowerCase().includes("i3200")) {
        printheadType = "With I3200 Printhead";
        printheadLink = "index.html#eco-solvent-i3200-printers";
      } else {
        // Fallback to generic eco-solvent
        printheadType = "Economic Version Printers";
        printheadLink = "index.html#economic-version-printers";
      }
      if (printheadType === "Economic Version Printers") {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="${printheadLink}" class="breadcrumb-link">${printheadType}</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      } else {
        breadcrumbElement.innerHTML = `
          <a href="index.html" class="breadcrumb-link">Home</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="index.html#inkjetprinters-ecosolvent" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
          <span class="breadcrumb-separator">&gt;</span>
          <a href="${printheadLink}" class="breadcrumb-link">${printheadType}</a>
          <span class="breadcrumb-separator">&gt;</span>
          <span class="breadcrumb-current">${product.name}</span>
        `;
      }
    } else if (productBrand === "eco-solvent-xp600") {
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjetprinters-ecosolvent" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#eco-solvent-xp600-printers" class="breadcrumb-link">With XP600 Printhead</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">${product.name}</span>
      `;
    } else if (productBrand === "eco-solvent-i3200") {
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjetprinters-ecosolvent" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#eco-solvent-i3200-printers" class="breadcrumb-link">With I3200 Printhead</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">${product.name}</span>
      `;
    } else if (productBrand === "eco-solvent-i1600") {
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjetprinters-ecosolvent" class="breadcrumb-link">Eco-Solvent Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#eco-solvent-i1600-printers" class="breadcrumb-link">With I1600 Printhead</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">${product.name}</span>
      `;
    } else {
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#inkjet-printers" class="breadcrumb-link">Inkjet Printers</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">${product.name}</span>
      `;
    }
  } else if (productType === "printsparepart") {
    // For print spare parts, show proper breadcrumb navigation based on brand
    const brandName =
      product.brand.charAt(0).toUpperCase() + product.brand.slice(1);
    const brandSlug = product.brand.toLowerCase() + "-printer-spare-parts";
    breadcrumbElement.innerHTML = `
      <a href="index.html" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#print-spare-parts" class="breadcrumb-link">Print Spare Parts</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#${brandSlug}" class="breadcrumb-link">${brandName} Printer Spare Parts</a>      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${product.name}</span>
    `;
  } else if (productType === "upgradingkit") {
    // For upgrading kit products, show proper breadcrumb navigation based on brand
    const brandName =
      product.brand.charAt(0).toUpperCase() +
      product.brand.slice(1).replace(/_/g, " ");
    breadcrumbElement.innerHTML = `
      <a href="index.html" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#upgrading-kit" class="breadcrumb-link">Upgrading Kit</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#upgrading-kit-${product.brand}" class="breadcrumb-link">${brandName} Products</a>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${product.name}</span>
    `;
  } else if (productType === "material") {
    // For material products, show proper breadcrumb navigation based on category
    const categoryName =
      product.category.charAt(0).toUpperCase() + product.category.slice(1);
    breadcrumbElement.innerHTML = `
      <a href="index.html" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#material" class="breadcrumb-link">Material</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#material-${product.category}" class="breadcrumb-link">${categoryName} Materials</a>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${product.name}</span>
    `;
  } else if (productType === "ledlcd" || productType === "led-lcd") {
    // For LED & LCD products, show proper breadcrumb navigation based on category
    const categoryName =
      product.category.charAt(0).toUpperCase() + product.category.slice(1);
    breadcrumbElement.innerHTML = `
      <a href="index.html" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#led-lcd" class="breadcrumb-link">LED & LCD</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#led-lcd-${product.category}" class="breadcrumb-link">${categoryName} LED & LCD</a>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${product.name}</span>
    `;
  } else if (
    productType === "channelletter" ||
    productType === "channel-letter"
  ) {
    // For Channel Letter products, show proper breadcrumb navigation based on category
    const categoryName =
      product.category.charAt(0).toUpperCase() + product.category.slice(1);
    breadcrumbElement.innerHTML = `
      <a href="index.html" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#channel-letter" class="breadcrumb-link">Channel Letter</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#channel-letter-${product.category}" class="breadcrumb-link">${categoryName} Channel Letter</a>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${product.name}</span>
    `;
  } else if (productType === "other") {
    // For Other products, show proper breadcrumb navigation based on category
    const categoryName =
      product.category.charAt(0).toUpperCase() + product.category.slice(1);
    breadcrumbElement.innerHTML = `
      <a href="index.html" class="breadcrumb-link">Home</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#other" class="breadcrumb-link">Other</a>
      <span class="breadcrumb-separator">&gt;</span>
      <a href="index.html#other-${product.category}" class="breadcrumb-link">${categoryName} Products</a>
      <span class="breadcrumb-separator">&gt;</span>
      <span class="breadcrumb-current">${product.name}</span>
    `;
  } else if (productType === "book" || productType === "books") {
    // For book products, show proper hierarchical breadcrumb navigation
    // Map category names to display names and their parent categories
    const categoryDisplayMap = {
      academic: "Academic",
      add_a_comment: "Add a comment",
      adult_fiction: "Adult Fiction",
      art: "Art",
      autobiography: "Autobiography",
      biography: "Biography",
      business: "Business",
      childrens: "Children's",
      christian: "Christian",
      christian_fiction: "Christian Fiction",
      classics: "Classics",
      contemporary: "Contemporary",
      crime: "Crime",
      cultural: "Cultural",
      default: "Default",
      erotica: "Erotica",
      fantasy: "Fantasy",
      fiction: "Fiction",
      food_and_drink: "Food and Drink",
      health: "Health",
      historical: "Historical",
      historical_fiction: "Historical Fiction",
      history: "History",
      horror: "Horror",
      humor: "Humor",
      music: "Music",
      mystery: "Mystery",
      new_adult: "New Adult",
      novels: "Novels",
      paranormal: "Paranormal",
      philosophy: "Philosophy",
      poetry: "Poetry",
      politics: "Politics",
      psychology: "Psychology",
      religion: "Religion",
      romance: "Romance",
      science: "Science",
      science_fiction: "Science Fiction",
      self_help: "Self Help",
      sequential_art: "Sequential Art",
      short_stories: "Short Stories",
      spirituality: "Spirituality",
      sports_and_games: "Sports and Games",
      suspense: "Suspense",
      thriller: "Thriller",
      travel: "Travel",
      womens_fiction: "Women's Fiction",
      young_adult: "Young Adult",
    };
    // Define parent-child relationships for breadcrumb navigation
    const categoryHierarchy = {
      // Second-level categories under Fiction
      classics: "Fiction",
      contemporary: "Fiction",
      crime: "Fiction",
      erotica: "Fiction",
      fantasy: "Fiction",
      historical_fiction: "Fiction",
      horror: "Fiction",
      mystery: "Fiction",
      novels: "Fiction",
      paranormal: "Fiction",
      romance: "Fiction",
      science_fiction: "Fiction",
      short_stories: "Fiction",
      suspense: "Fiction",
      thriller: "Fiction",
      womens_fiction: "Fiction",
      // Second-level categories under Children & Young Adult
      childrens: "Children & Young Adult",
      young_adult: "Children & Young Adult",
      new_adult: "Children & Young Adult",
      // Second-level categories under Academic & Educational
      academic: "Academic & Educational",
      // Second-level categories under Arts & Culture
      art: "Arts & Culture",
      sequential_art: "Arts & Culture",
      music: "Arts & Culture",
      cultural: "Arts & Culture",
      // Second-level categories under Health & Self-Help
      health: "Health & Self-Help",
      self_help: "Health & Self-Help",
      psychology: "Health & Self-Help",
      // Second-level categories under Religion & Spirituality
      religion: "Religion & Spirituality",
      christian: "Religion & Spirituality",
      christian_fiction: "Religion & Spirituality",
      spirituality: "Religion & Spirituality",
      philosophy: "Religion & Spirituality",
      // Second-level categories under Business & Politics
      business: "Business & Politics",
      politics: "Business & Politics",
      // Second-level categories under Science & Technology
      science: "Science & Technology",
      // Second-level categories under Biography & History
      biography: "Biography & History",
      autobiography: "Biography & History",
      history: "Biography & History",
      historical: "Biography & History",
      // Second-level categories under Poetry & Literature
      poetry: "Poetry & Literature",
      // Second-level categories under Specialty Genres
      humor: "Specialty Genres",
      sports_and_games: "Specialty Genres",
      food_and_drink: "Specialty Genres",
      travel: "Specialty Genres",
      adult_fiction: "Specialty Genres",
      default: "Specialty Genres",
      add_a_comment: "Specialty Genres",
    };
    const currentCategory = product.category;
    const displayName = categoryDisplayMap[currentCategory] || currentCategory;
    const parentCategory = categoryHierarchy[currentCategory];
    if (parentCategory) {
      // Second-level category - show Home > Parent > Current
      const parentSlug = parentCategory
        .toLowerCase()
        .replace(/&/g, "")
        .replace(/'/g, "")
        .replace(/\s+/g, "-");
      const currentSlug = displayName
        .toLowerCase()
        .replace(/&/g, "")
        .replace(/'/g, "")
        .replace(/\s+/g, "-");
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#${parentSlug}" class="breadcrumb-link">${parentCategory}</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#${currentSlug}" class="breadcrumb-link">${displayName}</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">${product.name}</span>
      `;
    } else {
      // First-level category - show Home > Current
      const currentSlug = displayName
        .toLowerCase()
        .replace(/&/g, "")
        .replace(/'/g, "")
        .replace(/\s+/g, "-");
      breadcrumbElement.innerHTML = `
        <a href="index.html" class="breadcrumb-link">Home</a>
        <span class="breadcrumb-separator">&gt;</span>
        <a href="index.html#${currentSlug}" class="breadcrumb-link">${displayName}</a>
        <span class="breadcrumb-separator">&gt;</span>
        <span class="breadcrumb-current">${product.name}</span>
      `;
    }
  } else {
    // For regular products, show category, subcategory, brand if available
    let html = `<a href="index.html" class="breadcrumb-link">Home</a>`;
    if (product.category) {
      html += `<span class="breadcrumb-separator">&gt;</span><a href="index.html#${product.category
        .toLowerCase()
        .replace(/\s+/g, "-")}", class="breadcrumb-link">${
        product.category
      }</a>`;
    }
    if (product.subcategory) {
      html += `<span class="breadcrumb-separator">&gt;</span><a href="index.html#${product.subcategory
        .toLowerCase()
        .replace(/\s+/g, "-")}", class="breadcrumb-link">${
        product.subcategory
      }</a>`;
    }
    if (product.brand) {
      html += `<span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">${product.brand}</span>`;
    }
    breadcrumbElement.innerHTML = html;
  }
}
/**
 * Setup image magnifier functionality for the main product image
 */
function setupImageMagnifier() {
  const productImage = document.querySelector(".js-product-image");
  const imageContainer = document.querySelector(
    ".product-main-image-container"
  );
  if (!productImage || !imageContainer) return;
  // Remove existing magnifier elements
  cleanupMagnifier();
  // Create magnifier container wrapper
  const magnifierContainer = document.createElement("div");
  magnifierContainer.className = "image-magnifier-container";
  // Wrap the image with the magnifier container
  productImage.parentNode.insertBefore(magnifierContainer, productImage);
  magnifierContainer.appendChild(productImage);
  // Create lens element
  const lens = document.createElement("div");
  lens.className = "magnifier-lens";
  magnifierContainer.appendChild(lens);
  // Create result element (magnified view)
  const result = document.createElement("div");
  result.className = "magnifier-result";
  document.body.appendChild(result);
  // Setup hover-activated magnifier functionality
  magnifierContainer.addEventListener("mouseenter", () => {
    magnifierContainer.classList.add("magnifying");
  });
  magnifierContainer.addEventListener("mouseleave", () => {
    magnifierContainer.classList.remove("magnifying");
    lens.style.display = "none";
    result.style.display = "none";
  });
  magnifierContainer.addEventListener("mousemove", (e) => {
    const rect = productImage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Check if mouse is within image bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      lens.style.display = "none";
      result.style.display = "none";
      return;
    }
    showMagnifiedView(x, y, rect);
  });
  // Mobile touch support
  magnifierContainer.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = productImage.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    // Check if touch is within image bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      lens.style.display = "none";
      result.style.display = "none";
      return;
    }
    showMagnifiedView(x, y, rect);
  });
  magnifierContainer.addEventListener("touchend", () => {
    lens.style.display = "none";
    result.style.display = "none";
  });
  function showMagnifiedView(x, y, imageRect) {
    // Calculate lens dimensions based on screen size - make larger for better visibility
    const isMobile = window.innerWidth <= 768;
    const lensWidth = isMobile ? 120 : 150; // Larger rectangular lens
    const lensHeight = isMobile ? 120 : 150;
    const resultSize = isMobile ? 280 : 400; // Much larger result window
    // Position lens with boundary checking
    let lensX = x - lensWidth / 2;
    let lensY = y - lensHeight / 2;
    // Keep lens within image bounds
    lensX = Math.max(0, Math.min(lensX, imageRect.width - lensWidth));
    lensY = Math.max(0, Math.min(lensY, imageRect.height - lensHeight));
    lens.style.width = lensWidth + "px";
    lens.style.height = lensHeight + "px";
    lens.style.left = lensX + "px";
    lens.style.top = lensY + "px";
    lens.style.display = "block";
    // Position and size result window
    result.style.width = resultSize + "px";
    result.style.height = resultSize + "px";
    // Position result window based on cursor/touch position
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let resultX, resultY;
    if (isMobile) {
      // Smart positioning for mobile - avoid covering the original image
      resultX = viewportWidth - resultSize - 15;
      // Determine if we should place magnifier at top or bottom based on image position
      const imageTop = imageRect.top;
      const imageBottom = imageRect.bottom;
      const imageCenterY = imageTop + imageRect.height / 2;
      const viewportCenter = viewportHeight / 2;
      if (imageCenterY < viewportCenter) {
        // Image is in upper half - place magnifier at bottom
        resultY = viewportHeight - resultSize - 15;
      } else {
        // Image is in lower half - place magnifier at top
        resultY = 15; // Small margin from top
      }
      // Ensure the magnifier doesn't overlap with the image vertically
      if (resultY < imageBottom && resultY + resultSize > imageTop) {
        // If there's overlap, prefer bottom placement if there's more space
        const spaceAbove = imageTop;
        const spaceBelow = viewportHeight - imageBottom;
        if (spaceBelow >= resultSize + 30) {
          resultY = imageBottom + 15; // Place below image
        } else if (spaceAbove >= resultSize + 30) {
          resultY = imageTop - resultSize - 15; // Place above image
        } else {
          // Not enough space on either side, use bottom of screen
          resultY = viewportHeight - resultSize - 15;
        }
      }
    } else {
      // Smart positioning for desktop - always avoid covering the original image
      const imageRightEdge = imageRect.right;
      const imageLeftEdge = imageRect.left;
      const availableSpaceRight = viewportWidth - imageRightEdge;
      const availableSpaceLeft = imageLeftEdge;
      if (availableSpaceRight >= resultSize + 20) {
        // Position to the right of the image
        resultX = imageRightEdge + 15;
        resultY = imageRect.top + (y - resultSize / 2);
      } else if (availableSpaceLeft >= resultSize + 20) {
        // Position to the left of the image
        resultX = imageLeftEdge - resultSize - 15;
        resultY = imageRect.top + (y - resultSize / 2);
      } else {
        // Not enough horizontal space, try vertical positioning
        const spaceAbove = imageRect.top;
        const spaceBelow = viewportHeight - imageRect.bottom;
        if (spaceBelow >= resultSize + 20) {
          // Position below the image
          resultX = Math.max(
            10,
            Math.min(
              viewportWidth - resultSize - 10,
              imageRect.left + imageRect.width / 2 - resultSize / 2
            )
          );
          resultY = imageRect.bottom + 15;
        } else if (spaceAbove >= resultSize + 20) {
          // Position above the image
          resultX = Math.max(
            10,
            Math.min(
              viewportWidth - resultSize - 10,
              imageRect.left + imageRect.width / 2 - resultSize / 2
            )
          );
          resultY = imageRect.top - resultSize - 15;
        } else {
          // Fallback: position to the right with overlap if necessary
          resultX = imageRightEdge + 15;
          resultY = imageRect.top + (y - resultSize / 2);
        }
      }
      // Final boundary checks to ensure result window stays within viewport
      resultX = Math.max(
        10,
        Math.min(resultX, viewportWidth - resultSize - 10)
      );
      resultY = Math.max(
        10,
        Math.min(resultY, viewportHeight - resultSize - 10)
      );
    }
    result.style.left = resultX + "px";
    result.style.top = resultY + "px";
    result.style.display = "block";
    // Calculate magnified image position - improved calculation
    const magnifyFactor = 3.0; // Higher magnification level for better detail viewing
    // Calculate the position of the lens relative to the actual mouse position
    const actualLensX = lensX + lensWidth / 2;
    const actualLensY = lensY + lensHeight / 2;
    result.style.backgroundImage = `url('${productImage.src}')`;
    result.style.backgroundSize =
      imageRect.width * magnifyFactor +
      "px " +
      imageRect.height * magnifyFactor +
      "px";
    // Position the background to show the magnified area
    const bgX = -(actualLensX * magnifyFactor) + resultSize / 2;
    const bgY = -(actualLensY * magnifyFactor) + resultSize / 2;
    result.style.backgroundPosition = bgX + "px " + bgY + "px";
  }
}
/**
 * Clean up existing magnifier elements
 */
function cleanupMagnifier() {
  // Remove any existing magnifier elements
  const existingResult = document.querySelector(".magnifier-result");
  if (existingResult) {
    existingResult.remove();
  }
  const existingContainer = document.querySelector(
    ".image-magnifier-container"
  );
  if (existingContainer) {
    const productImage = existingContainer.querySelector(".js-product-image");
    const imageContainer = document.querySelector(
      ".product-main-image-container"
    );
    if (productImage && imageContainer) {
      imageContainer.appendChild(productImage);
      existingContainer.remove();
    }
  }
  window.imageMagnifier = false;
}
// Clean up magnifier when page is unloaded
window.addEventListener("beforeunload", cleanupMagnifier);

/**
 * Parse markdown content from book markdown file
 */
function parseBookMarkdownContent(mdContent, product, categoryName) {
  // Extract sections from markdown
  const sections = {
    description: "",
    about_author: "",
    details: "",
  };

  // Extract product information
  const productInfo = {
    upc: "",
    price_excl_tax: "",
    price_incl_tax: "",
    tax: "",
    availability: "",
    reviews: "0",
  };

  // Simple parsing of markdown sections and product info
  let currentSection = "description";
  const lines = mdContent.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip price lines in the format "Price: USD:$XX.XX-$XX.XX" from description
    if (
      line.toLowerCase().startsWith("price:") &&
      line.toLowerCase().includes("usd:$")
    ) {
      continue;
    }

    // Skip "Product Type: Books" line
    if (
      line.toLowerCase().startsWith("product type:") ||
      line.match(/^product\s+type\s*:\s*books\s*$/i)
    ) {
      continue;
    }

    // Look for UPC information
    if (
      line.toLowerCase().includes("upc") ||
      line.toLowerCase().includes("isbn")
    ) {
      // Use a more specific regex to capture the UPC value after the colon
      const upcMatch = line.match(/(?:UPC|ISBN):\s*([\w\d-]+)/i);
      if (upcMatch && upcMatch[1]) {
        productInfo.upc = upcMatch[1].trim();
      } else {
        // Fallback to the previous method if the format is different
        const generalMatch = line.match(/[a-z\d-]+$/i);
        if (generalMatch) {
          productInfo.upc = generalMatch[0].trim();
        }
      }
      continue;
    }

    // Look for price information
    if (
      line.toLowerCase().includes("price") &&
      line.toLowerCase().includes("excl")
    ) {
      // Try to match price with format "Price (excl. tax): $16.16"
      const priceMatch = line.match(
        /Price\s*\(excl\.\s*tax\):\s*([\$£]?\s?\d+\.\d+)/i
      );
      if (priceMatch && priceMatch[1]) {
        productInfo.price_excl_tax = priceMatch[1].trim();
      } else {
        // Fallback to more general price match
        const generalMatch = line.match(/[\$£]?\s?(\d+\.\d+)/);
        if (generalMatch) {
          productInfo.price_excl_tax = generalMatch[0].trim();
        }
      }
      continue;
    }

    if (
      line.toLowerCase().includes("price") &&
      line.toLowerCase().includes("incl")
    ) {
      // Try to match price with format "Price (incl. tax): $16.16"
      const priceMatch = line.match(
        /Price\s*\(incl\.\s*tax\):\s*([\$£]?\s?\d+\.\d+)/i
      );
      if (priceMatch && priceMatch[1]) {
        productInfo.price_incl_tax = priceMatch[1].trim();
      } else {
        // Fallback to more general price match
        const generalMatch = line.match(/[\$£]?\s?(\d+\.\d+)/);
        if (generalMatch) {
          productInfo.price_incl_tax = generalMatch[0].trim();
        }
      }
      continue;
    }

    // Look for tax information
    if (
      line.toLowerCase().includes("tax") &&
      !line.toLowerCase().includes("price")
    ) {
      // Try to match tax with format "Tax: $0.00"
      const taxMatch = line.match(/Tax:\s*([\$£]?\s?\d+\.\d+)/i);
      if (taxMatch && taxMatch[1]) {
        productInfo.tax = taxMatch[1].trim();
      } else {
        // Fallback to more general tax match
        const generalMatch = line.match(/[\$£]?\s?(\d+\.\d+)/);
        if (generalMatch) {
          productInfo.tax = generalMatch[0].trim();
        }
      }
      continue;
    }

    // Look for availability information
    if (
      line.toLowerCase().includes("availability") ||
      line.toLowerCase().includes("in stock")
    ) {
      // Try to match "Availability: In stock (1 available)"
      const availMatch = line.match(
        /Availability:\s*In\s*stock\s*\((\d+)\s*available\)/i
      );
      if (availMatch && availMatch[1]) {
        productInfo.availability = `In stock (${availMatch[1]} available)`;
      } else {
        // Try a more general match for "In stock (X available)"
        const generalMatch = line.match(/In\s*stock\s*\((\d+)\s*available\)/i);
        if (generalMatch && generalMatch[1]) {
          productInfo.availability = `In stock (${generalMatch[1]} available)`;
        } else if (line.toLowerCase().includes("in stock")) {
          productInfo.availability = "In stock";
        }
      }
      continue;
    }

    // Look for review information
    if (line.toLowerCase().includes("review")) {
      // Try to match "Number of reviews: 0" format
      const reviewMatch = line.match(/Number\s*of\s*reviews:\s*(\d+)/i);
      if (reviewMatch && reviewMatch[1]) {
        productInfo.reviews = reviewMatch[1];
      } else {
        // Fallback to matching any number in a line with "review"
        const generalMatch = line.match(/\d+/);
        if (generalMatch) {
          productInfo.reviews = generalMatch[0];
        }
      }
      continue;
    }

    if (line.startsWith("# ") || line.startsWith("## ")) {
      // Identify sections based on headings
      const heading = line.replace(/^#+\s+/, "").toLowerCase();

      if (heading.includes("author") || heading.includes("about the author")) {
        currentSection = "about_author";
        continue;
      } else if (
        heading.includes("details") ||
        heading.includes("information")
      ) {
        currentSection = "details";
        continue;
      } else if (
        heading.includes("description") ||
        heading.includes("summary")
      ) {
        currentSection = "description";
        continue;
      }
    }

    // Add content to current section (skip price information, product details line, and product type line)
    if (
      !line.toLowerCase().startsWith("price:") &&
      line !== "Product Details:" &&
      line !== "product details:" &&
      !line.toLowerCase().startsWith("product type:") &&
      !line.match(/^product\s+type\s*:\s*books\s*$/i)
    ) {
      sections[currentSection] += line + "\n";
    }
  }

  // Clean up extra whitespace
  for (const key in sections) {
    sections[key] = sections[key].trim();
  }

  // If description is empty, use the product description or name as fallback
  if (!sections.description) {
    sections.description =
      product.description || `${product.name} - ${categoryName}`;
  }

  // If no UPC found in markdown, leave it empty - we'll use the one from the product data
  // This ensures we always prioritize the markdown UPC

  return {
    title: product.name,
    category: categoryName,
    description: sections.description,
    about_author: sections.about_author,
    details: sections.details,
    productInfo: productInfo,
  };
}

/**
 * Setup enhanced display for book products
 */
function setupEnhancedBookDisplay(bookDetails, product) {
  // Add book-specific container class
  const detailGrid = document.querySelector(".product-detail-grid");
  if (detailGrid) {
    detailGrid.classList.add("book-detail-container");
  }

  // Format the book description
  const descriptionHTML = parseMarkdown(bookDetails.description);

  // Set product description content
  document.querySelector(".js-product-compatibility").innerHTML =
    descriptionHTML;

  // Set up the author info and details if available
  let detailsHTML = "";

  if (bookDetails.about_author) {
    detailsHTML += `
      <div class="book-additional-info">
        <h3>About the Author</h3>
        <div class="book-info-content">
          ${parseMarkdown(bookDetails.about_author)}
        </div>
      </div>
    `;
  }

  if (bookDetails.details) {
    detailsHTML += `
      <div class="book-additional-info">
        <h3>Book Details</h3>
        <div class="book-info-content">
          ${parseMarkdown(bookDetails.details)}
        </div>
      </div>
    `;
  }

  // Set the details content
  document.querySelector(".js-product-details-content").innerHTML = detailsHTML;

  // Hide the standard product description section for books to avoid duplication
  document.querySelector(".js-product-description").style.display = "none";

  // Update image styling to book-specific class
  const productImage = document.querySelector(".js-product-image");
  if (productImage) {
    productImage.classList.add("book-cover-image");
  }
}

/**
 * Fallback function for book content when markdown loading fails
 */
function setupFallbackBookContent(product) {
  // Get category name
  let categoryName = "Fiction";
  if (product.image) {
    const pathParts = product.image.split("/");
    if (pathParts.length > 2) {
      categoryName = pathParts[2];
    }
  }

  // Create a basic description
  const descriptionHTML = `
    <p>"${
      product.name
    }" is a ${categoryName.toLowerCase()} book that promises an engaging reading experience. 
    This book is part of our ${categoryName} collection.</p>
    <p>For more details about this book, including reviews and availability, please contact us.</p>
  `;

  // Set up basic display
  document.querySelector(".js-product-compatibility").innerHTML =
    descriptionHTML;
  document.querySelector(".js-product-details-content").innerHTML = "";

  // Hide the standard product description to avoid duplication
  document.querySelector(".js-product-description").style.display = "none";

  // Show product information table and populate it
  document.querySelector(".product-compatibility-section").style.display =
    "block";
  document.querySelector(".product-specifications-section").style.display =
    "block";

  // Populate the product information table with book details - passing null for bookDetails to use defaults
  populateProductInfoTable(product, null);

  // Add book-specific styling
  const detailGrid = document.querySelector(".product-detail-grid");
  if (detailGrid) {
    detailGrid.classList.add("book-detail-container");
  }

  // Update image styling
  const productImage = document.querySelector(".js-product-image");
  if (productImage) {
    productImage.classList.add("book-cover-image");
  }
}

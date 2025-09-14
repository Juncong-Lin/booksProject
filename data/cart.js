let cart;

// Safe initialization of cart from localStorage with error handling
function initializeCart() {
  try {
    const cartData = localStorage.getItem("cart");
    if (cartData) {
      const parsedCart = JSON.parse(cartData);
      // Validate cart structure
      if (Array.isArray(parsedCart)) {
        cart = parsedCart.filter(
          (item) =>
            item &&
            typeof item.productId === "string" &&
            typeof item.quantity === "number" &&
            item.quantity > 0
        );
      } else {
        cart = [];
      }
    } else {
      cart = [];
    }
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    cart = [];
  }

  // Save cleaned cart back to storage
  saveToStorage();
}

// Initialize cart
initializeCart();

export { cart };

// Function to clear the cart (useful for testing)
export function clearCart() {
  cart.length = 0; // Clear array contents instead of reassigning
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Function to remove invalid items from cart
export function cleanInvalidItems(validProductIds) {
  const originalLength = cart.length;
  for (let i = cart.length - 1; i >= 0; i--) {
    if (!validProductIds.includes(cart[i].productId)) {
      cart.splice(i, 1);
    }
  }
  if (cart.length !== originalLength) {
    saveToStorage();
  }
}

function saveToStorage() {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));

    // Dispatch custom event for cart updates
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: {
          cartSize: cart.length,
          totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        },
      })
    );
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
    // Show user notification
    showCartError("Unable to save cart. Your changes may be lost.");
  }
}

function showCartError(message) {
  // Create or update error notification
  let errorDiv = document.querySelector(".cart-error-notification");
  if (!errorDiv) {
    errorDiv = document.createElement("div");
    errorDiv.className = "cart-error-notification";
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: -f44336;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(errorDiv);
  }

  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (errorDiv) {
      errorDiv.style.display = "none";
    }
  }, 5000);
}

export function addToCart(productId, quantity = 1, source = "unknown") {
  try {
    // Validate inputs
    if (!productId || typeof productId !== "string") {
      showCartError("Invalid product ID");
      return false;
    }

    if (!quantity || quantity < 1 || quantity > 99) {
      showCartError("Invalid quantity (must be 1-99)");
      return false;
    }

    let matchingItem;
    cart.forEach((cartItem) => {
      if (productId === cartItem.productId) {
        matchingItem = cartItem;
      }
    });

    if (matchingItem) {
      const newQuantity = matchingItem.quantity + quantity;
      if (newQuantity > 99) {
        showCartError("Cannot add more than 99 of the same item");
        return false;
      }
      matchingItem.quantity = newQuantity;
    } else {
      cart.push({
        productId: productId,
        quantity: quantity,
        deliveryOptionId: "1",
        addedAt: Date.now(),
        source: source, // Track where this item was added from
      });
    }

    // Track cart addition for analytics
    if (window.analytics) {
      // Track generic cart event
      window.analytics.trackEvent("cart_add", {
        productId: productId,
        quantity: quantity,
        cartSize: cart.length,
      });

      // Only track general cart additions for non-search scenarios
      // Search-specific tracking is handled in search.js
    }

    saveToStorage();

    // Show success feedback
    // showAddToCartSuccess(quantity); // Commented out - user requested to remove notification

    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    showCartError("Failed to add item to cart");
    return false;
  }
}

function showAddToCartSuccess(quantity) {
  // Create success notification
  let successDiv = document.querySelector(".cart-success-notification");
  if (!successDiv) {
    successDiv = document.createElement("div");
    successDiv.className = "cart-success-notification";
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: -4CAF50;
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
    document.body.appendChild(successDiv);
  }

  successDiv.textContent = `Added ${quantity} item${
    quantity > 1 ? "s" : ""
  } to cart`;
  successDiv.style.transform = "translateX(0)";

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (successDiv) {
      successDiv.style.transform = "translateX(100%)";
    }
  }, 3000);
}

export function removeFromCart(productId) {
  // Remove items by filtering in place
  for (let i = cart.length - 1; i >= 0; i--) {
    if (cart[i].productId === productId) {
      cart.splice(i, 1);
    }
  }

  // Track cart removal for analytics
  if (window.analytics) {
    window.analytics.trackEvent("cart_remove", {
      productId: productId,
      cartSize: cart.length,
    });
  }

  saveToStorage();
}

export function updateDeliveryOption(productId, deliveryOptionId) {
  let matchingItem;
  cart.forEach((cartItem) => {
    if (productId === cartItem.productId) {
      matchingItem = cartItem;
    }
  });
  matchingItem.deliveryOptionId = deliveryOptionId;
  saveToStorage();
}



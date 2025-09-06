import { cart } from "../../data/cart.js";

export function updateCartQuantity() {
  try {
    // Calculate the total quantity of items in cart
    let cartQuantity = 0;

    if (cart && Array.isArray(cart)) {
      cart.forEach((item) => {
        if (item && typeof item.quantity === "number" && item.quantity > 0) {
          cartQuantity += item.quantity;
        }
      });
    }

    // Update the cart quantity display in the header
    const cartQuantityElement = document.querySelector(".js-cart-quantity");
    if (cartQuantityElement) {
      cartQuantityElement.textContent = cartQuantity;

      // Add visual feedback for cart updates
      if (cartQuantity > 0) {
        cartQuantityElement.classList.add("has-items");
        cartQuantityElement.classList.remove("empty-cart");
        cartQuantityElement.style.display = "flex"; // Always show, but style differently
      } else {
        cartQuantityElement.classList.remove("has-items");
        cartQuantityElement.classList.add("empty-cart");
        cartQuantityElement.style.display = "flex"; // Always show, even when 0
        cartQuantityElement.textContent = "0"; // Explicitly set to 0 when empty
      }
    }

    // Update page title for checkout page
    if (window.location.pathname.includes("checkout.html")) {
      updateCheckoutPageTitle(cart.length, cartQuantity);
    }

    return cartQuantity;
  } catch (error) {
    console.error("Error updating cart quantity:", error);

    // Fallback: show 0 items
    const cartQuantityElement = document.querySelector(".js-cart-quantity");
    if (cartQuantityElement) {
      cartQuantityElement.textContent = "0";
      cartQuantityElement.classList.remove("has-items");
      cartQuantityElement.classList.add("empty-cart");
      cartQuantityElement.style.display = "flex"; // Always show, even on error
    }
    return 0;
  }
}

function updateCheckoutPageTitle(uniqueItems, totalQuantity) {
  const pageTitleElement = document.querySelector(".page-title");
  if (pageTitleElement) {
    pageTitleElement.innerHTML = `Checkout (Items: ${uniqueItems}, Total quantity: ${totalQuantity})`;
  }
}

// Initialize cart quantity when DOM is loaded
export function initCartQuantity() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateCartQuantity);
  } else {
    updateCartQuantity();
  }

  // Update cart quantity when storage changes (for multiple tabs)
  window.addEventListener("storage", (e) => {
    if (e.key === "cart") {
      updateCartQuantity();
    }
  });

  // Listen for custom cart update events
  window.addEventListener("cartUpdated", () => {
    updateCartQuantity();
  });
}

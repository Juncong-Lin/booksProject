const express = require("express");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const Cart = require("../models/Cart");
const Book = require("../models/Book");

const router = express.Router();

// @desc    Get user's cart
// @route   GET /api/v1/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getOrCreateCart(req.user._id);

  // Populate book details for each cart item
  await cart.populate({
    path: "items.book",
    select:
      "name image lower_price higher_price stock isActive author category",
  });

  // Transform cart data to match frontend expectations
  const cartData = {
    id: cart._id,
    items: cart.items.map((item) => ({
      bookId: item.bookId,
      quantity: item.quantity,
      price: item.price,
      addedAt: item.addedAt,
      book: {
        id: item.bookId,
        name: item.book?.name || "Unknown Book",
        image: item.book?.image || "",
        author: item.book?.author || "",
        category: item.book?.category || "",
        lower_price: item.book?.lower_price || 0,
        higher_price: item.book?.higher_price || 0,
        stock: item.book?.stock || 0,
        isActive: item.book?.isActive || false,
      },
    })),
    totalItems: cart.totalItems,
    uniqueItems: cart.uniqueItems,
    totalPrice: cart.totalPrice,
    lastModified: cart.lastModified,
  };

  res.status(200).json({
    success: true,
    data: {
      cart: cartData,
    },
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart/add
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { bookId, quantity = 1 } = req.body;

  if (!bookId) {
    return res.status(400).json({
      success: false,
      message: "Book ID is required",
    });
  }

  if (quantity < 1) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be at least 1",
    });
  }

  // Find the book
  const book = await Book.findOne({ id: bookId, isActive: true });
  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found or inactive",
    });
  }

  // Check stock availability
  const cart = await Cart.getOrCreateCart(req.user._id);
  const existingItem = cart.getItem(bookId);
  const totalRequestedQuantity = (existingItem?.quantity || 0) + quantity;

  if (!book.isInStock(totalRequestedQuantity)) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock. Available: ${book.stock}, Requested: ${totalRequestedQuantity}`,
      data: {
        availableStock: book.stock,
        currentInCart: existingItem?.quantity || 0,
      },
    });
  }

  // Add item to cart
  await cart.addItem(bookId, book, quantity, book.lower_price);

  // Return updated cart
  await cart.populate({
    path: "items.book",
    select: "name image lower_price higher_price stock isActive",
  });

  res.status(200).json({
    success: true,
    message: "Item added to cart successfully",
    data: {
      cart: {
        totalItems: cart.totalItems,
        uniqueItems: cart.uniqueItems,
        totalPrice: cart.totalPrice,
      },
      addedItem: {
        bookId,
        quantity,
        price: book.lower_price,
      },
    },
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/v1/cart/update
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { bookId, quantity } = req.body;

  if (!bookId) {
    return res.status(400).json({
      success: false,
      message: "Book ID is required",
    });
  }

  if (quantity < 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity cannot be negative",
    });
  }

  const cart = await Cart.getOrCreateCart(req.user._id);

  // Check if item exists in cart
  if (!cart.getItem(bookId)) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart",
    });
  }

  if (quantity > 0) {
    // Check stock availability
    const book = await Book.findOne({ id: bookId, isActive: true });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found or inactive",
      });
    }

    if (!book.isInStock(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${book.stock}`,
        data: {
          availableStock: book.stock,
        },
      });
    }
  }

  // Update cart item
  await cart.updateItem(bookId, quantity);

  res.status(200).json({
    success: true,
    message:
      quantity === 0
        ? "Item removed from cart"
        : "Cart item updated successfully",
    data: {
      cart: {
        totalItems: cart.totalItems,
        uniqueItems: cart.uniqueItems,
        totalPrice: cart.totalPrice,
      },
    },
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/remove/:bookId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const cart = await Cart.getOrCreateCart(req.user._id);

  // Check if item exists in cart
  if (!cart.getItem(bookId)) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart",
    });
  }

  // Remove item from cart
  await cart.removeItem(bookId);

  res.status(200).json({
    success: true,
    message: "Item removed from cart successfully",
    data: {
      cart: {
        totalItems: cart.totalItems,
        uniqueItems: cart.uniqueItems,
        totalPrice: cart.totalPrice,
      },
    },
  });
});

// @desc    Clear entire cart
// @route   DELETE /api/v1/cart/clear
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getOrCreateCart(req.user._id);
  await cart.clearCart();

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
    data: {
      cart: {
        totalItems: 0,
        uniqueItems: 0,
        totalPrice: 0,
      },
    },
  });
});

// @desc    Sync guest cart with user cart (for when user logs in)
// @route   POST /api/v1/cart/sync
// @access  Private
const syncCart = asyncHandler(async (req, res) => {
  const { guestCartItems = [] } = req.body;

  if (!Array.isArray(guestCartItems)) {
    return res.status(400).json({
      success: false,
      message: "Guest cart items must be an array",
    });
  }

  const cart = await Cart.getOrCreateCart(req.user._id);

  // Merge guest cart items
  for (const guestItem of guestCartItems) {
    if (!guestItem.bookId || !guestItem.quantity) {
      continue; // Skip invalid items
    }

    const book = await Book.findOne({ id: guestItem.bookId, isActive: true });
    if (!book) {
      continue; // Skip inactive or non-existent books
    }

    try {
      await cart.addItem(
        guestItem.bookId,
        book,
        guestItem.quantity,
        book.lower_price
      );
    } catch (error) {
      console.log(
        `Error adding guest item ${guestItem.bookId}:`,
        error.message
      );
      // Continue with other items
    }
  }

  // Return updated cart
  await cart.populate({
    path: "items.book",
    select: "name image lower_price higher_price stock isActive",
  });

  res.status(200).json({
    success: true,
    message: "Cart synchronized successfully",
    data: {
      cart: {
        totalItems: cart.totalItems,
        uniqueItems: cart.uniqueItems,
        totalPrice: cart.totalPrice,
        items: cart.items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
  });
});

// @desc    Validate cart items (check stock and availability)
// @route   POST /api/v1/cart/validate
// @access  Private
const validateCart = asyncHandler(async (req, res) => {
  const cart = await Cart.getOrCreateCart(req.user._id);
  const validation = await cart.validateItems();

  res.status(200).json({
    success: true,
    data: {
      valid: validation.valid,
      invalidItems: validation.invalidItems,
      cart: {
        totalItems: cart.totalItems,
        uniqueItems: cart.uniqueItems,
        totalPrice: cart.totalPrice,
      },
    },
  });
});

// Routes
router.get("/", authenticate, getCart);
router.post("/add", authenticate, addToCart);
router.put("/update", authenticate, updateCartItem);
router.delete("/remove/:bookId", authenticate, removeFromCart);
router.delete("/clear", authenticate, clearCart);
router.post("/sync", authenticate, syncCart);
router.post("/validate", authenticate, validateCart);

module.exports = router;

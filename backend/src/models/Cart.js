const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    bookId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    lastModified: {
      type: Date,
      default: Date.now,
    },
    sessionId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for total items count
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total price
cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
});

// Virtual for unique items count
cartSchema.virtual("uniqueItems").get(function () {
  return this.items.length;
});

// Update lastModified on save
cartSchema.pre("save", function (next) {
  this.lastModified = new Date();
  next();
});

// Instance method to add item to cart
cartSchema.methods.addItem = function (bookId, book, quantity = 1, price) {
  const existingItemIndex = this.items.findIndex(
    (item) => item.bookId === bookId
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      book: book._id,
      bookId: bookId,
      quantity: quantity,
      price: price,
    });
  }

  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItem = function (bookId, quantity) {
  const itemIndex = this.items.findIndex((item) => item.bookId === bookId);

  if (itemIndex === -1) {
    throw new Error("Item not found in cart");
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    // Update quantity
    this.items[itemIndex].quantity = quantity;
  }

  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function (bookId) {
  this.items = this.items.filter((item) => item.bookId !== bookId);
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

// Instance method to get item by bookId
cartSchema.methods.getItem = function (bookId) {
  return this.items.find((item) => item.bookId === bookId);
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function (userId, sessionId = null) {
  let cart = await this.findOne({ user: userId }).populate({
    path: "items.book",
    select: "name image lower_price higher_price stock isActive",
  });

  if (!cart) {
    cart = new this({
      user: userId,
      items: [],
      sessionId: sessionId,
    });
    await cart.save();
  }

  return cart;
};

// Static method to merge guest cart with user cart
cartSchema.statics.mergeGuestCart = async function (userId, guestCartItems) {
  const userCart = await this.getOrCreateCart(userId);

  for (const guestItem of guestCartItems) {
    await userCart.addItem(
      guestItem.bookId,
      guestItem.book,
      guestItem.quantity,
      guestItem.price
    );
  }

  return userCart;
};

// Method to validate cart items (check stock, active status)
cartSchema.methods.validateItems = async function () {
  const Book = mongoose.model("Book");
  const invalidItems = [];
  const validItems = [];

  for (const item of this.items) {
    const book = await Book.findOne({ id: item.bookId, isActive: true });

    if (!book) {
      invalidItems.push({
        bookId: item.bookId,
        reason: "Book not found or inactive",
      });
    } else if (!book.isInStock(item.quantity)) {
      invalidItems.push({
        bookId: item.bookId,
        reason: `Insufficient stock. Available: ${book.stock}`,
        availableStock: book.stock,
      });
    } else {
      validItems.push(item);
    }
  }

  return {
    valid: invalidItems.length === 0,
    invalidItems,
    validItems,
  };
};

module.exports = mongoose.model("Cart", cartSchema);

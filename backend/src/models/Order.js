const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
    },
    author: String,
    image: String,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "United States",
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "cash_on_delivery"],
      required: true,
    },
    paymentDetails: {
      transactionId: String,
      gateway: String,
      cardLast4: String,
      cardType: String,
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
    billingAddress: {
      type: addressSchema,
      required: true,
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      tax: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      shipping: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    shippingMethod: {
      type: String,
      enum: ["standard", "express", "overnight", "pickup"],
      default: "standard",
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: {
      type: String,
      sparse: true,
      index: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    metadata: {
      ipAddress: String,
      userAgent: String,
      source: {
        type: String,
        default: "web",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ "items.bookId": 1 });

// Virtual for total items count
orderSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique items count
orderSchema.virtual("uniqueItems").get(function () {
  return this.items.length;
});

// Virtual for order age in days
orderSchema.virtual("ageInDays").get(function () {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to generate unique order number
orderSchema.statics.generateOrderNumber = function () {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `ORD-${timestamp}-${random}`;
};

// Static method to create order from cart
orderSchema.statics.createFromCart = async function (user, cart, orderData) {
  const {
    paymentMethod,
    shippingAddress,
    billingAddress,
    shippingMethod = "standard",
    paymentDetails = {},
    notes = "",
    metadata = {},
  } = orderData;

  // Validate cart items before creating order
  const validation = await cart.validateItems();
  if (!validation.valid) {
    throw new Error(
      `Invalid cart items: ${validation.invalidItems
        .map((item) => item.reason)
        .join(", ")}`
    );
  }

  // Calculate pricing
  const subtotal = cart.totalPrice;
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const shipping =
    shippingMethod === "express"
      ? 1500
      : shippingMethod === "overnight"
        ? 2500
        : 500; // in cents
  const total = subtotal + tax + shipping;

  // Create order items from cart
  const Book = mongoose.model("Book");
  const orderItems = [];

  for (const cartItem of cart.items) {
    const book = await Book.findOne({ id: cartItem.bookId });
    if (!book) {
      throw new Error(`Book not found: ${cartItem.bookId}`);
    }

    orderItems.push({
      book: book._id,
      bookId: cartItem.bookId,
      name: book.name,
      author: book.author || "",
      image: book.image,
      quantity: cartItem.quantity,
      price: cartItem.price,
      totalPrice: cartItem.price * cartItem.quantity,
    });

    // Update book stock
    await book.updateStock(cartItem.quantity, "decrease");
  }

  // Create the order
  const order = new this({
    orderNumber: this.generateOrderNumber(),
    user: user._id,
    items: orderItems,
    paymentMethod,
    shippingAddress,
    billingAddress,
    pricing: {
      subtotal,
      tax,
      shipping,
      total,
    },
    shippingMethod,
    paymentDetails,
    notes,
    metadata,
    statusHistory: [
      {
        status: "pending",
        timestamp: new Date(),
        note: "Order created",
      },
    ],
  });

  // Calculate estimated delivery
  const deliveryDays =
    shippingMethod === "overnight" ? 1 : shippingMethod === "express" ? 2 : 5;
  order.estimatedDelivery = new Date(
    Date.now() + deliveryDays * 24 * 60 * 60 * 1000
  );

  await order.save();

  // Clear the cart
  await cart.clearCart();

  return order;
};

// Instance method to update status
orderSchema.methods.updateStatus = function (
  newStatus,
  note = "",
  updatedBy = null
) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note,
    updatedBy,
  });

  // Update payment status based on order status
  if (newStatus === "confirmed" && this.paymentStatus === "pending") {
    this.paymentStatus = "paid";
  } else if (newStatus === "cancelled") {
    this.paymentStatus = "failed";
  } else if (newStatus === "refunded") {
    this.paymentStatus = "refunded";
  }

  return this.save();
};

// Instance method to add tracking number
orderSchema.methods.addTrackingNumber = function (trackingNumber) {
  this.trackingNumber = trackingNumber;
  if (this.status === "confirmed" || this.status === "processing") {
    return this.updateStatus("shipped", `Tracking number: ${trackingNumber}`);
  }
  return this.save();
};

// Instance method to mark as delivered
orderSchema.methods.markAsDelivered = function (note = "") {
  this.actualDelivery = new Date();
  return this.updateStatus("delivered", note);
};

// Instance method to calculate refund amount
orderSchema.methods.calculateRefund = function (itemsToRefund = null) {
  if (!itemsToRefund) {
    // Full refund
    return this.pricing.total;
  }

  // Partial refund
  let refundAmount = 0;
  for (const refundItem of itemsToRefund) {
    const orderItem = this.items.find(
      (item) => item.bookId === refundItem.bookId
    );
    if (orderItem) {
      const refundQuantity = Math.min(refundItem.quantity, orderItem.quantity);
      refundAmount += orderItem.price * refundQuantity;
    }
  }

  return refundAmount;
};

// Pre-save middleware to validate pricing
orderSchema.pre("save", function (next) {
  // Validate that total equals subtotal + tax + shipping - discount
  const calculatedTotal =
    this.pricing.subtotal +
    this.pricing.tax +
    this.pricing.shipping -
    this.pricing.discount;

  if (Math.abs(this.pricing.total - calculatedTotal) > 1) {
    // Allow for rounding differences
    return next(new Error("Order total does not match calculated amount"));
  }

  next();
});

module.exports = mongoose.model("Order", orderSchema);

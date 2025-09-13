const express = require("express");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const router = express.Router();

// @desc    Get user orders
// @route   GET /api/v1/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  let query = { user: req.user._id };

  if (status) {
    query.status = status;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sort
  const sortObj = {};
  sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [orders, totalCount] = await Promise.all([
    Order.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "items.book",
        select: "name image category",
      })
      .lean(),
    Order.countDocuments(query),
  ]);

  // Transform orders for frontend
  const transformedOrders = orders.map((order) => ({
    id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    totalItems: order.totalItems,
    uniqueItems: order.uniqueItems,
    total: order.pricing.total,
    subtotal: order.pricing.subtotal,
    tax: order.pricing.tax,
    shipping: order.pricing.shipping,
    createdAt: order.createdAt,
    estimatedDelivery: order.estimatedDelivery,
    trackingNumber: order.trackingNumber,
    items: order.items.map((item) => ({
      bookId: item.bookId,
      name: item.name,
      author: item.author,
      image: item.image,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    })),
  }));

  res.status(200).json({
    success: true,
    data: {
      orders: transformedOrders,
      pagination: {
        current: pageNum,
        total: Math.ceil(totalCount / limitNum),
        count: transformedOrders.length,
        totalOrders: totalCount,
        hasNext: pageNum * limitNum < totalCount,
        hasPrev: pageNum > 1,
      },
    },
  });
});

// @desc    Create new order
// @route   POST /api/v1/orders/create
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    paymentMethod,
    shippingAddress,
    billingAddress,
    shippingMethod = "standard",
    paymentDetails = {},
    notes = "",
  } = req.body;

  // Validation
  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: "Payment method is required",
    });
  }

  if (
    !shippingAddress ||
    !shippingAddress.street ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.zipCode
  ) {
    return res.status(400).json({
      success: false,
      message: "Complete shipping address is required",
    });
  }

  if (
    !billingAddress ||
    !billingAddress.street ||
    !billingAddress.city ||
    !billingAddress.state ||
    !billingAddress.zipCode
  ) {
    return res.status(400).json({
      success: false,
      message: "Complete billing address is required",
    });
  }

  // Get user's cart
  const cart = await Cart.getOrCreateCart(req.user._id);

  if (cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty",
    });
  }

  // Validate cart items
  const validation = await cart.validateItems();
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: "Some items in your cart are no longer available",
      data: {
        invalidItems: validation.invalidItems,
      },
    });
  }

  try {
    // Create order
    const order = await Order.createFromCart(req.user, cart, {
      paymentMethod,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentDetails,
      notes,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        source: "web",
      },
    });

    // Transform order for response
    const transformedOrder = {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalItems: order.totalItems,
      uniqueItems: order.uniqueItems,
      pricing: order.pricing,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        bookId: item.bookId,
        name: item.name,
        author: item.author,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
      })),
    };

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order: transformedOrder,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    $or: [
      { _id: id, user: req.user._id },
      { orderNumber: id, user: req.user._id },
    ],
  })
    .populate({
      path: "items.book",
      select: "name image category author",
    })
    .lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  // Transform order for response
  const transformedOrder = {
    id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    pricing: order.pricing,
    shippingMethod: order.shippingMethod,
    estimatedDelivery: order.estimatedDelivery,
    actualDelivery: order.actualDelivery,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    totalItems: order.totalItems,
    uniqueItems: order.uniqueItems,
    ageInDays: Math.floor(
      (new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)
    ),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    statusHistory: order.statusHistory,
    items: order.items.map((item) => ({
      bookId: item.bookId,
      name: item.name,
      author: item.author,
      image: item.image,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      book: item.book,
    })),
  };

  res.status(200).json({
    success: true,
    data: {
      order: transformedOrder,
    },
  });
});

// @desc    Cancel order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "" } = req.body;

  const order = await Order.findOne({
    $or: [
      { _id: id, user: req.user._id },
      { orderNumber: id, user: req.user._id },
    ],
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  // Check if order can be cancelled
  if (!["pending", "confirmed"].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel order with status: ${order.status}`,
    });
  }

  // Update order status
  await order.updateStatus(
    "cancelled",
    `Cancelled by user: ${reason}`,
    req.user._id
  );

  // Restore book stock
  const Book = require("../models/Book");
  for (const item of order.items) {
    const book = await Book.findOne({ id: item.bookId });
    if (book) {
      await book.updateStock(item.quantity, "increase");
    }
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
    },
  });
});

// @desc    Get order tracking info
// @route   GET /api/v1/orders/:id/tracking
// @access  Private
const getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findOne({
    $or: [
      { _id: id, user: req.user._id },
      { orderNumber: id, user: req.user._id },
    ],
  })
    .select(
      "orderNumber status trackingNumber estimatedDelivery actualDelivery statusHistory shippingMethod"
    )
    .lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      shippingMethod: order.shippingMethod,
      estimatedDelivery: order.estimatedDelivery,
      actualDelivery: order.actualDelivery,
      statusHistory: order.statusHistory,
    },
  });
});

// Routes
router.get("/", authenticate, getUserOrders);
router.post("/create", authenticate, createOrder);
router.get("/:id", authenticate, getOrder);
router.put("/:id/cancel", authenticate, cancelOrder);
router.get("/:id/tracking", authenticate, getOrderTracking);

module.exports = router;

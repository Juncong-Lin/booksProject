const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Book name is required"],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      required: true,
    },
    star: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    lower_price: {
      type: Number,
      required: true,
      min: 0,
    },
    higher_price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isbn: {
      type: String,
      sparse: true,
      index: true,
    },
    publishedDate: {
      type: Date,
    },
    publisher: {
      type: String,
      trim: true,
    },
    pages: {
      type: Number,
      min: 1,
    },
    language: {
      type: String,
      default: "English",
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    dimensions: {
      height: Number,
      width: Number,
      depth: Number,
      weight: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better search performance
bookSchema.index({ name: "text", author: "text", description: "text" });
bookSchema.index({ category: 1, lower_price: 1 });
bookSchema.index({ star: -1, reviews: -1 });
bookSchema.index({ createdAt: -1 });

// Virtual for average price
bookSchema.virtual("averagePrice").get(function () {
  return (this.lower_price + this.higher_price) / 2;
});

// Virtual for price range display
bookSchema.virtual("priceRange").get(function () {
  if (this.lower_price === this.higher_price) {
    return `$${(this.lower_price / 100).toFixed(2)}`;
  }
  return `$${(this.lower_price / 100).toFixed(2)} - $${(
    this.higher_price / 100
  ).toFixed(2)}`;
});

// Static method to get categories
bookSchema.statics.getCategories = function () {
  return this.distinct("category");
};

// Static method to search books
bookSchema.statics.searchBooks = function (query, options = {}) {
  const {
    category,
    minPrice,
    maxPrice,
    minRating,
    author,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = -1,
  } = options;

  let searchQuery = {
    isActive: true,
  };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Category filter
  if (category) {
    searchQuery.category = new RegExp(category, "i");
  }

  // Price range filter
  if (minPrice !== undefined) {
    searchQuery.lower_price = { $gte: minPrice * 100 };
  }
  if (maxPrice !== undefined) {
    searchQuery.higher_price = { $lte: maxPrice * 100 };
  }

  // Rating filter
  if (minRating !== undefined) {
    searchQuery.star = { $gte: minRating };
  }

  // Author filter
  if (author) {
    searchQuery.author = new RegExp(author, "i");
  }

  const skip = (page - 1) * limit;

  return this.find(searchQuery)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware to ensure prices are consistent
bookSchema.pre("save", function (next) {
  if (this.lower_price > this.higher_price) {
    this.higher_price = this.lower_price;
  }
  next();
});

// Method to check if book is in stock
bookSchema.methods.isInStock = function (quantity = 1) {
  return this.stock >= quantity;
};

// Method to update stock
bookSchema.methods.updateStock = function (quantity, operation = "decrease") {
  if (operation === "decrease") {
    this.stock = Math.max(0, this.stock - quantity);
  } else {
    this.stock += quantity;
  }
  return this.save();
};

module.exports = mongoose.model("Book", bookSchema);

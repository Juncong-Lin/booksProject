const express = require("express");
const { optionalAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");
const Book = require("../models/Book");

const router = express.Router();

// @desc    Get all books
// @route   GET /api/v1/books
// @access  Public
const getAllBooks = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    author,
    minPrice,
    maxPrice,
    minRating,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // Build query
  let query = { isActive: true };

  // Category filter (case-insensitive partial match)
  if (category) {
    query.category = new RegExp(
      category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  // Author filter
  if (author) {
    query.author = new RegExp(
      author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
  }

  // Price range filters (prices stored in cents)
  if (minPrice !== undefined) {
    query.lower_price = { $gte: parseFloat(minPrice) * 100 };
  }
  if (maxPrice !== undefined) {
    query.higher_price = { $lte: parseFloat(maxPrice) * 100 };
  }

  // Rating filter
  if (minRating !== undefined) {
    query.star = { $gte: parseFloat(minRating) };
  }

  // Text search across name, author, description
  if (search) {
    query.$text = { $search: search };
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sort order
  const sortObj = {};
  sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

  try {
    // Execute query with aggregation for better performance
    const [books, totalCount] = await Promise.all([
      Book.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(), // Use lean for better performance
      Book.countDocuments(query),
    ]);

    // Transform books to match frontend expectations
    const transformedBooks = books.map((book) => ({
      id: book.id,
      name: book.name,
      author: book.author,
      category: book.category,
      image: book.image,
      star: book.star,
      lower_price: book.lower_price,
      higher_price: book.higher_price,
      description: book.description,
      stock: book.stock,
      reviews: book.reviews || 0,
      isActive: book.isActive,
      createdAt: book.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        books: transformedBooks,
        pagination: {
          current: pageNum,
          total: Math.ceil(totalCount / limitNum),
          count: transformedBooks.length,
          totalBooks: totalCount,
          limit: limitNum,
          hasNext: pageNum * limitNum < totalCount,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching books",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @desc    Get single book
// @route   GET /api/v1/books/:id
// @access  Public
const getBook = asyncHandler(async (req, res) => {
  const book = await Book.findOne({ id: req.params.id, isActive: true }).lean();

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found",
    });
  }

  // Transform book to match frontend expectations
  const transformedBook = {
    id: book.id,
    name: book.name,
    author: book.author,
    category: book.category,
    image: book.image,
    star: book.star,
    lower_price: book.lower_price,
    higher_price: book.higher_price,
    description: book.description,
    stock: book.stock,
    reviews: book.reviews || 0,
    isActive: book.isActive,
    isbn: book.isbn,
    publisher: book.publisher,
    pages: book.pages,
    language: book.language,
    publishedDate: book.publishedDate,
    tags: book.tags,
    createdAt: book.createdAt,
  };

  res.status(200).json({
    success: true,
    data: {
      book: transformedBook,
    },
  });
});

// @desc    Get book categories
// @route   GET /api/v1/books/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Book.getCategories();

  res.status(200).json({
    success: true,
    data: {
      categories: categories.sort(),
      count: categories.length,
    },
  });
});

// @desc    Search books with advanced filters
// @route   POST /api/v1/books/search
// @access  Public
const searchBooks = asyncHandler(async (req, res) => {
  const {
    query: searchQuery,
    filters = {},
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
  } = req.body;

  const books = await Book.searchBooks(searchQuery, {
    ...filters,
    page: parseInt(page),
    limit: parseInt(limit),
    sortBy: Object.keys(sort)[0] || "createdAt",
    sortOrder: Object.values(sort)[0] || -1,
  });

  const totalCount = await Book.countDocuments({
    $text: { $search: searchQuery },
    isActive: true,
    ...filters,
  });

  res.status(200).json({
    success: true,
    data: {
      books: books.map((book) => ({
        id: book.id,
        name: book.name,
        author: book.author,
        category: book.category,
        image: book.image,
        star: book.star,
        lower_price: book.lower_price,
        higher_price: book.higher_price,
        description: book.description,
        stock: book.stock,
        reviews: book.reviews || 0,
      })),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / parseInt(limit)),
        count: books.length,
        totalBooks: totalCount,
      },
    },
  });
});

// Routes
router.get("/", optionalAuth, getAllBooks);
router.get("/categories", optionalAuth, getCategories);
router.get("/:id", optionalAuth, getBook);
router.post("/search", optionalAuth, searchBooks);

module.exports = router;

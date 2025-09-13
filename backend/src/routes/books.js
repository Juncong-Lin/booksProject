const express = require("express");
const { optionalAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

// Mock book data (will be replaced with database integration)
const mockBooks = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 12.99,
    category: "Fiction",
    description: "A classic American novel",
    image: "images/placeholder-book.svg",
    stock: 25,
    rating: 4.5,
    reviews: 128,
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 14.99,
    category: "Fiction",
    description: "A gripping tale of racial injustice",
    image: "images/placeholder-book.svg",
    stock: 18,
    rating: 4.8,
    reviews: 203,
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    price: 13.99,
    category: "Dystopian Fiction",
    description: "A dystopian social science fiction novel",
    image: "images/placeholder-book.svg",
    stock: 32,
    rating: 4.7,
    reviews: 156,
  },
];

// @desc    Get all books
// @route   GET /api/v1/books
// @access  Public
const getAllBooks = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;

  let filteredBooks = [...mockBooks];

  // Filter by category
  if (category) {
    filteredBooks = filteredBooks.filter((book) =>
      book.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Search by title or author
  if (search) {
    filteredBooks = filteredBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    data: {
      books: paginatedBooks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(filteredBooks.length / limit),
        count: paginatedBooks.length,
        totalBooks: filteredBooks.length,
      },
    },
  });
});

// @desc    Get single book
// @route   GET /api/v1/books/:id
// @access  Public
const getBook = asyncHandler(async (req, res) => {
  const book = mockBooks.find((book) => book.id === req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      book,
    },
  });
});

// Routes
router.get("/", optionalAuth, getAllBooks);
router.get("/:id", optionalAuth, getBook);

module.exports = router;

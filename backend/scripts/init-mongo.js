// MongoDB initialization script for Docker
db = db.getSiblingDB("bookstore");

// Create collections
db.createCollection("users");
db.createCollection("books");
db.createCollection("orders");

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
db.books.createIndex({ title: "text", author: "text", description: "text" });
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ createdAt: -1 });

// Insert sample books data
db.books.insertMany([
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 12.99,
    category: "Fiction",
    description:
      "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
    image: "images/placeholder-book.svg",
    stock: 25,
    rating: 4.5,
    reviews: 128,
    isbn: "978-0-7432-7356-5",
    publishedDate: new Date("1925-04-10"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 14.99,
    category: "Fiction",
    description:
      "A gripping tale of racial injustice and childhood innocence in the American South.",
    image: "images/placeholder-book.svg",
    stock: 18,
    rating: 4.8,
    reviews: 203,
    isbn: "978-0-06-112008-4",
    publishedDate: new Date("1960-07-11"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "1984",
    author: "George Orwell",
    price: 13.99,
    category: "Dystopian Fiction",
    description:
      "A dystopian social science fiction novel about totalitarianism and surveillance.",
    image: "images/placeholder-book.svg",
    stock: 32,
    rating: 4.7,
    reviews: 156,
    isbn: "978-0-452-28423-4",
    publishedDate: new Date("1949-06-08"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    price: 11.99,
    category: "Romance",
    description:
      "A romantic novel that critiques the British landed gentry at the end of the 18th century.",
    image: "images/placeholder-book.svg",
    stock: 22,
    rating: 4.6,
    reviews: 189,
    isbn: "978-0-14-143951-8",
    publishedDate: new Date("1813-01-28"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    price: 13.5,
    category: "Fiction",
    description:
      "A controversial coming-of-age story about teenage rebellion and alienation.",
    image: "images/placeholder-book.svg",
    stock: 15,
    rating: 4.3,
    reviews: 142,
    isbn: "978-0-316-76948-0",
    publishedDate: new Date("1951-07-16"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print("Database initialized with sample data successfully!");

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Book = require("../src/models/Book");

// Connect to MongoDB
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
}

// Import book data from frontend
function importBookData() {
  console.log("Loading books data from frontend...");

  // Read the books data from the frontend
  const fs = require("fs");
  const booksPath = path.join(__dirname, "..", "..", "data", "books.js");

  if (!fs.existsSync(booksPath)) {
    throw new Error(`Books data file not found at ${booksPath}`);
  }

  // Read and parse the books.js file
  const booksContent = fs.readFileSync(booksPath, "utf8");

  // Extract the books data using regex since it's an ES6 module
  const match = booksContent.match(/export const booksProducts = ({[\s\S]*});/);
  if (!match) {
    throw new Error("Could not parse books data from file");
  }

  // Use eval to parse the object (in production, use a proper parser)
  const booksProducts = eval(`(${match[1]})`);

  console.log(`Found ${Object.keys(booksProducts).length} categories`);

  // Flatten all books from all categories
  const allBooks = [];
  for (const [category, books] of Object.entries(booksProducts)) {
    for (const book of books) {
      allBooks.push({
        ...book,
        category: category.replace(/_/g, " "), // Convert snake_case to normal case
        stock: Math.floor(Math.random() * 50) + 1, // Random stock between 1-50
        description: `${book.name} - A great book in the ${category.replace(/_/g, " ")} category.`,
        author: extractAuthorFromName(book.name),
        isActive: true,
      });
    }
  }

  console.log(`Total books to import: ${allBooks.length}`);
  return allBooks;
}

// Helper function to extract author from book name (basic implementation)
function extractAuthorFromName(name) {
  // This is a basic implementation - in real scenario you'd have proper author data
  const patterns = [/by (.+?)$/i, /- (.+?)$/, /: (.+?)$/];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback to a generic author
  return "Unknown Author";
}

// Seed the database
async function seedBooks() {
  try {
    console.log("🌱 Starting book data migration...");

    // Connect to database
    await connectDB();

    // Clear existing books
    console.log("Clearing existing books...");
    await Book.deleteMany({});

    // Import book data
    const booksData = importBookData();

    // Insert books in batches to avoid memory issues
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < booksData.length; i += batchSize) {
      const batch = booksData.slice(i, i + batchSize);

      try {
        await Book.insertMany(batch, { ordered: false });
        inserted += batch.length;
        console.log(
          `✅ Inserted batch ${Math.ceil(i / batchSize) + 1}: ${inserted}/${booksData.length} books`
        );
      } catch (error) {
        if (error.code === 11000) {
          // Handle duplicate keys
          console.log(
            `⚠️  Some duplicates in batch ${Math.ceil(i / batchSize) + 1}, continuing...`
          );

          // Insert individually to skip duplicates
          for (const book of batch) {
            try {
              await Book.create(book);
              inserted++;
            } catch (dupError) {
              if (dupError.code !== 11000) {
                console.error(
                  `Error inserting book ${book.id}:`,
                  dupError.message
                );
              }
            }
          }
        } else {
          console.error(`Error inserting batch:`, error.message);
        }
      }
    }

    // Get final count
    const totalCount = await Book.countDocuments();
    console.log(`\n🎉 Migration completed!`);
    console.log(`📚 Total books in database: ${totalCount}`);

    // Show some statistics
    const categories = await Book.distinct("category");
    console.log(`📂 Categories: ${categories.length}`);
    console.log(
      `💰 Price range: $${((await Book.findOne().sort({ lower_price: 1 }))?.lower_price / 100).toFixed(2)} - $${((await Book.findOne().sort({ higher_price: -1 }))?.higher_price / 100).toFixed(2)}`
    );

    // Show sample of categories
    console.log(`\nSample categories:`);
    categories.slice(0, 10).forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat}`);
    });

    if (categories.length > 10) {
      console.log(`  ... and ${categories.length - 10} more`);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
    process.exit(0);
  }
}

// Create indexes for better performance
async function createIndexes() {
  console.log("Creating database indexes...");

  try {
    await Book.collection.createIndex({
      name: "text",
      author: "text",
      description: "text",
    });
    await Book.collection.createIndex({ category: 1, lower_price: 1 });
    await Book.collection.createIndex({ star: -1, reviews: -1 });
    console.log("✅ Indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error.message);
  }
}

// Run the migration
if (require.main === module) {
  seedBooks()
    .then(() => createIndexes())
    .catch(console.error);
}

module.exports = { seedBooks, importBookData };

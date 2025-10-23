import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: ".env.local" });

// Import books from the data file
import { books } from "./src/app/data/books.js";

// Define Book Schema inline
const BookSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    isbn: { type: String, required: true, unique: true },
    genre: { type: [String], required: true },
    tags: { type: [String], default: [] },
    datePublished: { type: String, required: true },
    pages: { type: Number, required: true, min: 1 },
    language: { type: String, required: true, default: "English" },
    publisher: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, required: true, min: 0, default: 0 },
    inStock: { type: Boolean, required: true, default: true },
    featured: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

BookSchema.index({ title: "text", author: "text", description: "text" });
BookSchema.index({ genre: 1 });
BookSchema.index({ featured: 1 });
BookSchema.index({ inStock: 1 });
BookSchema.index({ price: 1 });

const Book = mongoose.models.Book || mongoose.model("Book", BookSchema);

async function seedBooks() {
  console.log("🌱 Starting book seeding process...");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing books
    console.log("🗑️  Clearing existing books...");
    await Book.deleteMany({});
    console.log("✅ Existing books cleared");

    // Insert books
    console.log(`📚 Inserting ${books.length} books...`);
    const result = await Book.insertMany(books);
    console.log(`✅ Successfully inserted ${result.length} books`);

    // Display some statistics
    const total = await Book.countDocuments();
    const featured = await Book.countDocuments({ featured: true });
    const inStock = await Book.countDocuments({ inStock: true });

    console.log("\n📊 Database Statistics:");
    console.log(`   - Total books: ${total}`);
    console.log(`   - Featured books: ${featured}`);
    console.log(`   - Books in stock: ${inStock}`);
    console.log(`   - Books out of stock: ${total - inStock}`);

    // Display genre distribution
    const genreStats = await Book.aggregate([
      { $unwind: "$genre" },
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📖 Books by Genre:");
    genreStats.forEach((stat) => {
      console.log(`   - ${stat._id}: ${stat.count}`);
    });

    // Display sample books
    console.log("\n📚 Sample Books:");
    const sampleBooksFromDb = await Book.find().limit(3).lean();
    sampleBooksFromDb.forEach((book) => {
      console.log(`   - ${book.title} by ${book.author} ($${book.price})`);
    });

    await mongoose.connection.close();
    console.log("\n🔌 Connection closed successfully");
    console.log("\n✅ Seeding completed! You can now test the API.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed!");
    console.error("Error:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedBooks();

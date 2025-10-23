import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: ".env.local" });

// Import reviews from the data file
import { reviews } from "./src/app/data/reviews.js";

// Define Review Schema inline
const ReviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    bookId: { type: String, required: true, index: true },
    author: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true },
    timestamp: { type: String, required: true },
    verified: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

ReviewSchema.index({ bookId: 1, rating: -1 });
ReviewSchema.index({ verified: 1 });
ReviewSchema.index({ timestamp: -1 });

const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

async function seedReviews() {
  console.log("🌱 Starting reviews seeding process...");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing reviews
    console.log("🗑️  Clearing existing reviews...");
    await Review.deleteMany({});
    console.log("✅ Existing reviews cleared");

    // Insert reviews
    console.log(`📝 Inserting ${reviews.length} reviews...`);
    const result = await Review.insertMany(reviews);
    console.log(`✅ Successfully inserted ${result.length} reviews`);

    // Display some statistics
    const total = await Review.countDocuments();
    const verified = await Review.countDocuments({ verified: true });
    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    const avgRating = avgRatingResult[0]?.avgRating || 0;

    console.log("\n📊 Reviews Statistics:");
    console.log(`   - Total reviews: ${total}`);
    console.log(`   - Verified reviews: ${verified}`);
    console.log(`   - Unverified reviews: ${total - verified}`);
    console.log(`   - Average rating: ${avgRating.toFixed(2)}`);

    // Reviews per book
    const reviewsPerBook = await Review.aggregate([
      {
        $group: {
          _id: "$bookId",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📖 Reviews by Book:");
    reviewsPerBook.forEach((stat) => {
      console.log(
        `   - Book ID ${stat._id}: ${
          stat.count
        } reviews (avg rating: ${stat.avgRating.toFixed(1)})`,
      );
    });

    // Display sample reviews
    console.log("\n📚 Sample Reviews:");
    const sampleReviewsFromDb = await Review.find().limit(3).lean();
    sampleReviewsFromDb.forEach((review) => {
      console.log(
        `   - ${review.title} by ${review.author} (${review.rating}⭐)`,
      );
    });

    await mongoose.connection.close();
    console.log("\n🔌 Connection closed successfully");
    console.log("\n✅ Seeding completed! You can now test the Reviews API.");
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

seedReviews();

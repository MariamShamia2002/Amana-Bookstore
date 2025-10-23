import mongoose, { Schema, Model } from "mongoose";

// Define the Review interface for TypeScript
export interface IReview {
  id: string;
  bookId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  timestamp: string;
  verified: boolean;
}

// Define the Mongoose Schema
const ReviewSchema = new Schema<IReview>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    bookId: {
      type: String,
      required: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  },
);

// Create indexes for better query performance
ReviewSchema.index({ bookId: 1, rating: -1 });
ReviewSchema.index({ verified: 1 });
ReviewSchema.index({ timestamp: -1 });

// Prevent model recompilation in development
const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;

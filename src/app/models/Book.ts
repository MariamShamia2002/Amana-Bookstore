import mongoose, { Schema, Model } from "mongoose";

// Define the Book interface for TypeScript
export interface IBook {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  image: string;
  isbn: string;
  genre: string[];
  tags: string[];
  datePublished: string;
  pages: number;
  language: string;
  publisher: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured: boolean;
}

// Define the Mongoose Schema
const BookSchema = new Schema<IBook>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
    },
    genre: {
      type: [String],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    datePublished: {
      type: String,
      required: true,
    },
    pages: {
      type: Number,
      required: true,
      min: 1,
    },
    language: {
      type: String,
      required: true,
      default: "English",
    },
    publisher: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true,
    },
    featured: {
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
BookSchema.index({ title: "text", author: "text", description: "text" });
BookSchema.index({ genre: 1 });
BookSchema.index({ featured: 1 });
BookSchema.index({ inStock: 1 });
BookSchema.index({ price: 1 });

// Prevent model recompilation in development
const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;

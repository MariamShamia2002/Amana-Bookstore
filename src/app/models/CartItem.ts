import mongoose, { Schema, Model } from "mongoose";

// Define the CartItem interface for TypeScript
export interface ICartItem {
  id: string;
  bookId: string;
  quantity: number;
  addedAt: string;
}

// Define the Mongoose Schema
const CartItemSchema = new Schema<ICartItem>(
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    addedAt: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  },
);

// Create indexes for better query performance
CartItemSchema.index({ bookId: 1 });
CartItemSchema.index({ addedAt: -1 });

// Prevent model recompilation in development
const CartItem: Model<ICartItem> =
  mongoose.models.CartItem ||
  mongoose.model<ICartItem>("CartItem", CartItemSchema);

export default CartItem;

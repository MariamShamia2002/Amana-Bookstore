// src/app/api/cart/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "../../lib/dbConnect";
import CartItem from "../../models/CartItem";

// GET /api/cart - Get all cart items
export async function GET() {
  try {
    await connectToDB();

    const cartItems = await CartItem.find().sort({ addedAt: -1 }).lean();

    return NextResponse.json({ cartItems });
  } catch (err) {
    console.error("Error fetching cart items:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch cart items",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: Request) {
  try {
    await connectToDB();

    const body = await request.json();
    const { bookId, quantity = 1 } = body;

    // Validate required fields
    if (!bookId) {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 },
      );
    }

    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({ bookId });

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += quantity;
      await existingItem.save();
      return NextResponse.json({
        message: "Cart item updated successfully",
        cartItem: existingItem,
      });
    }

    // Generate unique ID
    const id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new cart item
    const cartItem = await CartItem.create({
      id,
      bookId,
      quantity,
      addedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Item added to cart successfully",
        cartItem,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Error adding item to cart:", err);
    return NextResponse.json(
      {
        error: "Failed to add item to cart",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: Request) {
  try {
    await connectToDB();

    const body = await request.json();
    const { id, bookId, quantity } = body;

    // Validate required fields
    if (!id && !bookId) {
      return NextResponse.json(
        { error: "Either id or bookId is required" },
        { status: 400 },
      );
    }

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: "Valid quantity is required" },
        { status: 400 },
      );
    }

    // Find and update cart item
    const filter = id ? { id } : { bookId };

    if (quantity === 0) {
      // Remove item if quantity is 0
      await CartItem.findOneAndDelete(filter);
      return NextResponse.json({
        message: "Cart item removed successfully",
      });
    }

    const cartItem = await CartItem.findOneAndUpdate(
      filter,
      { quantity },
      { new: true },
    );

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Cart item updated successfully",
      cartItem,
    });
  } catch (err) {
    console.error("Error updating cart item:", err);
    return NextResponse.json(
      {
        error: "Failed to update cart item",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/cart - Remove item from cart
export async function DELETE(request: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");
    const bookId = searchParams.get("bookId");

    if (!itemId && !bookId) {
      return NextResponse.json(
        { error: "Either id or bookId is required" },
        { status: 400 },
      );
    }

    // Find and delete cart item
    const filter = itemId ? { id: itemId } : { bookId };
    const deletedItem = await CartItem.findOneAndDelete(filter);

    if (!deletedItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Item removed from cart successfully",
      deletedItem,
    });
  } catch (err) {
    console.error("Error removing cart item:", err);
    return NextResponse.json(
      {
        error: "Failed to remove item from cart",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Future implementation notes:
// - Session management for user carts (using NextAuth.js or similar)
// - Database integration patterns (Prisma, Drizzle, or raw SQL)
// - Cart persistence strategies:
//   * Guest carts: Store in localStorage/cookies with optional merge on login
//   * User carts: Store in database with user ID association
//   * Hybrid approach: localStorage for guests, database for authenticated users
// - Security considerations:
//   * Validate user ownership of cart items
//   * Sanitize input data
//   * Rate limiting to prevent abuse
// - Performance optimizations:
//   * Cache frequently accessed cart data
//   * Batch operations for multiple item updates
//   * Implement optimistic updates on the frontend

// Example future database integration:
// import { db } from '@/lib/database';
// import { getServerSession } from 'next-auth';
//
// export async function GET() {
//   const session = await getServerSession();
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
//
//   try {
//     const cartItems = await db.cartItem.findMany({
//       where: { userId: session.user.id },
//       include: { book: true }
//     });
//
//     return NextResponse.json(cartItems);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Failed to fetch cart items' },
//       { status: 500 }
//     );
//   }
// }

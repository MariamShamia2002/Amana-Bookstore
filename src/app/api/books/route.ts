// src/app/api/books/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "../../lib/dbConnect";
import Book from "../../models/Book";

// GET /api/books - Return all books from MongoDB
export async function GET(request: Request) {
  try {
    // Connect to database
    await connectToDB();

    // Get query parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const genre = searchParams.get("genre");
    const featured = searchParams.get("featured");
    const inStock = searchParams.get("inStock");
    const search = searchParams.get("search");

  // Build query filter
  const filter: Record<string, unknown> = {};

    if (genre) {
      filter.genre = { $in: [genre] };
    }

    if (featured !== null && featured !== undefined) {
      filter.featured = featured === "true";
    }

    if (inStock !== null && inStock !== undefined) {
      filter.inStock = inStock === "true";
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Fetch books with pagination
    const skip = (page - 1) * limit;
    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    // Get total count for pagination
    const total = await Book.countDocuments(filter);

    return NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch books",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Future implementation notes:
// - Connect to a database (e.g., PostgreSQL, MongoDB)
// - Add authentication middleware for admin operations
// - Implement pagination for large datasets
// - Add filtering and search query parameters
// - Include proper error handling and logging
// - Add rate limiting for API protection
// - Implement caching strategies for better performance

// Example future database integration:
// import { db } from '@/lib/database';
//
// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const page = parseInt(searchParams.get('page') || '1');
//   const limit = parseInt(searchParams.get('limit') || '10');
//   const genre = searchParams.get('genre');
//
//   try {
//     const books = await db.books.findMany({
//       where: genre ? { genre: { contains: genre } } : {},
//       skip: (page - 1) * limit,
//       take: limit,
//     });
//
//     return NextResponse.json(books);
//   } catch (error) {
//     return NextResponse.json(
//       { error: 'Database connection failed' },
//       { status: 500 }
//     );
//   }
// }

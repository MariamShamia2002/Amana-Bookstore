// src/app/api/books/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "../../lib/dbConnect";
import Book from "../../models/Book";
import { books as staticBooks } from "../../data/books";

// GET /api/books - Return all books from MongoDB
export async function GET(request: Request) {
  // Get query parameters for filtering/pagination
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const id = searchParams.get("id");
  const genre = searchParams.get("genre");
  const featured = searchParams.get("featured");
  const inStock = searchParams.get("inStock");
  const search = searchParams.get("search");

  // Build query filter for MongoDB
  const filter: Record<string, unknown> = {};
  if (id) filter.id = id;
  if (genre) filter.genre = { $in: [genre] };
  if (featured !== null && featured !== undefined)
    filter.featured = featured === "true";
  if (inStock !== null && inStock !== undefined)
    filter.inStock = inStock === "true";
  if (search) filter.$text = { $search: search };

  try {
    // Connect to database and attempt DB-backed fetch
    await connectToDB();

    const skip = (page - 1) * limit;
    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

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
    // Graceful fallback to static data when DB is unavailable
    console.error(
      "Error fetching books from DB, falling back to static data:",
      err,
    );

    // Apply equivalent filters to static data
    const filtered = staticBooks.filter((b) => {
      if (id && b.id !== id) return false;
      if (genre && !b.genre.includes(genre)) return false;
      if (featured !== null && featured !== undefined) {
        const feat = featured === "true";
        if (b.featured !== feat) return false;
      }
      if (inStock !== null && inStock !== undefined) {
        const stock = inStock === "true";
        if (b.inStock !== stock) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = `${b.title} ${b.author} ${b.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageItems = filtered.slice(start, end);

    return NextResponse.json({
      books: pageItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
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

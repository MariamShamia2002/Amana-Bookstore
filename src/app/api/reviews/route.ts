// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "../../lib/dbConnect";
import Review from "../../models/Review";

// GET /api/reviews - Get all reviews or filter by bookId
export async function GET(request: Request) {
  try {
    await connectToDB();

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");
    const verified = searchParams.get("verified");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query filter
    const filter: any = {};

    if (bookId) {
      filter.bookId = bookId;
    }

    if (verified !== null && verified !== undefined) {
      filter.verified = verified === "true";
    }

    // Fetch reviews with pagination
    const skip = (page - 1) * limit;
    const reviews = await Review.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 })
      .lean();

    // Get total count
    const total = await Review.countDocuments(filter);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch reviews",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/reviews - Add a new review
export async function POST(request: Request) {
  try {
    await connectToDB();

    const body = await request.json();
    const { bookId, author, rating, title, comment, verified = false } = body;

    // Validate required fields
    if (!bookId || !author || !rating || !title || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate rating
    if (rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 0 and 5" },
        { status: 400 },
      );
    }

    // Generate unique ID
    const id = `review-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create review
    const review = await Review.create({
      id,
      bookId,
      author,
      rating,
      title,
      comment,
      timestamp: new Date().toISOString(),
      verified,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    console.error("Error creating review:", err);
    return NextResponse.json(
      {
        error: "Failed to create review",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

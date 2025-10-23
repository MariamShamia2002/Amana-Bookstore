import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testConnection() {
  console.log("🔍 Testing MongoDB connection...");
  console.log(
    "📌 MongoDB URI:",
    process.env.MONGODB_URI ? "Found ✓" : "Not found ✗",
  );

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    console.log("\n💡 Please create a .env.local file with:");
    console.log("MONGODB_URI=your_mongodb_connection_string");
    process.exit(1);
  }

  try {
    console.log("\n⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Successfully connected to MongoDB!");
    console.log("📊 Connection details:");
    console.log("   - Database:", mongoose.connection.db.databaseName);
    console.log("   - Host:", mongoose.connection.host);
    console.log("   - Port:", mongoose.connection.port);
    console.log(
      "   - Ready state:",
      mongoose.connection.readyState === 1 ? "Connected ✓" : "Disconnected ✗",
    );

    await mongoose.connection.close();
    console.log("\n🔌 Connection closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

testConnection();

require("dotenv").config({ path: "/www/wwwroot/www.raidzonemarket.com/backend/.env" });
const { Client } = require("pg");
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function migrate() {
  const pgClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to Supabase (Postgres)...");
    await pgClient.connect();
    console.log("Connected to Supabase.");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/raidzone");
    console.log("Connected to MongoDB.");

    // 1. Migrate Products
    console.log("Fetching products from Postgres...");
    const res = await pgClient.query("SELECT * FROM products");
    const pgProducts = res.rows;
    console.log(`Found ${pgProducts.length} products in Supabase.`);

    if (pgProducts.length > 0) {
      // Clear existing first? User might want to append, but usually clear is safer for fresh migrate
      await Product.deleteMany({});
      console.log("Cleared existing MongoDB products.");

      const mongoProducts = pgProducts.map(p => ({
        name: p.name,
        game: p.game_slug || p.game || "other",
        tab: p.category_slug || p.tab || "other",
        itemType: p.item_type || "other",
        subType: p.sub_type || null,
        price: parseFloat(p.price) || 0,
        originalPrice: parseFloat(p.original_price) || null,
        region: p.region || "Global",
        stock: parseInt(p.stock) || 0,
        description: p.description || "",
        instructions: p.instructions || "",
        badge: p.badge || null,
        isFlash: !!p.is_flash,
        active: p.active !== false,
        image: p.image_url || p.image || null,
        createdAt: p.created_at || new Date(),
        updatedAt: p.updated_at || new Date()
      }));

      await Product.insertMany(mongoProducts);
      console.log(`Successfully migrated ${mongoProducts.length} products to MongoDB.`);
    }

    // Add more migrations if needed (categories, etc.)
    // Note: Our categories are currently hardcoded in Node, so maybe no need.

    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

migrate();

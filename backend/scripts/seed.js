const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Blueprint = require("../models/Blueprint");

const MONGO_URI = "mongodb://localhost:27017/raidzone";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // 1. Clear everything
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Blueprint.deleteMany({});
    await require("../models/ItemType").deleteMany({});
    await require("../models/User").deleteMany({});
    console.log("Cleared database.");

    // 1.5 Create Admin User
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const User = require("../models/User");
    await User.create({
      name: "Admin",
      email: "admin@raidzonemarket.com",
      password: hashedPassword,
      role: "ADMIN"
    });
    console.log("Seeded admin user.");

    // 2. Create Base Categories (Games)
    const games = [
      { name: "Arc Raiders", slug: "arc-raiders", order: 1 },
      { name: "CS2", slug: "cs2", order: 2 },
      { name: "Delta Force", slug: "delta-force", order: 3 },
      { name: "Windrose", slug: "windrose", order: 4 }
    ];

    const savedGames = await Category.insertMany(games);
    console.log(`Seeded ${savedGames.length} games.`);

    const arcId = savedGames.find(g => g.slug === "arc-raiders")._id;
    const cs2Id = savedGames.find(g => g.slug === "cs2")._id;

    // 3. Create Subcategories (Tabs)
    const subcats = [
      { name: "Coins", slug: "coins", parentId: arcId, order: 1 },
      { name: "Accounts", slug: "accounts", parentId: arcId, order: 2 },
      { name: "Boosting", slug: "boosting", parentId: arcId, order: 3 },
      { name: "Skins", slug: "skins", parentId: cs2Id, order: 1 }
    ];
    const savedSubs = await Category.insertMany(subcats);
    console.log(`Seeded ${savedSubs.length} subcategories.`);

    // 4. Seed Blueprints & ItemTypes
    const itemTypes = [
      { name: "Currency", slug: "currency", sortOrder: 1 },
      { name: "Accounts", slug: "accounts", sortOrder: 2 },
      { name: "Skins", slug: "skins", sortOrder: 3 },
      { name: "Boosting", slug: "boosting", sortOrder: 4 }
    ];
    const ItemType = require("../models/ItemType");
    await ItemType.insertMany(itemTypes);
    console.log("Seeded item types.");

    const blueprints = [
      { name: "Coins", slug: "currency", itemType: "currency", game: "arc-raiders", keywords: ["coin", "gold"] },
      { name: "Accounts", slug: "account", itemType: "account", game: "any", keywords: ["account", "rank"] },
      { name: "Weapon Skins", slug: "skin", itemType: "skin", game: "cs2", keywords: ["knife", "factory new"] }
    ];
    await Blueprint.insertMany(blueprints);
    console.log("Seeded blueprints.");

    // 5. Seed Products
    const productsData = [
      {
        name: "5,000 Arc Raiders Coins",
        game: "arc-raiders",
        categoryId: arcId,
        tab: "coins",
        itemType: "currency",
        price: 45.00,
        originalPrice: 55.00,
        region: "Global",
        stock: 500,
        badge: "-18%",
        isFlashDeal: true,
        image: "/uploads/arc_coins.jpg"
      },
      {
        name: "CS2: Global Elite Account",
        game: "cs2",
        categoryId: cs2Id,
        tab: "accounts",
        itemType: "account",
        price: 89.00,
        region: "Global",
        stock: 5,
        badge: "PREMIUM",
        image: "/uploads/cs2_account.jpg"
      }
    ];

    await Product.insertMany(productsData);
    console.log("Seeded products.");

    console.log("🔥 SUCCESS: Database is now fully populated and relational!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();

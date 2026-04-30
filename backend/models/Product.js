const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: String,
  game: String, // Legacy slug for compat
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tab: String,

  itemType: String,
  subType: String,

  price: Number,
  originalPrice: Number,

  region: String,
  stock: Number,

  description: String,
  instructions: String,

  badge: String,
  isFlashDeal: { type: Boolean, default: false },
  active: { type: Boolean, default: true },

  image: String,
  imageUrl: String,

  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  views: { type: Number, default: 0 }
}, { timestamps: true });

// Optimize for Eldorado-grade filtering speed
ProductSchema.index({ game: 1, tab: 1, itemType: 1 });

module.exports = mongoose.model("Product", ProductSchema);

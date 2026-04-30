const mongoose = require("mongoose");

const ItemTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sortOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

ItemTypeSchema.index({ sortOrder: 1 });

module.exports = mongoose.model("ItemType", ItemTypeSchema);

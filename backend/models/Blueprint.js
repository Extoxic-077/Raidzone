const mongoose = require("mongoose");

const BlueprintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  itemType: { type: String, required: true }, // slug of ItemType
  game: { type: String, required: true },
  keywords: [{ type: String }],
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Optimize for fast lookup by slug and game
BlueprintSchema.index({ slug: 1, game: 1 });
BlueprintSchema.index({ itemType: 1 });

module.exports = mongoose.model("Blueprint", BlueprintSchema);

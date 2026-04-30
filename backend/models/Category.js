const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  image: String
}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);

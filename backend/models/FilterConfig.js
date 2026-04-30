const mongoose = require("mongoose");

const FilterConfigSchema = new mongoose.Schema({
  game: { type: String, required: true },
  tab: { type: String, required: true },
  filters: [{
    label: { type: String, required: true },
    key: { type: String, required: true },
    type: { type: String, enum: ['dropdown', 'chips', 'range', 'search'], default: 'dropdown' },
    placeholder: { type: String },
    order: { type: Number, default: 0 }
  }]
}, { timestamps: true });

// Ensure unique config per game/tab combination
FilterConfigSchema.index({ game: 1, tab: 1 }, { unique: true });

module.exports = mongoose.model("FilterConfig", FilterConfigSchema);

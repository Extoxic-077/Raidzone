const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: Number,
    price: Number,
    lineTotal: Number,
    imageUrl: String,
    keyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Key' }
  }],
  totalAmount: Number,
  status: { 
    type: String, 
    enum: ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING_PAYMENT'
  },
  shippingName: String,
  paymentProvider: String,
  discountAmount: { type: Number, default: 0 },
  couponCode: String
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);

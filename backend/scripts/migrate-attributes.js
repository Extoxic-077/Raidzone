const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function migrate() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/raidzone';
    await mongoose.connect(uri);
    console.log('Connected');

    const products = await Product.find({});
    console.log(`Processing ${products.length} products...`);

    let count = 0;
    for (const p of products) {
      let changed = false;
      const attrs = p.attributes || {};

      // Fields to move
      const fields = ['itemType', 'subType', 'region', 'brand'];
      
      fields.forEach(f => {
        if (p[f] !== undefined && p[f] !== null && p[f] !== '') {
          if (!attrs[f]) {
            attrs[f] = p[f];
            changed = true;
          }
        }
      });

      if (changed) {
        p.attributes = attrs;
        // Optional: clear root fields if you want to be clean, 
        // but keeping them for now as fallback is safer during transition.
        // p.itemType = undefined; 
        await p.save();
        count++;
      }
    }

    console.log(`Migration complete. Updated ${count} products.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();

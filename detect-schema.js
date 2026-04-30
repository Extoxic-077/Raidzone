const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./backend/models/Product');

async function detect() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/raidzone';
    await mongoose.connect(uri);
    console.log('Connected');

    const products = await Product.find({}).lean();
    console.log(`Total Products: ${products.length}`);

    const stats = {
      rootBlueprint: 0,
      attrBlueprint: 0,
      rootItemType: 0,
      attrItemType: 0,
      bothBlueprint: 0,
      none: 0
    };

    products.forEach(p => {
      const hasRootBp = !!p.subType;
      const hasAttrBp = p.attributes && !!p.attributes.subType;
      const hasRootIt = !!p.itemType;
      const hasAttrIt = p.attributes && !!p.attributes.itemType;

      if (hasRootBp) stats.rootBlueprint++;
      if (hasAttrBp) stats.attrBlueprint++;
      if (hasRootBp && hasAttrBp) stats.bothBlueprint++;
      if (hasRootIt) stats.rootItemType++;
      if (hasAttrIt) stats.attrItemType++;
      if (!hasRootBp && !hasAttrBp) stats.none++;
    });

    console.log('Schema Detection Results:', JSON.stringify(stats, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

detect();

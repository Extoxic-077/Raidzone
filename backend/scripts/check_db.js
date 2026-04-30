const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/raidzone');
  const count = await mongoose.connection.db.collection('products').countDocuments();
  console.log(`Current product count: ${count}`);
  const sample = await mongoose.connection.db.collection('products').find({}).limit(5).toArray();
  console.log('Sample products:', JSON.stringify(sample, null, 2));
  process.exit(0);
}

check();

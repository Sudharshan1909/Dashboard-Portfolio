// Throwaway connectivity check: node .atlas-check.mjs
import mongoose from 'mongoose';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.match(/^MONGODB_URI=(.+)$/m)[1].trim();

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const info = await mongoose.connection.db.admin().serverStatus();
  console.log('CONNECTED db=%s mongo=%s', mongoose.connection.name, info.version);
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('collections:', cols.map((c) => c.name));
} catch (e) {
  console.log('FAILED:', e.message);
} finally {
  await mongoose.disconnect();
}

// Throwaway: node .atlas-diag.mjs  — figures out WHY the Atlas connect fails.
import mongoose from 'mongoose';
import dns from 'dns/promises';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.match(/^MONGODB_URI=(.+)$/m)[1].trim();

const m = uri.match(/^mongodb(\+srv)?:\/\/([^:]*):([^@]*)@([^/?]+)\/([^?]*)/);
console.log('scheme      :', m?.[1] ? 'mongodb+srv' : 'mongodb');
console.log('username    :', m?.[2] || '(none)');
console.log('password    :', m?.[3] ? `(${m[3].length} chars)` : '(none)');
console.log('host        :', m?.[4]);
console.log('database    :', m?.[5] || '(NONE — defaults to "test")');

try {
  const srv = await dns.resolveSrv(`_mongodb._tcp.${m[4]}`);
  console.log('SRV lookup  : OK ->', srv.map((s) => s.name).join(', '));
} catch (e) {
  console.log('SRV lookup  : FAILED —', e.code, '(cluster name wrong, or DNS blocked)');
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
  console.log('connect     : OK, db =', mongoose.connection.name);
  const cols = await mongoose.connection.db.listCollections().toArray();
  console.log('collections :', cols.map((c) => c.name).join(', ') || '(empty)');
} catch (e) {
  console.log('connect     : FAILED');
  console.log('  name      :', e.name);
  console.log('  message   :', e.message.split('\n')[0].slice(0, 200));
  if (e.reason) {
    console.log('  topology  :', e.reason.type);
    for (const [addr, s] of e.reason.servers ?? []) {
      console.log(`  server ${addr} -> ${s.error?.message?.slice(0, 120) ?? s.type}`);
    }
  }
} finally {
  await mongoose.disconnect();
}

const ip = await fetch('https://api.ipify.org').then((r) => r.text()).catch(() => 'unknown');
console.log('your public IP:', ip);

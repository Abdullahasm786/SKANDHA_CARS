// Creates or updates an administrator. Run locally: node --env-file=.env.local scripts/create-admin.mjs owner@example.com
// The password is typed at the prompt (never passed via argv or stored in shell history).
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import readline from "node:readline/promises";
import { MongoClient } from "mongodb";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.env.MONGODB_URI) { console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <email>  (needs MONGODB_URI)"); process.exit(1); }
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question("Password (min 12 chars): ");
rl.close();
if (password.length < 12) { console.error("Password too short."); process.exit(1); }

const client = await new MongoClient(process.env.MONGODB_URI).connect();
const admins = client.db(process.env.MONGODB_DB || "skandha_cars").collection("admins");
await admins.createIndex({ email: 1 }, { unique: true });
await admins.updateOne({ email }, { $set: { password_hash: await bcrypt.hash(password, 12), updated_at: new Date() }, $setOnInsert: { _id: randomUUID(), email, created_at: new Date() } }, { upsert: true });
await client.close();
console.log(`✔ ${email} can now sign in at /admin/login`);

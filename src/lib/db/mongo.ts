import { MongoClient, type Db } from "mongodb";

declare global {
  var __mongo: { client: Promise<MongoClient>; indexed?: Promise<void> } | undefined;
}

export function mongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  globalThis.__mongo ??= { client: new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect() };
  return globalThis.__mongo.client;
}

/** Returns the database, creating indexes once per process. */
export async function getDb(): Promise<Db> {
  const client = await mongoClient();
  const db = client.db(process.env.MONGODB_DB || "skandha_cars");
  globalThis.__mongo!.indexed ??= createIndexes(db);
  await globalThis.__mongo!.indexed;
  return db;
}

async function createIndexes(db: Db) {
  await Promise.all([
    db.collection("vehicles").createIndex({ slug: 1 }, { unique: true }),
    db.collection("vehicles").createIndex({ publication_status: 1, inventory_status: 1, published_at: -1 }),
    db.collection("vehicles").createIndex({ price_inr: 1 }),
    db.collection("vehicles").createIndex({ model_year: -1 }),
    db.collection("admins").createIndex({ email: 1 }, { unique: true }),
    db.collection("vehicle_status_history").createIndex({ vehicle_id: 1, changed_at: -1 }),
    db.collection("vehicle_slug_redirects").createIndex({ vehicle_id: 1 }),
  ]);
}

/** Runs a read; on any DB error (unreachable, misconfigured) returns the fallback so public pages degrade to empty states. */
export async function safe<T>(fn: (db: Db) => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.MONGODB_URI) return fallback;
  try {
    return await fn(await getDb());
  } catch (e) {
    console.error("[db]", e instanceof Error ? e.message : e);
    return fallback;
  }
}

/** Converts a Mongo document into the plain, client-safe shape used across the app (`_id`→`id`, Date→ISO). */
export function serialize<T>(doc: unknown): T {
  if (doc instanceof Date) return doc.toISOString() as T;
  if (Array.isArray(doc)) return doc.map((d) => serialize(d)) as T;
  if (doc && typeof doc === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc)) out[k === "_id" ? "id" : k] = serialize(v);
    return out as T;
  }
  return doc as T;
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

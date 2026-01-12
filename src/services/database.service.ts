import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const isProd = process.env.NODE_ENV === "production";

const adapter = new PrismaPg({
  connectionString,
  ssl: isProd ? { rejectUnauthorized: false } : undefined,
});
const db = new PrismaClient({ adapter });

export { db };

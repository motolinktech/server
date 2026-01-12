import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const db = new PrismaClient({ adapter });

export { db };

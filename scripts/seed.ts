import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashService } from "../src/services/hash.service";

const pool = new Pool({
  connectionString: `${process.env.DATABASE_URL}`,
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const branches = [
    { code: "RJ", name: "Rio de Janeiro" },
    { code: "SP", name: "São Paulo" },
    { code: "CAM", name: "Campinas" },
  ];

  for (const b of branches) {
    const branch = await db.branch.upsert({
      where: { code: b.code },
      update: { name: b.name },
      create: { code: b.code, name: b.name },
    });
    console.log(`Branch ensured: ${branch.code} - ${branch.name}`);
  }

  const adminEmail = "admin@gmail.com";
  const adminName = "Administrador";
  const adminPassword = "1234567Aa!";

  const existing = await db.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`User already exists: ${existing.email}`);
  } else {
    const hashed = await hashService().hash(adminPassword);
    const user = await db.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
      },
    });

    console.log(`Created user: ${user.email}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await db.$disconnect();
    } catch (_e) {
      // ignore
    }
  });

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { hashService } from "../services/hash.service.js";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const db = new PrismaClient({ adapter });

async function createUser() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Administrador";

    if (!email || !password) {
      console.error("❌ Erro: ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios.");
      console.error(
        "Use: ADMIN_EMAIL=email@example.com ADMIN_PASSWORD=senha bun run src/scripts/create-user.js",
      );
      process.exit(1);
    }

    console.log(`🔄 Verificando usuário com email: ${email}...`);

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`✅ Usuário com email ${email} já existe!`);
      await db.$disconnect();
      process.exit(0);
    }

    console.log("⚙️  Criando novo usuário ADMIN...");

    const { hash } = hashService();
    const hashedPassword = await hash(password);

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        permissions: [],
        branches: [],
        documents: [],
      },
    });

    console.log("✅ Usuário ADMIN criado com sucesso!");

    await db.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
    await db.$disconnect();
    process.exit(1);
  }
}

createUser();

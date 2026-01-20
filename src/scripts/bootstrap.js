import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { hashService } from "../services/hash.service.js";

const connectionString = `${process.env.DATABASE_URL}`;
const isProd = process.env.NODE_ENV === "production";
const adapter = new PrismaPg({
  connectionString,
  ...(isProd && { ssl: { rejectUnauthorized: false } }),
});
const db = new PrismaClient({ adapter });

async function createBranches() {
  try {
    console.log("Criando filiais padrão...");

    const branchesData = [
      {
        name: "Rio de Janeiro",
        code: "RJ",
      },
      {
        name: "São Paulo",
        code: "SP",
      },
      {
        name: "Campinas",
        code: "CAM",
      },
    ];

    for (const branch of branchesData) {
      const existingBranch = await db.branch.findUnique({
        where: { code: branch.code },
      });

      if (existingBranch) {
        console.log(`✅ Filial com nome ${existingBranch.name} já existe!`);
        continue;
      }

      await db.branch.create({
        data: { name: branch.name, code: branch.code },
      });

      console.log(`✅ Filial ${branch.name} criada com sucesso!`);
    }
  } catch (error) {
    console.error("❌ Erro ao criar filiais:", error);
  }
}

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
      return;
    }

    console.log(`🔄 Verificando usuário com email: ${email}...`);

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`✅ Usuário com email ${email} já existe!`);
      return;
    }

    console.log("⚙️  Criando novo usuário ADMIN...");

    const { hash } = hashService();
    const hashedPassword = await hash(password);

    const branches = await db.branch.findMany();

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        permissions: [],
        branches: branches.map((branch) => branch.id),
        files: [],
      },
    });

    console.log("✅ Usuário ADMIN criado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar usuário:", error);
  }
}

async function bootstrap() {
  try {
    await createBranches();
    await createUser();
    await db.$disconnect();
  } catch (error) {
    console.error("❌ Erro no bootstrap:", error);
    await db.$disconnect();
    process.exit(1);
  }
}

bootstrap();

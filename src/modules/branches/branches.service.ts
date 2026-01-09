import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import type { BranchMutateDTO } from "./branches.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function branchesService() {
  return {
    async create(data: Omit<BranchMutateDTO, "id">) {
      const branch = await db.branch.create({
        data: {
          ...data,
        },
      });

      return branch;
    },

    async update(id: string, data: Partial<Omit<BranchMutateDTO, "id">>) {
      const existing = await db.branch.findUnique({ where: { id } });

      if (!existing) {
        throw new AppError("Filial não encontrada.", 404);
      }

      const updated = await db.branch.update({ where: { id }, data });

      return updated;
    },

    async getById(id: string) {
      const branch = await db.branch.findUnique({ where: { id } });

      if (!branch) {
        throw new AppError("Filial não encontrada.", 404);
      }

      return branch;
    },

    async list(input: { page?: number; limit?: number; search?: string }) {
      const { page = 1, limit = PAGE_SIZE, search } = input;

      const where: Prisma.BranchWhereInput = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { address: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [data, count] = await db.$transaction([
        db.branch.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { id: "asc" },
        }),
        db.branch.count({ where }),
      ]);

      return { data, count };
    },
  };
}

export type BranchesService = ReturnType<typeof branchesService>;

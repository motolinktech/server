import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import type { ListRegionsDTO, RegionsMutateDTO } from "./regions.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function regionsService() {
  return {
    async create(data: Omit<RegionsMutateDTO, "id">) {
      const region = await db.region.create({
        data,
      });

      return region;
    },

    async edit(data: Partial<RegionsMutateDTO>) {
      const existingRegion = await db.region.findUnique({
        where: { id: data.id },
      });

      if (!existingRegion) {
        throw new AppError("Região não encontrada.", 404);
      }

      const updatedRegion = await db.region.update({
        where: { id: data.id },
        data,
      });

      return updatedRegion;
    },

    async delete(id: string) {
      const existingRegion = await db.region.findUnique({
        where: { id },
      });

      if (!existingRegion) {
        throw new AppError("Região não encontrada.", 404);
      }

      const deletedRegion = await db.region.delete({
        where: { id },
      });

      return deletedRegion;
    },

    async getById(id: string) {
      const region = await db.region.findUnique({
        where: { id },
      });

      if (!region) {
        throw new AppError("Região não encontrada.", 404);
      }

      return region;
    },

    async listAll(input: ListRegionsDTO = {}) {
      const { page = 1, limit = PAGE_SIZE, name, branchId } = input;

      const where: Prisma.RegionWhereInput = {
        ...(name
          ? {
              name: {
                contains: name,
                mode: "insensitive",
              },
            }
          : {}),
        ...(branchId ? { branchId } : {}),
      };

      const [regions, count] = await db.$transaction([
        db.region.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { name: "asc" },
        }),
        db.region.count({ where }),
      ]);

      return {
        data: regions,
        count,
      };
    },
  };
}

export type RegionsService = ReturnType<typeof regionsService>;
export type ListRegionsServiceResponse = Awaited<
  ReturnType<RegionsService["listAll"]>
>;

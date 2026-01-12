import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import type { GroupsMutateDTO, ListGroupsDTO } from "./groups.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function groupsService() {
  return {
    async create(data: Omit<GroupsMutateDTO, "id">) {
      const group = await db.group.create({
        data,
      });

      return group;
    },

    async edit(data: Partial<GroupsMutateDTO>) {
      const existingGroup = await db.group.findUnique({
        where: { id: data.id },
      });

      if (!existingGroup) {
        throw new AppError("Grupo não encontrado.", 404);
      }

      const updatedGroup = await db.group.update({
        where: { id: data.id },
        data,
      });

      return updatedGroup;
    },

    async delete(id: string) {
      const existingGroup = await db.group.findUnique({
        where: { id },
      });

      if (!existingGroup) {
        throw new AppError("Grupo não encontrado.", 404);
      }

      const deletedGroup = await db.group.delete({
        where: { id },
      });

      return deletedGroup;
    },

    async getById(id: string) {
      const group = await db.group.findUnique({
        where: { id },
        include: {
          clients: true,
        }
      });

      if (!group) {
        throw new AppError("Grupo não encontrado.", 404);
      }

      return group;
    },

    async listAll(input: ListGroupsDTO = {}) {
      const { page = 1, limit = PAGE_SIZE, name, branchId } = input;

      const where: Prisma.GroupWhereInput = {
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

      const [groups, count] = await db.$transaction([
        db.group.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        }),
        db.group.count({ where }),
      ]);

      return {
        data: groups,
        count,
      };
    },
  };
}

export type GroupsService = ReturnType<typeof groupsService>;
export type ListGroupsServiceResponse = Awaited<
  ReturnType<GroupsService["listAll"]>
>;

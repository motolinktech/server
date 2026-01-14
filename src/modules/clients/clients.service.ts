import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import type {
  ClientMutateDTO,
  ClientWithCommercialConditionDTO,
  CommercialConditionDTO,
  ListClientsDTO,
} from "./clients.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function clientsService() {
  return {
    async create(data: ClientWithCommercialConditionDTO) {
      const { client, commercialCondition } = data;

      const result = await db.client.create({
        data: {
          ...client,
        },
      });

      if (commercialCondition) {
        await db.commercialCondition.create({
          data: {
            ...commercialCondition,
            clientId: result.id,
          },
        });
      }

      return result;
    },

    async edit(
      id: string,
      data: {
        client?: Partial<ClientMutateDTO>;
        commercialCondition?: Partial<CommercialConditionDTO>;
      },
    ) {
      const existingClient = await db.client.findUnique({
        where: { id },
        include: { commercialCondition: true },
      });

      if (!existingClient) {
        throw new AppError("Cliente não encontrado.", 404);
      }

      if (existingClient.isDeleted) {
        throw new AppError("Cliente foi deletado.", 400);
      }

      const result = await db.client.update({
        where: { id },
        data: {
          ...data.client,
          commercialCondition: data.commercialCondition
            ? {
                update: data.commercialCondition,
              }
            : undefined,
        },
        include: { commercialCondition: true },
      });

      return result;
    },

    async delete(id: string) {
      const existingClient = await db.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new AppError("Cliente não encontrado.", 404);
      }

      if (existingClient.isDeleted) {
        throw new AppError("Cliente já foi deletado.", 400);
      }

      const deletedClient = await db.client.update({
        where: { id },
        data: { isDeleted: true },
      });

      return deletedClient;
    },

    async getById(id: string) {
      const client = await db.client.findUnique({
        where: { id },
        include: {
          branch: true,
          region: true,
          group: true,
          commercialCondition: true,
        },
      });

      if (!client) {
        throw new AppError("Cliente não encontrado.", 404);
      }

      return client;
    },

    async listAllSimplified(input: ListClientsDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        name,
        cnpj,
        city,
        uf,
        branchId,
        regionId,
        groupId,
        isDeleted = false,
      } = input;

      const where: Prisma.ClientWhereInput = {
        isDeleted,
        ...(name
          ? {
              name: {
                contains: name,
                mode: "insensitive",
              },
            }
          : {}),
        ...(cnpj
          ? {
              cnpj: {
                contains: cnpj,
                mode: "insensitive",
              },
            }
          : {}),
        ...(city
          ? {
              city: {
                contains: city,
                mode: "insensitive",
              },
            }
          : {}),
        ...(uf
          ? {
              uf: {
                contains: uf,
                mode: "insensitive",
              },
            }
          : {}),
        ...(branchId ? { branchId } : {}),
        ...(regionId ? { regionId } : {}),
        ...(groupId ? { groupId } : {}),
      };

      const [clients, count] = await db.$transaction([
        db.client.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { name: "asc" },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            region: {
              select: {
                id: true,
                name: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        db.client.count({ where }),
      ]);

      return {
        data: clients,
        count,
      };
    },

    async listAllComplete(input: ListClientsDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        name,
        cnpj,
        city,
        uf,
        branchId,
        regionId,
        groupId,
        isDeleted = false,
      } = input;

      const where: Prisma.ClientWhereInput = {
        isDeleted,
        ...(name
          ? {
              name: {
                contains: name,
                mode: "insensitive",
              },
            }
          : {}),
        ...(cnpj
          ? {
              cnpj: {
                contains: cnpj,
                mode: "insensitive",
              },
            }
          : {}),
        ...(city
          ? {
              city: {
                contains: city,
                mode: "insensitive",
              },
            }
          : {}),
        ...(uf
          ? {
              uf: {
                contains: uf,
                mode: "insensitive",
              },
            }
          : {}),
        ...(branchId ? { branchId } : {}),
        ...(regionId ? { regionId } : {}),
        ...(groupId ? { groupId } : {}),
      };

      const [clients, count] = await db.$transaction([
        db.client.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { name: "asc" },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            region: {
              select: {
                id: true,
                name: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
              },
            },
            commercialCondition: true,
          },
        }),
        db.client.count({ where }),
      ]);

      return {
        data: clients,
        count,
      };
    },
  };
}

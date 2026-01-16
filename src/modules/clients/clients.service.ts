import {
  type CommercialCondition,
  Prisma,
} from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import type {
  ClientMutateDTO,
  ClientWithCommercialConditionDTO,
  CommercialConditionDTO,
  ListClientsDTO,
} from "./clients.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

function formatCommercialConditionResponse(cc: CommercialCondition) {
  return {
    ...cc,
    clientDailyDay: cc.clientDailyDay.toString(),
    clientDailyDayWknd: cc.clientDailyDayWknd.toString(),
    clientDailyNight: cc.clientDailyNight.toString(),
    clientDailyNightWknd: cc.clientDailyNightWknd.toString(),
    clientPerDelivery: cc.clientPerDelivery.toString(),
    clientAdditionalKm: cc.clientAdditionalKm.toString(),
    deliverymanDailyDay: cc.deliverymanDailyDay.toString(),
    deliverymanDailyDayWknd: cc.deliverymanDailyDayWknd.toString(),
    deliverymanDailyNight: cc.deliverymanDailyNight.toString(),
    deliverymanDailyNightWknd: cc.deliverymanDailyNightWknd.toString(),
    deliverymanPerDelivery: cc.deliverymanPerDelivery.toString(),
    deliverymanAdditionalKm: cc.deliverymanAdditionalKm.toString(),
  };
}

function parseCommercialConditionInput(input: CommercialConditionDTO) {
  return {
    ...input,
    clientDailyDay: input.clientDailyDay
      ? new Prisma.Decimal(input.clientDailyDay)
      : undefined,
    clientDailyDayWknd: input.clientDailyDayWknd
      ? new Prisma.Decimal(input.clientDailyDayWknd)
      : undefined,
    clientDailyNight: input.clientDailyNight
      ? new Prisma.Decimal(input.clientDailyNight)
      : undefined,
    clientDailyNightWknd: input.clientDailyNightWknd
      ? new Prisma.Decimal(input.clientDailyNightWknd)
      : undefined,
    clientPerDelivery: input.clientPerDelivery
      ? new Prisma.Decimal(input.clientPerDelivery)
      : undefined,
    clientAdditionalKm: input.clientAdditionalKm
      ? new Prisma.Decimal(input.clientAdditionalKm)
      : undefined,
    deliverymanDailyDay: input.deliverymanDailyDay
      ? new Prisma.Decimal(input.deliverymanDailyDay)
      : undefined,
    deliverymanDailyDayWknd: input.deliverymanDailyDayWknd
      ? new Prisma.Decimal(input.deliverymanDailyDayWknd)
      : undefined,
    deliverymanDailyNight: input.deliverymanDailyNight
      ? new Prisma.Decimal(input.deliverymanDailyNight)
      : undefined,
    deliverymanDailyNightWknd: input.deliverymanDailyNightWknd
      ? new Prisma.Decimal(input.deliverymanDailyNightWknd)
      : undefined,
    deliverymanPerDelivery: input.deliverymanPerDelivery
      ? new Prisma.Decimal(input.deliverymanPerDelivery)
      : undefined,
    deliverymanAdditionalKm: input.deliverymanAdditionalKm
      ? new Prisma.Decimal(input.deliverymanAdditionalKm)
      : undefined,
  };
}

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
        const parsedCondition =
          parseCommercialConditionInput(commercialCondition);
        await db.commercialCondition.create({
          data: {
            ...parsedCondition,
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

      const parsedCondition = data.commercialCondition
        ? parseCommercialConditionInput(data.commercialCondition)
        : undefined;

      const result = await db.client.update({
        where: { id },
        data: {
          ...data.client,
          commercialCondition: parsedCondition
            ? {
                update: parsedCondition,
              }
            : undefined,
        },
        include: { commercialCondition: true },
      });

      return {
        ...result,
        commercialCondition: result.commercialCondition
          ? formatCommercialConditionResponse(result.commercialCondition)
          : null,
      };
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

      return {
        ...client,
        commercialCondition: client.commercialCondition
          ? formatCommercialConditionResponse(client.commercialCondition)
          : null,
      };
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
        data: clients.map((client) => ({
          ...client,
          commercialCondition: client.commercialCondition
            ? formatCommercialConditionResponse(client.commercialCondition)
            : null,
        })),
        count,
      };
    },
  };
}

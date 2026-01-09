import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import type {
  DeliverymenMutateDTO,
  ListDeliverymenDTO,
} from "./deliverymen.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function deliverymenService() {
  return {
    async create(data: Omit<DeliverymenMutateDTO, "id">) {
      const deliveryman = await db.deliveryman.create({
        data,
      });

      return deliveryman;
    },

    async edit(data: Partial<DeliverymenMutateDTO>) {
      const existingDeliveryman = await db.deliveryman.findUnique({
        where: { id: data.id },
      });

      if (!existingDeliveryman) {
        throw new AppError("Entregador não encontrado.", 404);
      }

      if (existingDeliveryman.isDeleted) {
        throw new AppError("Entregador foi deletado.", 400);
      }

      const updatedDeliveryman = await db.deliveryman.update({
        where: { id: data.id },
        data,
      });

      return updatedDeliveryman;
    },

    async delete(id: string) {
      const existingDeliveryman = await db.deliveryman.findUnique({
        where: { id },
      });

      if (!existingDeliveryman) {
        throw new AppError("Entregador não encontrado.", 404);
      }

      if (existingDeliveryman.isDeleted) {
        throw new AppError("Entregador já foi deletado.", 400);
      }

      const deletedDeliveryman = await db.deliveryman.update({
        where: { id },
        data: { isDeleted: true },
      });

      return deletedDeliveryman;
    },

    async toggleBlock(id: string) {
      const existingDeliveryman = await db.deliveryman.findUnique({
        where: { id },
      });

      if (!existingDeliveryman) {
        throw new AppError("Entregador não encontrado.", 404);
      }

      if (existingDeliveryman.isDeleted) {
        throw new AppError("Entregador foi deletado.", 400);
      }

      const updatedDeliveryman = await db.deliveryman.update({
        where: { id },
        data: { isBlocked: !existingDeliveryman.isBlocked },
      });

      return updatedDeliveryman;
    },

    async getById(id: string) {
      const deliveryman = await db.deliveryman.findUnique({
        where: { id },
        include: {
          branch: true,
          region: true,
        },
      });

      if (!deliveryman) {
        throw new AppError("Entregador não encontrado.", 404);
      }

      return deliveryman;
    },

    async listAll(input: ListDeliverymenDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        name,
        document,
        phone,
        contractType,
        branchId,
        regionId,
        isBlocked,
        isDeleted = false,
      } = input;

      const where: Prisma.DeliverymanWhereInput = {
        isDeleted,
        ...(name
          ? {
              name: {
                contains: name,
                mode: "insensitive",
              },
            }
          : {}),
        ...(document
          ? {
              document: {
                contains: document,
                mode: "insensitive",
              },
            }
          : {}),
        ...(phone
          ? {
              phone: {
                contains: phone,
                mode: "insensitive",
              },
            }
          : {}),
        ...(contractType ? { contractType } : {}),
        ...(branchId ? { branchId } : {}),
        ...(regionId ? { regionId } : {}),
        ...(isBlocked !== undefined ? { isBlocked } : {}),
      };

      const [deliverymen, count] = await db.$transaction([
        db.deliveryman.findMany({
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
          },
        }),
        db.deliveryman.count({ where }),
      ]);

      return {
        data: deliverymen,
        count,
      };
    },
  };
}

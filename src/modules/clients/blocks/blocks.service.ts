import { db } from "../../../services/database.service";
import { AppError } from "../../../utils/appError";
import type { CreateClientBlockDTO } from "./blocks.schema";

export function blocksService() {
  return {
    async create(clientId: string, data: CreateClientBlockDTO) {
      const client = await db.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new AppError("Cliente não encontrado.", 404);
      }

      if (client.isDeleted) {
        throw new AppError("Cliente foi deletado.", 400);
      }

      const deliveryman = await db.deliveryman.findUnique({
        where: { id: data.deliverymanId },
      });

      if (!deliveryman) {
        throw new AppError("Entregador não encontrado.", 404);
      }

      if (deliveryman.isDeleted) {
        throw new AppError("Entregador foi deletado.", 400);
      }

      const existingBlock = await db.clientBlock.findUnique({
        where: {
          clientId_deliverymanId: {
            clientId,
            deliverymanId: data.deliverymanId,
          },
        },
      });

      if (existingBlock) {
        throw new AppError(
          "Este entregador já está bloqueado para este cliente.",
          400,
        );
      }

      const block = await db.clientBlock.create({
        data: {
          clientId,
          deliverymanId: data.deliverymanId,
          reason: data.reason,
        },
        include: {
          deliveryman: {
            select: {
              id: true,
              name: true,
              document: true,
              phone: true,
            },
          },
        },
      });

      return block;
    },

    async delete(clientId: string, blockId: string) {
      const block = await db.clientBlock.findUnique({
        where: { id: blockId },
      });

      if (!block) {
        throw new AppError("Bloqueio não encontrado.", 404);
      }

      if (block.clientId !== clientId) {
        throw new AppError(
          "Este bloqueio não pertence ao cliente especificado.",
          403,
        );
      }

      const deletedBlock = await db.clientBlock.delete({
        where: { id: blockId },
        include: {
          deliveryman: {
            select: {
              id: true,
              name: true,
              document: true,
              phone: true,
            },
          },
        },
      });

      return deletedBlock;
    },

    async listByClient(clientId: string) {
      const client = await db.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new AppError("Cliente não encontrado.", 404);
      }

      if (client.isDeleted) {
        throw new AppError("Cliente foi deletado.", 400);
      }

      const blocks = await db.clientBlock.findMany({
        where: { clientId },
        include: {
          deliveryman: {
            select: {
              id: true,
              name: true,
              document: true,
              phone: true,
            },
          },
        },
      });

      return blocks;
    },
  };
}

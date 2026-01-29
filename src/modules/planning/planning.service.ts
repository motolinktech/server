import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import { dayjs } from "../../utils/dayjs";
import type { ListPlanningsDTO, PlanningMutateDTO } from "./planning.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function planningService() {
  return {
    async create(data: Omit<PlanningMutateDTO, "id">) {
      const plannedDate = dayjs(data.plannedDate).startOf("day");
      const today = dayjs().startOf("day");

      if (plannedDate.isBefore(today)) {
        throw new AppError(
          "Não é permitido criar planejamentos para datas passadas.",
          400,
        );
      }

      const client = await db.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client) {
        throw new AppError("Cliente não encontrado.", 404);
      }

      if (client.isDeleted) {
        throw new AppError("Cliente foi deletado.", 400);
      }

      const existingPlanning = await db.planning.findUnique({
        where: {
          clientId_plannedDate_period: {
            clientId: data.clientId,
            plannedDate: plannedDate.toDate(),
            period: data.period,
          },
        },
      });

      if (existingPlanning) {
        throw new AppError(
          "Já existe um planejamento para este cliente, data e período.",
          400,
        );
      }

      const planning = await db.planning.create({
        data: {
          clientId: data.clientId,
          branchId: data.branchId,
          plannedDate: plannedDate.toDate(),
          plannedCount: data.plannedCount,
          period: data.period,
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return planning;
    },

    async edit(data: Partial<PlanningMutateDTO> & { id: string }) {
      const existingPlanning = await db.planning.findUnique({
        where: { id: data.id },
      });

      if (!existingPlanning) {
        throw new AppError("Planejamento não encontrado.", 404);
      }

      const plannedDate = data.plannedDate
        ? dayjs(data.plannedDate).startOf("day")
        : dayjs(existingPlanning.plannedDate).startOf("day");

      const today = dayjs().startOf("day");

      if (plannedDate.isBefore(today)) {
        throw new AppError(
          "Não é permitido editar planejamentos de datas passadas.",
          400,
        );
      }

      const updateData: Prisma.PlanningUpdateInput = {};

      if (data.plannedCount !== undefined) {
        updateData.plannedCount = data.plannedCount;
      }

      if (data.plannedDate) {
        updateData.plannedDate = dayjs(data.plannedDate)
          .startOf("day")
          .toDate();
      }

      if (data.branchId) {
        updateData.branchId = data.branchId;
      }

      if (data.period) {
        updateData.period = data.period;
      }

      const updatedPlanning = await db.planning.update({
        where: { id: data.id },
        data: updateData,
      });

      return updatedPlanning;
    },

    async getById(id: string) {
      const planning = await db.planning.findUnique({
        where: { id },
      });

      if (!planning) {
        throw new AppError("Planejamento não encontrado.", 404);
      }

      return planning;
    },

    async listAll(input: ListPlanningsDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        clientId,
        branchId,
        startDate,
        endDate,
        period,
      } = input;

      const where: Prisma.PlanningWhereInput = {
        ...(clientId ? { clientId } : {}),
        ...(branchId ? { branchId } : {}),
        ...(period ? { period } : {}),
        ...(startDate || endDate
          ? {
              plannedDate: {
                ...(startDate
                  ? { gte: dayjs(startDate).startOf("day").toDate() }
                  : {}),
                ...(endDate
                  ? { lte: dayjs(endDate).endOf("day").toDate() }
                  : {}),
              },
            }
          : {}),
      };

      const [plannings, count] = await db.$transaction([
        db.planning.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { plannedDate: "asc" },
        }),
        db.planning.count({ where }),
      ]);

      return { data: plannings, count };
    },

    async delete(id: string) {
      const existingPlanning = await db.planning.findUnique({
        where: { id },
      });

      if (!existingPlanning) {
        throw new AppError("Planejamento não encontrado.", 404);
      }

      // Block deleting past dates
      const plannedDate = dayjs(existingPlanning.plannedDate).startOf("day");
      const today = dayjs().startOf("day");

      if (plannedDate.isBefore(today)) {
        throw new AppError(
          "Não é permitido deletar planejamentos de datas passadas.",
          400,
        );
      }

      await db.planning.delete({
        where: { id },
      });

      return { message: "Planejamento deletado com sucesso." };
    },
  };
}

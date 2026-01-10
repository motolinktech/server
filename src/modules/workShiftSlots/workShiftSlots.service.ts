import dayjs from "dayjs";
import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import { getDateRange } from "../../utils/dateRange";
import type {
  ListWorkShiftSlotsDTO,
  WorkShiftSlotMutateDTO,
} from "./workShiftSlots.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function workShiftSlotsService() {
  return {
    async create(data: Omit<WorkShiftSlotMutateDTO, "id">) {
      const workShiftSlot = await db.workShiftSlot.create({
        data: {
          ...data,
          shiftDate: dayjs(data.shiftDate).toDate(),
          startTime: dayjs(data.startTime).toDate(),
          endTime: dayjs(data.endTime).toDate(),
          logs: data.logs || [],
        },
      });

      return workShiftSlot;
    },

    async edit(data: Partial<WorkShiftSlotMutateDTO>) {
      const existingWorkShiftSlot = await db.workShiftSlot.findUnique({
        where: { id: data.id },
      });

      if (!existingWorkShiftSlot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      const updateData: any = { ...data };
      if (data.shiftDate) updateData.shiftDate = dayjs(data.shiftDate).toDate();
      if (data.startTime) updateData.startTime = dayjs(data.startTime).toDate();
      if (data.endTime) updateData.endTime = dayjs(data.endTime).toDate();

      const updatedWorkShiftSlot = await db.workShiftSlot.update({
        where: { id: data.id },
        data: updateData,
      });

      return updatedWorkShiftSlot;
    },

    async getById(id: string) {
      const workShiftSlot = await db.workShiftSlot.findUnique({
        where: { id },
        include: {
          deliveryman: true,
          client: true,
        },
      });

      if (!workShiftSlot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      return workShiftSlot;
    },

    async listAll(input: ListWorkShiftSlotsDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        clientId,
        deliverymanId,
        status,
        month,
        week,
      } = input;

      const { startDate, endDate } = getDateRange({ month, week });

      const where: Prisma.WorkShiftSlotWhereInput = {
        ...(clientId ? { clientId } : {}),
        ...(deliverymanId ? { deliverymanId } : {}),
        ...(status ? { status } : {}),
        shiftDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      const [workShiftSlots, count] = await db.$transaction([
        db.workShiftSlot.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { shiftDate: "desc" },
          include: {
            deliveryman: {
              select: {
                id: true,
                name: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        db.workShiftSlot.count({ where }),
      ]);

      return {
        data: workShiftSlots,
        count,
      };
    },

    async getByGroup(groupId: string) {
      const clients = await db.client.findMany({
        where: { groupId },
        select: {
          id: true,
          name: true,
        },
      });

      if (clients.length === 0) {
        return {};
      }

      const clientIds = clients.map((c) => c.id);

      const { startDate, endDate } = getDateRange();

      const workShiftSlots = await db.workShiftSlot.findMany({
        where: {
          clientId: {
            in: clientIds,
          },
          shiftDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          deliveryman: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { shiftDate: "desc" },
      });

      const result: Record<string, Array<(typeof workShiftSlots)[number]>> = {};

      for (const client of clients) {
        result[client.name] = workShiftSlots.filter(
          (slot) => slot.clientId === client.id,
        );
      }

      return result;
    },
  };
}

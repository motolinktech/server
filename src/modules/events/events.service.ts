import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { AppError } from "../../utils/appError";
import type { EventMutateDTO, ListEventsDTO } from "./events.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function eventsService() {
  return {
    async create(data: Omit<EventMutateDTO, "id">, createdById: string) {
      const event = await db.event.create({
        data: {
          ...data,
          createdById,
        },
      });

      return event;
    },

    async getById(id: string) {
      const event = await db.event.findUnique({
        where: { id },
        include: { createdBy: { select: { id: true, name: true } } },
      });

      if (!event) {
        throw new AppError("Evento não encontrado.", 404);
      }

      return event;
    },

    async list(input: ListEventsDTO & { currentBranch?: string }) {
      const { page = 1, limit = PAGE_SIZE, search, currentBranch } = input;

      const where: Prisma.EventWhereInput = search
        ? { name: { contains: search, mode: "insensitive" } }
        : {};

      const [events, count] = await db.$transaction([
        db.event.findMany({
          take: Number(limit),
          skip: (page - 1) * Number(limit),
          where: {
            ...where,
            branches: { has: currentBranch },
          },
          orderBy: { id: "asc" },
        }),
        db.event.count({
          where: {
            branches: { has: currentBranch },
          },
        }),
      ]);

      return { data: events, count };
    },

    async update(id: string, data: Partial<EventMutateDTO>) {
      const existing = await db.event.findUnique({ where: { id } });

      if (!existing) {
        throw new AppError("Evento não encontrado.", 404);
      }

      const updated = await db.event.update({ where: { id }, data });

      return updated;
    },

    async delete(id: string) {
      const existing = await db.event.findUnique({ where: { id } });

      if (!existing) {
        throw new AppError("Evento não encontrado.", 404);
      }

      await db.event.delete({ where: { id } });

      return { success: true };
    },
  };
}

export type EventsService = ReturnType<typeof eventsService>;

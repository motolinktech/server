import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { historyTraceActionsEnum } from "../../shared/enums/historyTraceAction.enum";
import { AppError } from "../../utils/appError";
import type {
  HistoryTraceCreateDTO,
  HistoryTraceListInputDTO,
} from "./historyTraces.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

const ignoredFields = new Set(["id", "createdAt", "updatedAt", "entityType"]);

const stripIgnoredFields = (payload: Record<string, unknown> | null) => {
  if (!payload) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !ignoredFields.has(key)),
  );
};

const areValuesEqual = (next: unknown, prev: unknown) => {
  if (Object.is(next, prev)) {
    return true;
  }

  if (
    typeof next !== "object" ||
    typeof prev !== "object" ||
    next === null ||
    prev === null
  ) {
    return false;
  }

  try {
    return JSON.stringify(next) === JSON.stringify(prev);
  } catch {
    return false;
  }
};

const buildDiff = (
  next: Record<string, unknown>,
  prev: Record<string, unknown>,
) => {
  const diff: Record<string, { new: unknown; old: unknown }> = {};
  const keys = new Set([...Object.keys(next), ...Object.keys(prev)]);

  for (const key of keys) {
    if (areValuesEqual(next[key], prev[key])) {
      continue;
    }

    diff[key] = {
      new: next[key] ?? null,
      old: prev[key] ?? null,
    };
  }

  return diff;
};

const extractEntityId = (
  nextPayload: Record<string, unknown> | null,
  prevPayload: Record<string, unknown> | null,
) => {
  const id = nextPayload?.id ?? prevPayload?.id;

  if (!id || typeof id !== "string") {
    throw new AppError("Entidade inválida.", 400);
  }

  return id;
};

const extractEntityType = (
  nextPayload: Record<string, unknown> | null,
  prevPayload: Record<string, unknown> | null,
) => {
  const entityType =
    nextPayload?.entityType ??
    prevPayload?.entityType ??
    nextPayload?.__typename ??
    prevPayload?.__typename;

  if (!entityType || typeof entityType !== "string") {
    throw new AppError("Tipo da entidade é obrigatório.", 400);
  }

  return entityType;
};

type userSnapshot = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  branches: string[];
  permissions: string[];
};

export function historyTraceService() {
  return {
    async create({
      new: next,
      old: prev,
      userId,
      action,
    }: HistoryTraceCreateDTO) {
      try {
        if (!userId) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            role: true,
            permissions: true,
            branches: true,
            status: true,
          },
        });

        if (!user) {
          return null;
        }

        const entityId = extractEntityId(next, prev);
        const entityType = extractEntityType(next, prev);
        const nextPayload = stripIgnoredFields(next);
        const prevPayload = stripIgnoredFields(prev);

        const changesRaw =
          action === historyTraceActionsEnum.CREATE || !prev
            ? nextPayload
            : buildDiff(nextPayload, prevPayload);

        const changes = changesRaw as Prisma.InputJsonValue;

        const historyTrace = await db.historyTrace.create({
          data: {
            userId,
            user,
            action,
            entityType,
            entityId,
            changes,
          },
        });

        return historyTrace;
      } catch (err) {
        // Never throw from history trace creation; log and return null
        // eslint-disable-next-line no-console
        console.error("historyTrace.create failed:", err);
        return null;
      }
    },

    async getById(id: string) {
      const historyTrace = await db.historyTrace.findUnique({
        where: { id },
      });

      if (!historyTrace) {
        throw new AppError("Histórico não encontrado.", 404);
      }

      return {
        ...historyTrace,
        user: historyTrace.user as userSnapshot,
      };
    },

    async list(input: HistoryTraceListInputDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        userId,
        action,
        entityType,
        entityId,
      } = input;

      const where: Prisma.HistoryTraceWhereInput = {
        ...(userId ? { userId } : {}),
        ...(action ? { action } : {}),
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
      };

      const [historyTraces, count] = await db.$transaction([
        db.historyTrace.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { createdAt: "desc" },
        }),
        db.historyTrace.count({ where }),
      ]);

      return {
        data: historyTraces as Array<
          (typeof historyTraces)[number] & {
            user: userSnapshot;
          }
        >,
        count,
      };
    },
  };
}

export type HistoryTraceService = ReturnType<typeof historyTraceService>;
export type ListHistoryTraceServiceResponse = Awaited<
  ReturnType<HistoryTraceService["list"]>
>;

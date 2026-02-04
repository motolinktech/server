import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import {
  isValidStatusTransition,
  workShiftSlotStatusEnum,
} from "../../shared/enums/workShiftSlotStatus.enum";
import { AppError } from "../../utils/appError";
import { getDateRange } from "../../utils/dateRange";
import { dayjs } from "../../utils/dayjs";
import type {
  CheckInOutDTO,
  CopyWorkShiftSlotsDTO,
  ListWorkShiftSlotsByGroupDTO,
  ListWorkShiftSlotsDTO,
  MarkAbsentDTO,
  WorkShiftSlotMutateDTO,
} from "./workShiftSlots.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;
const WORK_SHIFT_TZ = "America/Sao_Paulo";
const HAS_EXPLICIT_OFFSET_REGEX = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

function formatWorkShiftSlotResponse(slot: any) {
  if (!slot) return slot;
  return {
    ...slot,
    deliverymanAmountDay: slot.deliverymanAmountDay
      ? slot.deliverymanAmountDay.toString()
      : "0",
    deliverymanAmountNight: slot.deliverymanAmountNight
      ? slot.deliverymanAmountNight.toString()
      : "0",
    deliverymanPerDeliveryDay: slot.deliverymanPerDeliveryDay
      ? slot.deliverymanPerDeliveryDay.toString()
      : "0",
    deliverymanPerDeliveryNight: slot.deliverymanPerDeliveryNight
      ? slot.deliverymanPerDeliveryNight.toString()
      : "0",
  };
}

function normalizeShiftTimes(input: {
  shiftDate: string | Date;
  startTime: string | Date;
  endTime: string | Date;
}) {
  const shiftDay = parseToWorkShiftTimezone(
    input.shiftDate,
    "shiftDate",
  ).startOf("day");
  const startCandidate = parseToWorkShiftTimezone(input.startTime, "startTime");
  const endCandidate = parseToWorkShiftTimezone(input.endTime, "endTime");

  const startTime = shiftDay
    .hour(startCandidate.hour())
    .minute(startCandidate.minute())
    .second(startCandidate.second())
    .millisecond(startCandidate.millisecond());

  let endTime = shiftDay
    .hour(endCandidate.hour())
    .minute(endCandidate.minute())
    .second(endCandidate.second())
    .millisecond(endCandidate.millisecond());

  if (endTime.isSame(startTime) || endTime.isBefore(startTime)) {
    endTime = endTime.add(1, "day");
  }

  return {
    shiftDate: shiftDay.toDate(),
    startTime: startTime.toDate(),
    endTime: endTime.toDate(),
  };
}

function parseToWorkShiftTimezone(
  value: string | Date,
  fieldName: "shiftDate" | "startTime" | "endTime",
) {
  if (value instanceof Date) {
    const parsedDate = dayjs(value).tz(WORK_SHIFT_TZ);

    if (!parsedDate.isValid()) {
      throw new AppError(`${fieldName} inválido.`, 400);
    }

    return parsedDate;
  }

  const rawValue = value.trim();
  const parsed = HAS_EXPLICIT_OFFSET_REGEX.test(rawValue)
    ? dayjs(rawValue).tz(WORK_SHIFT_TZ)
    : dayjs.tz(rawValue, WORK_SHIFT_TZ);

  if (!parsed.isValid()) {
    throw new AppError(`${fieldName} inválido.`, 400);
  }

  return parsed;
}
export function workShiftSlotsService() {
  return {
    async create(data: Omit<WorkShiftSlotMutateDTO, "id">) {
      const normalizedTimes = normalizeShiftTimes({
        shiftDate: data.shiftDate,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      const workShiftSlot = await db.workShiftSlot.create({
        data: {
          clientId: data.clientId,
          deliverymanId: data.deliverymanId,
          contractType: data.contractType,
          auditStatus: data.auditStatus,
          period: data.period,
          isFreelancer: data.isFreelancer ?? false,
          status: data.status || workShiftSlotStatusEnum.OPEN,
          shiftDate: normalizedTimes.shiftDate,
          startTime: normalizedTimes.startTime,
          endTime: normalizedTimes.endTime,
          logs: data.logs || [],
          deliverymanAmountDay: data.deliverymanAmountDay,
          deliverymanAmountNight: data.deliverymanAmountNight,
          deliverymanPaymentType: data.deliverymanPaymentType,
          deliverymenPaymentValue: data.deliverymenPaymentValue,
          paymentForm: data.paymentForm ?? "DAILY",
          guaranteedQuantityDay: data.guaranteedQuantityDay ?? 0,
          guaranteedQuantityNight: data.guaranteedQuantityNight ?? 0,
          deliverymanPerDeliveryDay: data.deliverymanPerDeliveryDay ?? 0,
          deliverymanPerDeliveryNight: data.deliverymanPerDeliveryNight ?? 0,
          isWeekendRate: data.isWeekendRate ?? false,
        },
      });

      return formatWorkShiftSlotResponse(workShiftSlot);
    },

    async edit(data: Partial<WorkShiftSlotMutateDTO>) {
      const existingWorkShiftSlot = await db.workShiftSlot.findUnique({
        where: { id: data.id },
      });

      if (!existingWorkShiftSlot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      if (
        data.status &&
        data.status !== existingWorkShiftSlot.status &&
        !isValidStatusTransition(existingWorkShiftSlot.status, data.status)
      ) {
        throw new AppError(
          `Transição de status inválida: ${existingWorkShiftSlot.status} -> ${data.status}`,
          400,
        );
      }

      const updateData: any = { ...data };
      if (data.shiftDate || data.startTime || data.endTime) {
        const normalizedTimes = normalizeShiftTimes({
          shiftDate: data.shiftDate ?? existingWorkShiftSlot.shiftDate,
          startTime: data.startTime ?? existingWorkShiftSlot.startTime,
          endTime: data.endTime ?? existingWorkShiftSlot.endTime,
        });
        updateData.shiftDate = normalizedTimes.shiftDate;
        updateData.startTime = normalizedTimes.startTime;
        updateData.endTime = normalizedTimes.endTime;
      }

      if (data.checkInAt !== undefined) {
        updateData.checkInAt = data.checkInAt ? new Date(data.checkInAt) : null;
      }

      if (data.checkOutAt !== undefined) {
        updateData.checkOutAt = data.checkOutAt
          ? new Date(data.checkOutAt)
          : null;
      }

      const updatedWorkShiftSlot = await db.workShiftSlot.update({
        where: { id: data.id },
        data: updateData,
      });

      return formatWorkShiftSlotResponse(updatedWorkShiftSlot);
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

      return formatWorkShiftSlotResponse(workShiftSlot);
    },

    async listAll(input: ListWorkShiftSlotsDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        clientId,
        groupId,
        deliverymanId,
        status,
        period,
        isFreelancer,
        startDate: startDateInput,
        endDate: endDateInput,
        month,
        week,
      } = input;

      let startDate: Date;
      let endDate: Date;

      if (startDateInput || endDateInput) {
        const parsedStart = startDateInput ? dayjs(startDateInput) : null;
        const parsedEnd = endDateInput ? dayjs(endDateInput) : null;

        if (startDateInput && !parsedStart?.isValid()) {
          throw new AppError(
            "startDate inválido. Use formato ISO ou YYYY-MM-DD.",
            400,
          );
        }
        if (endDateInput && !parsedEnd?.isValid()) {
          throw new AppError(
            "endDate inválido. Use formato ISO ou YYYY-MM-DD.",
            400,
          );
        }

        const isStartDateOnly = startDateInput?.match(/^\d{4}-\d{2}-\d{2}$/);
        const isEndDateOnly = endDateInput?.match(/^\d{4}-\d{2}-\d{2}$/);

        if (parsedStart && parsedEnd) {
          startDate = isStartDateOnly
            ? parsedStart.startOf("day").toDate()
            : parsedStart.toDate();
          endDate = isEndDateOnly
            ? parsedEnd.endOf("day").toDate()
            : parsedEnd.toDate();
        } else if (parsedStart) {
          startDate = isStartDateOnly
            ? parsedStart.startOf("day").toDate()
            : parsedStart.toDate();
          endDate = parsedStart.endOf("day").toDate();
        } else if (parsedEnd) {
          startDate = parsedEnd.startOf("day").toDate();
          endDate = isEndDateOnly
            ? parsedEnd.endOf("day").toDate()
            : parsedEnd.toDate();
        } else {
          const range = getDateRange({ month, week });
          startDate = range.startDate;
          endDate = range.endDate;
        }

        if (endDate < startDate) {
          throw new AppError("endDate não pode ser anterior a startDate.", 400);
        }
      } else {
        const range = getDateRange({ month, week });
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const where: Prisma.WorkShiftSlotWhereInput = {
        ...(clientId ? { clientId } : {}),
        ...(groupId ? { client: { groupId } } : {}),
        ...(deliverymanId ? { deliverymanId } : {}),
        ...(status ? { status } : {}),
        ...(period?.length ? { period: { hasSome: period } } : {}),
        ...(isFreelancer !== undefined ? { isFreelancer } : {}),
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
        data: workShiftSlots.map(formatWorkShiftSlotResponse),
        count,
      };
    },

    async getByGroup(groupId: string, options?: ListWorkShiftSlotsByGroupDTO) {
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

      let startDate: Date;
      let endDate: Date;

      if (options?.startDate || options?.endDate) {
        const parsedStart = options?.startDate
          ? dayjs(options.startDate)
          : null;
        const parsedEnd = options?.endDate ? dayjs(options.endDate) : null;

        if (options?.startDate && !parsedStart?.isValid()) {
          throw new AppError(
            "startDate inválido. Use formato ISO ou YYYY-MM-DD.",
            400,
          );
        }
        if (options?.endDate && !parsedEnd?.isValid()) {
          throw new AppError(
            "endDate inválido. Use formato ISO ou YYYY-MM-DD.",
            400,
          );
        }

        const isStartDateOnly =
          options?.startDate?.match(/^\d{4}-\d{2}-\d{2}$/);
        const isEndDateOnly = options?.endDate?.match(/^\d{4}-\d{2}-\d{2}$/);

        if (parsedStart && parsedEnd) {
          startDate = isStartDateOnly
            ? parsedStart.startOf("day").toDate()
            : parsedStart.toDate();
          endDate = isEndDateOnly
            ? parsedEnd.endOf("day").toDate()
            : parsedEnd.toDate();
        } else if (parsedStart) {
          startDate = isStartDateOnly
            ? parsedStart.startOf("day").toDate()
            : parsedStart.toDate();
          endDate = parsedStart.endOf("day").toDate();
        } else if (parsedEnd) {
          startDate = parsedEnd.startOf("day").toDate();
          endDate = isEndDateOnly
            ? parsedEnd.endOf("day").toDate()
            : parsedEnd.toDate();
        } else {
          const range = getDateRange();
          startDate = range.startDate;
          endDate = range.endDate;
        }

        if (endDate < startDate) {
          throw new AppError("endDate não pode ser anterior a startDate.", 400);
        }
      } else {
        const range = getDateRange();
        startDate = range.startDate;
        endDate = range.endDate;
      }

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
        result[client.name] = workShiftSlots
          .filter((slot) => slot.clientId === client.id)
          .map(formatWorkShiftSlotResponse);
      }

      return result;
    },

    async checkIn(slotId: string, data: CheckInOutDTO) {
      const slot = await db.workShiftSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      if (slot.status !== workShiftSlotStatusEnum.CONFIRMED) {
        throw new AppError(
          "Apenas turnos CONFIRMADOS podem fazer check-in.",
          400,
        );
      }

      const checkInTimestamp = new Date();
      console.log(
        "[checkIn] Setting checkInAt to:",
        checkInTimestamp.toISOString(),
      );

      const updatedSlot = await db.workShiftSlot.update({
        where: { id: slotId },
        data: {
          status: workShiftSlotStatusEnum.CHECKED_IN,
          checkInAt: checkInTimestamp,
          logs: {
            push: {
              action: "CHECK_IN",
              timestamp: checkInTimestamp,
              location: data.location,
            },
          },
        },
      });

      console.log("[checkIn] Updated slot checkInAt:", updatedSlot.checkInAt);

      return formatWorkShiftSlotResponse(updatedSlot);
    },

    async checkOut(slotId: string, data: CheckInOutDTO) {
      const slot = await db.workShiftSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      if (slot.status !== workShiftSlotStatusEnum.CHECKED_IN) {
        throw new AppError(
          "Apenas turnos com CHECK_IN podem fazer check-out.",
          400,
        );
      }

      const checkOutTimestamp = new Date();
      console.log(
        "[checkOut] Setting checkOutAt to:",
        checkOutTimestamp.toISOString(),
      );

      const updatedSlot = await db.workShiftSlot.update({
        where: { id: slotId },
        data: {
          status: workShiftSlotStatusEnum.PENDING_COMPLETION,
          checkOutAt: checkOutTimestamp,
          logs: {
            push: {
              action: "CHECK_OUT",
              timestamp: checkOutTimestamp,
              location: data.location,
            },
          },
        },
      });

      console.log(
        "[checkOut] Updated slot checkOutAt:",
        updatedSlot.checkOutAt,
      );

      return formatWorkShiftSlotResponse(updatedSlot);
    },

    async confirmCompletion(slotId: string) {
      const slot = await db.workShiftSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      if (slot.status !== workShiftSlotStatusEnum.PENDING_COMPLETION) {
        throw new AppError(
          "Apenas turnos com PENDING_COMPLETION podem ser concluídos.",
          400,
        );
      }

      const updatedSlot = await db.workShiftSlot.update({
        where: { id: slotId },
        data: {
          status: workShiftSlotStatusEnum.COMPLETED,
          logs: {
            push: {
              action: "CONFIRM_COMPLETION",
              timestamp: new Date(),
            },
          },
        },
      });

      return formatWorkShiftSlotResponse(updatedSlot);
    },

    async markAbsent(slotId: string, data: MarkAbsentDTO) {
      const slot = await db.workShiftSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      // Allow marking absence from any status (previously restricted to CONFIRMED/CHECKED_IN)

      const updatedSlot = await db.workShiftSlot.update({
        where: { id: slotId },
        data: {
          status: workShiftSlotStatusEnum.ABSENT,
          logs: {
            push: {
              action: "MARKED_ABSENT",
              timestamp: new Date(),
              reason: data.reason,
            },
          },
        },
      });

      return formatWorkShiftSlotResponse(updatedSlot);
    },

    async connectTracking(slotId: string) {
      const slot = await db.workShiftSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      const updatedSlot = await db.workShiftSlot.update({
        where: { id: slotId },
        data: {
          trackingConnected: true,
          trackingConnectedAt: new Date(),
          logs: {
            push: {
              action: "TRACKING_CONNECTED",
              timestamp: new Date(),
            },
          },
        },
      });

      return formatWorkShiftSlotResponse(updatedSlot);
    },

    async delete(slotId: string) {
      const slot = await db.workShiftSlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      if (slot.status === workShiftSlotStatusEnum.OPEN) {
        const deleted = await db.workShiftSlot.delete({
          where: { id: slotId },
        });

        return formatWorkShiftSlotResponse(deleted);
      }

      const updated = await db.workShiftSlot.update({
        where: { id: slotId },
        data: {
          status: workShiftSlotStatusEnum.CANCELLED,
          logs: {
            push: {
              action: "CANCELLED",
              timestamp: new Date(),
            },
          },
        },
      });

      return formatWorkShiftSlotResponse(updated);
    },

    async copyShifts(data: CopyWorkShiftSlotsDTO) {
      const { sourceDate, targetDate, clientId } = data;

      // 1. Fetch source shifts (exclude CANCELLED)
      const sourceShifts = await db.workShiftSlot.findMany({
        where: {
          clientId,
          shiftDate: {
            gte: dayjs(sourceDate).startOf("day").toDate(),
            lt: dayjs(sourceDate).endOf("day").toDate(),
          },
          status: { not: workShiftSlotStatusEnum.CANCELLED },
        },
        include: { deliveryman: { select: { id: true, name: true } } },
      });

      if (sourceShifts.length === 0) {
        throw new AppError("Nenhum turno encontrado na data de origem", 404);
      }

      const copiedShifts: any[] = [];
      const conflictedShifts: {
        sourceShiftId: string;
        deliverymanId: string;
        deliverymanName: string;
        conflictingShiftId: string;
      }[] = [];

      // 2. Process each shift
      for (const shift of sourceShifts) {
        // Calculate new times using normalizeShiftTimes for timezone consistency
        const normalizedTimes = normalizeShiftTimes({
          shiftDate: targetDate,
          startTime: shift.startTime,
          endTime: shift.endTime,
        });
        const newStartTime = normalizedTimes.startTime;
        const newEndTime = normalizedTimes.endTime;

        let deliverymanId: string | null = shift.deliverymanId;

        // 3. Check for conflicts if shift has a deliveryman
        if (shift.deliverymanId) {
          const conflictingShift = await db.workShiftSlot.findFirst({
            where: {
              deliverymanId: shift.deliverymanId,
              status: {
                in: [
                  workShiftSlotStatusEnum.INVITED,
                  workShiftSlotStatusEnum.CONFIRMED,
                  workShiftSlotStatusEnum.CHECKED_IN,
                  workShiftSlotStatusEnum.PENDING_COMPLETION,
                ],
              },
              startTime: { lt: newEndTime },
              endTime: { gt: newStartTime },
            },
          });

          if (conflictingShift) {
            // Has conflict: copy without deliveryman
            conflictedShifts.push({
              sourceShiftId: shift.id,
              deliverymanId: shift.deliverymanId,
              deliverymanName: shift.deliveryman?.name || "Desconhecido",
              conflictingShiftId: conflictingShift.id,
            });
            deliverymanId = null;
          }
        }

        // 4. Create new shift
        const newShift = await db.workShiftSlot.create({
          data: {
            clientId: shift.clientId,
            deliverymanId,
            contractType: shift.contractType,
            shiftDate: normalizedTimes.shiftDate,
            startTime: newStartTime,
            endTime: newEndTime,
            period: shift.period,
            auditStatus: shift.auditStatus,
            isFreelancer: shift.isFreelancer,
            status: deliverymanId
              ? workShiftSlotStatusEnum.INVITED
              : workShiftSlotStatusEnum.OPEN,
            deliverymanAmountDay: shift.deliverymanAmountDay,
            deliverymanAmountNight: shift.deliverymanAmountNight,
            deliverymanPaymentType: shift.deliverymanPaymentType,
            deliverymenPaymentValue: shift.deliverymenPaymentValue,
            paymentForm: shift.paymentForm,
            guaranteedQuantityDay: shift.guaranteedQuantityDay,
            guaranteedQuantityNight: shift.guaranteedQuantityNight,
            deliverymanPerDeliveryDay: shift.deliverymanPerDeliveryDay,
            deliverymanPerDeliveryNight: shift.deliverymanPerDeliveryNight,
            isWeekendRate: shift.isWeekendRate,
            logs: [],
          },
        });

        copiedShifts.push(formatWorkShiftSlotResponse(newShift));
      }

      return {
        copiedShifts,
        warnings:
          conflictedShifts.length > 0
            ? {
                message: `${conflictedShifts.length} turno(s) copiado(s) sem entregador devido a conflitos de horário`,
                conflictedShifts,
              }
            : null,
      };
    },
  };
}

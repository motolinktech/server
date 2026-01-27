import dayjs from "dayjs";
import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import {
  isValidStatusTransition,
  workShiftSlotStatusEnum,
} from "../../shared/enums/workShiftSlotStatus.enum";
import { AppError } from "../../utils/appError";
import { getDateRange } from "../../utils/dateRange";
import { generateToken } from "../../utils/generateToken";
import type {
  AcceptInviteDTO,
  CheckInOutDTO,
  CopyWorkShiftSlotsDTO,
  ListWorkShiftSlotsByGroupDTO,
  ListWorkShiftSlotsDTO,
  MarkAbsentDTO,
  SendInviteDTO,
  WorkShiftSlotMutateDTO,
} from "./workShiftSlots.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

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
  };
}

function normalizeShiftTimes(input: {
  shiftDate: string | Date;
  startTime: string | Date;
  endTime: string | Date;
}) {
  const shiftDay = dayjs(input.shiftDate);
  const startCandidate = dayjs(input.startTime);
  const endCandidate = dayjs(input.endTime);

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

    async sendInvite(slotId: string, data: SendInviteDTO) {
      const slot = await db.workShiftSlot.findUnique({
        where: { id: slotId },
        include: {
          client: {
            select: {
              name: true,
              street: true,
              number: true,
              neighborhood: true,
            },
          },
        },
      });

      if (!slot) {
        throw new AppError("Turno não encontrado.", 404);
      }

      if (
        slot.status !== workShiftSlotStatusEnum.OPEN &&
        slot.status !== workShiftSlotStatusEnum.INVITED
      ) {
        throw new AppError(
          "Apenas turnos com status OPEN ou INVITED podem receber convites.",
          400,
        );
      }

      const deliveryman = await db.deliveryman.findUnique({
        where: { id: data.deliverymanId },
      });

      if (!deliveryman) {
        throw new AppError("Entregador não encontrado.", 404);
      }

      if (deliveryman.isBlocked) {
        throw new AppError("Entregador está bloqueado.", 400);
      }

      if (!deliveryman.phone) {
        throw new AppError("O entregador não possui um telefone.", 404);
      }

      const block = await db.clientBlock.findUnique({
        where: {
          clientId_deliverymanId: {
            clientId: slot.clientId,
            deliverymanId: data.deliverymanId,
          },
        },
      });

      if (block) {
        throw new AppError("Entregador está bloqueado para este cliente.", 400);
      }

      // Check for overlapping shifts on the same shift day (with overnight handling)
      const shiftDayStart = dayjs(slot.shiftDate).startOf("day");
      const shiftDayEnd = dayjs(slot.shiftDate).endOf("day");
      const candidateShifts = await db.workShiftSlot.findMany({
        where: {
          id: { not: slotId },
          deliverymanId: data.deliverymanId,
          status: {
            in: [
              workShiftSlotStatusEnum.INVITED,
              workShiftSlotStatusEnum.CONFIRMED,
              workShiftSlotStatusEnum.CHECKED_IN,
              workShiftSlotStatusEnum.PENDING_COMPLETION,
            ],
          },
          shiftDate: {
            gte: shiftDayStart.subtract(1, "day").toDate(),
            lte: shiftDayEnd.add(1, "day").toDate(),
          },
        },
        select: {
          id: true,
          shiftDate: true,
          startTime: true,
          endTime: true,
        },
      });

      const slotStart = dayjs(slot.startTime);
      let slotEnd = dayjs(slot.endTime);
      if (slotEnd.isSame(slotStart) || slotEnd.isBefore(slotStart)) {
        slotEnd = slotEnd.add(1, "day");
      }

      const overlappingShift = candidateShifts.find((candidate) => {
        const candidateStart = dayjs(candidate.startTime);
        let candidateEnd = dayjs(candidate.endTime);
        if (
          candidateEnd.isSame(candidateStart) ||
          candidateEnd.isBefore(candidateStart)
        ) {
          candidateEnd = candidateEnd.add(1, "day");
        }

        return (
          candidateStart.isBefore(slotEnd) && candidateEnd.isAfter(slotStart)
        );
      });

      if (overlappingShift) {
        throw new AppError(
          "Entregador já escalado para um turno no mesmo horário.",
          400,
        );
      }

      const inviteToken = await generateToken();
      const expiresInHours = data.expiresInHours || 24;
      const inviteExpiresAt = dayjs().add(expiresInHours, "hour").toDate();

      const updatedSlot = await db.workShiftSlot.update({
        where: { id: slotId },
        data: {
          deliverymanId: data.deliverymanId,
          status: workShiftSlotStatusEnum.INVITED,
          inviteToken,
          inviteSentAt: new Date(),
          inviteExpiresAt,
          logs: {
            push: {
              action: "INVITE_SENT",
              timestamp: new Date(),
              deliverymanId: data.deliverymanId,
            },
          },
        },
      });

      const clientAddress = `${slot.client.street}, ${slot.client.number} - ${slot.client.neighborhood}`;
      const urlParams = new URLSearchParams({
        token: inviteToken,
        clientName: slot.client.name,
        clientAddress: clientAddress,
        shiftDate: dayjs(slot.shiftDate).format("YYYY-MM-DD"),
        startTime: dayjs(slot.startTime).format("HH:mm"),
        endTime: dayjs(slot.endTime).format("HH:mm"),
      });
      const confirmationUrl = `${process.env.WEB_APP_URL}/confirmar-escala?${urlParams.toString()}`;
      const shiftPeriod = `${dayjs(slot.startTime).format("HH:mm")} às ${dayjs(slot.endTime).format("HH:mm")}`;
      const message = `👋🏻 Olá, ${deliveryman.name}, você foi convocado para uma escala de prestação de serviço na modalidade entrega no dia *${dayjs(slot.shiftDate).format("DD/MM/YYYY")}*.  Gostaria de participar?
      \n
      📄 Informações da Escala:
      \n
Data: ${dayjs(slot.shiftDate).format("DD/MM/YYYY")}
Cliente: ${slot.client.name}
Motoboy: ${deliveryman.name}
Endereço: ${clientAddress}
Escala: ${shiftPeriod}
\n
Caso tenha interesse, você poderá aceitar ou recusar livremente por meio do link abaixo:\n
👉 ${confirmationUrl}`;

      const phoneWithPrefix = `55${deliveryman.phone}`;
      console.log("[sendInvite] Phone type:", typeof deliveryman.phone);
      console.log("[sendInvite] Phone with prefix:", phoneWithPrefix);

      const requestBody = {
        messages: [
          {
            nome: deliveryman.name,
            telefone: phoneWithPrefix,
            mensagem: message,
          },
        ],
      };
      console.log(
        "[sendInvite] Request body:",
        JSON.stringify(requestBody, null, 2),
      );

      const response = await fetch(
        "https://n8n-lk0sscsw44ok4ow8o0kk0o48.72.60.49.4.sslip.io/webhook/send-messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "motolink-api-token": process.env.WHATSAPP_TOKEN || "",
          },
          body: JSON.stringify(requestBody),
        },
      );

      const responseData = await response.text();
      console.log("[sendInvite] Response status:", response.status);
      console.log("[sendInvite] Response body:", responseData);

      return {
        inviteToken: updatedSlot.inviteToken,
        inviteSentAt: updatedSlot.inviteSentAt,
        inviteExpiresAt: updatedSlot.inviteExpiresAt,
      };
    },

    async acceptInvite(data: AcceptInviteDTO & { token: string }) {
      const { token, isAccepted } = data;
      const slot = await db.workShiftSlot.findUnique({
        where: { inviteToken: token },
      });

      if (!slot) {
        throw new AppError("Convite não encontrado.", 404);
      }

      if (slot.status !== workShiftSlotStatusEnum.INVITED) {
        throw new AppError("Este convite não está mais válido.", 400);
      }

      if (slot.inviteExpiresAt && dayjs().isAfter(slot.inviteExpiresAt)) {
        throw new AppError("Este convite expirou.", 400);
      }

      if (isAccepted) {
        const updatedSlot = await db.workShiftSlot.update({
          where: { id: slot.id },
          data: {
            status: workShiftSlotStatusEnum.CONFIRMED,
            inviteToken: null,
            logs: {
              push: {
                action: "INVITE_ACCEPTED",
                timestamp: new Date(),
              },
            },
          },
        });
        return formatWorkShiftSlotResponse(updatedSlot);
      }

      // If not accepted (rejected)
      const updatedSlot = await db.workShiftSlot.update({
        where: { id: slot.id },
        data: {
          status: workShiftSlotStatusEnum.OPEN,
          deliverymanId: null,
          inviteToken: null,
          inviteSentAt: null,

          inviteExpiresAt: null,
          logs: {
            push: {
              action: "INVITE_REJECTED",
              timestamp: new Date(),
            },
          },
        },
      });

      return formatWorkShiftSlotResponse(updatedSlot);
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
        // Calculate new times (same hours, different date)
        const newStartTime = dayjs(targetDate)
          .hour(dayjs(shift.startTime).hour())
          .minute(dayjs(shift.startTime).minute())
          .second(0)
          .toDate();
        const newEndTime = dayjs(targetDate)
          .hour(dayjs(shift.endTime).hour())
          .minute(dayjs(shift.endTime).minute())
          .second(0)
          .toDate();

        let deliverymanId: string | null = shift.deliverymanId;
        let status = shift.status;

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
            status = workShiftSlotStatusEnum.OPEN;
          }
        }

        // 4. Create new shift
        const newShift = await db.workShiftSlot.create({
          data: {
            clientId: shift.clientId,
            deliverymanId,
            contractType: shift.contractType,
            shiftDate: dayjs(targetDate).startOf("day").toDate(),
            startTime: newStartTime,
            endTime: newEndTime,
            period: shift.period,
            auditStatus: shift.auditStatus,
            isFreelancer: shift.isFreelancer,
            status: deliverymanId ? status : workShiftSlotStatusEnum.OPEN,
            deliverymanAmountDay: shift.deliverymanAmountDay,
            deliverymanAmountNight: shift.deliverymanAmountNight,
            deliverymanPaymentType: shift.deliverymanPaymentType,
            deliverymenPaymentValue: shift.deliverymenPaymentValue,
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

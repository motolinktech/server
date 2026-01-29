import { db } from "../../../services/database.service";
import { whatsappService } from "../../../services/whatsapp.service";
import { inviteStatusEnum } from "../../../shared/enums/inviteStatus.enum";
import { workShiftSlotStatusEnum } from "../../../shared/enums/workShiftSlotStatus.enum";
import { AppError } from "../../../utils/appError";
import { dayjs } from "../../../utils/dayjs";
import { generateToken } from "../../../utils/generateToken";
import type {
  InviteResponseDTO,
  SendBulkInvitesDTO,
  SendBulkInvitesResponseDTO,
} from "./invites.schema";

interface SlotWithClient {
  id: string;
  inviteToken: string | null;
  inviteExpiresAt: Date | null;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  deliverymanId: string | null;
  clientId: string;
  client: {
    name: string;
    street: string;
    number: string;
    neighborhood: string;
  };
}

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

export function invitesService() {
  const buildConfirmationUrl = (inviteId: string, token: string): string => {
    const urlParams = new URLSearchParams({
      token,
      inviteId,
    });
    return `${process.env.WEB_APP_URL}/confirmar-escala?${urlParams.toString()}`;
  };

  const sendInviteForSlot = async (slot: SlotWithClient, branchId: string): Promise<void> => {
    if (!slot.deliverymanId) {
      throw new AppError("Turno não possui entregador atribuído.", 400);
    }

    const deliveryman = await db.deliveryman.findUnique({
      where: { id: slot.deliverymanId },
      select: { name: true, phone: true },
    });

    if (!deliveryman) {
      throw new AppError("Entregador não encontrado.", 404);
    }

    if (!deliveryman.phone) {
      throw new AppError("O entregador não possui um telefone.", 400);
    }

    const token = await generateToken();
    const expiresAt = dayjs().add(24, "hour").toDate();
    const clientAddress = `${slot.client.street}, ${slot.client.number} - ${slot.client.neighborhood}`;

    const invite = await db.invite.create({
      data: {
        token,
        status: inviteStatusEnum.PENDING,
        workShiftSlotId: slot.id,
        deliverymanId: slot.deliverymanId,
        clientId: slot.clientId,
        clientName: slot.client.name,
        clientAddress,
        shiftDate: slot.shiftDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        expiresAt,
      },
    });

    await db.workShiftSlot.update({
      where: { id: slot.id },
      data: {
        inviteToken: token,
        inviteSentAt: new Date(),
        inviteExpiresAt: expiresAt,
        logs: {
          push: {
            action: "INVITE_SENT",
            timestamp: new Date(),
            deliverymanId: slot.deliverymanId,
            inviteId: invite.id,
          },
        },
      },
    });

    const confirmationUrl = buildConfirmationUrl(invite.id, token);

    const success = await whatsappService().sendWorkShiftInvite({
      deliveryman: { name: deliveryman.name, phone: deliveryman.phone },
      slot: {
        shiftDate: slot.shiftDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
      client: slot.client,
      confirmationUrl,
      branchId,
    });

    if (!success) {
      throw new AppError("Falha ao enviar mensagem WhatsApp.", 500);
    }

    console.log(
      `[invitesService] Invite ${invite.id} sent for slot ${slot.id} to ${deliveryman.name}`,
    );
  };

  return {
    async sendInvites(
      data: SendBulkInvitesDTO,
      branchId: string,
    ): Promise<SendBulkInvitesResponseDTO> {
      const { date, workShiftSlotId, groupId, clientId } = data;

      if (!workShiftSlotId && !groupId && !clientId) {
        throw new AppError(
          "Pelo menos um dos campos workShiftSlotId, groupId ou clientId deve ser fornecido.",
          400,
        );
      }

      const parsedDate = dayjs(date, "DD/MM/YYYY", true);
      if (!parsedDate.isValid()) {
        throw new AppError("Data inválida. Use o formato dd/MM/YYYY.", 400);
      }

      const startOfDay = parsedDate.startOf("day").toDate();
      const endOfDay = parsedDate.endOf("day").toDate();

      if (workShiftSlotId) {
        const slot = await db.workShiftSlot.findUnique({
          where: { id: workShiftSlotId },
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

        if (slot.status !== workShiftSlotStatusEnum.INVITED) {
          throw new AppError(
            "Apenas turnos com status INVITED podem receber convites.",
            400,
          );
        }

        if (!slot.deliverymanId) {
          throw new AppError("Turno não possui entregador atribuído.", 400);
        }

        await sendInviteForSlot({
          id: slot.id,
          inviteToken: slot.inviteToken,
          inviteExpiresAt: slot.inviteExpiresAt,
          shiftDate: slot.shiftDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          deliverymanId: slot.deliverymanId,
          clientId: slot.clientId,
          client: slot.client,
        }, branchId);

        return { sent: 1, failed: 0, errors: [] };
      }

      let clientIds: string[] = [];

      if (clientId) {
        const client = await db.client.findUnique({
          where: { id: clientId },
          select: { id: true },
        });

        if (!client) {
          throw new AppError("Cliente não encontrado.", 404);
        }

        clientIds = [clientId];
      } else if (groupId) {
        const clients = await db.client.findMany({
          where: { groupId },
          select: { id: true },
        });

        if (clients.length === 0) {
          throw new AppError("Nenhum cliente encontrado para este grupo.", 404);
        }

        clientIds = clients.map((c) => c.id);
      }

      const slots = await db.workShiftSlot.findMany({
        where: {
          clientId: { in: clientIds },
          shiftDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: workShiftSlotStatusEnum.INVITED,
          deliverymanId: { not: null },
        },
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

      if (slots.length === 0) {
        return { sent: 0, failed: 0, errors: [] };
      }

      let sent = 0;
      let failed = 0;
      const errors: { slotId: string; reason: string }[] = [];

      for (const slot of slots) {
        try {
          await sendInviteForSlot({
            id: slot.id,
            inviteToken: slot.inviteToken,
            inviteExpiresAt: slot.inviteExpiresAt,
            shiftDate: slot.shiftDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            deliverymanId: slot.deliverymanId,
            clientId: slot.clientId,
            client: slot.client,
          }, branchId);
          sent++;
        } catch (error) {
          failed++;
          errors.push({
            slotId: slot.id,
            reason:
              error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }

      return { sent, failed, errors };
    },

    async getInviteById(
      inviteId: string,
      token: string,
    ): Promise<InviteResponseDTO> {
      const invite = await db.invite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) {
        throw new AppError("Convite não encontrado.", 404);
      }

      if (invite.token !== token) {
        throw new AppError("Token inválido.", 401);
      }

      if (
        invite.status === inviteStatusEnum.PENDING &&
        dayjs().isAfter(invite.expiresAt)
      ) {
        await db.invite.update({
          where: { id: inviteId },
          data: { status: inviteStatusEnum.EXPIRED },
        });
        invite.status = inviteStatusEnum.EXPIRED;
      }

      return {
        id: invite.id,
        token: invite.token,
        status: invite.status,
        workShiftSlotId: invite.workShiftSlotId,
        deliverymanId: invite.deliverymanId,
        clientId: invite.clientId,
        clientName: invite.clientName,
        clientAddress: invite.clientAddress,
        shiftDate: invite.shiftDate.toISOString(),
        startTime: invite.startTime.toISOString(),
        endTime: invite.endTime.toISOString(),
        sentAt: invite.sentAt.toISOString(),
        expiresAt: invite.expiresAt.toISOString(),
        respondedAt: invite.respondedAt?.toISOString() ?? null,
      };
    },

    async respondToInvite(
      inviteId: string,
      token: string,
      isAccepted: boolean,
    ) {
      const invite = await db.invite.findUnique({
        where: { id: inviteId },
        include: { workShiftSlot: true },
      });

      if (!invite) {
        throw new AppError("Convite não encontrado.", 404);
      }

      if (invite.token !== token) {
        throw new AppError("Token inválido.", 401);
      }

      if (invite.status !== inviteStatusEnum.PENDING) {
        throw new AppError("Este convite não está mais válido.", 400);
      }

      if (dayjs().isAfter(invite.expiresAt)) {
        await db.invite.update({
          where: { id: inviteId },
          data: { status: inviteStatusEnum.EXPIRED },
        });
        throw new AppError("Este convite expirou.", 400);
      }

      const respondedAt = new Date();

      if (isAccepted) {
        await db.invite.update({
          where: { id: inviteId },
          data: {
            status: inviteStatusEnum.ACCEPTED,
            respondedAt,
          },
        });

        const updatedSlot = await db.workShiftSlot.update({
          where: { id: invite.workShiftSlotId },
          data: {
            status: workShiftSlotStatusEnum.CONFIRMED,
            inviteToken: null,
            logs: {
              push: {
                action: "INVITE_ACCEPTED",
                timestamp: respondedAt,
                inviteId: invite.id,
              },
            },
          },
        });

        return formatWorkShiftSlotResponse(updatedSlot);
      }

      await db.invite.update({
        where: { id: inviteId },
        data: {
          status: inviteStatusEnum.REJECTED,
          respondedAt,
        },
      });

      const updatedSlot = await db.workShiftSlot.update({
        where: { id: invite.workShiftSlotId },
        data: {
          status: workShiftSlotStatusEnum.OPEN,
          deliverymanId: null,
          inviteToken: null,
          inviteSentAt: null,
          inviteExpiresAt: null,
          logs: {
            push: {
              action: "INVITE_REJECTED",
              timestamp: respondedAt,
              inviteId: invite.id,
            },
          },
        },
      });

      return formatWorkShiftSlotResponse(updatedSlot);
    },
  };
}

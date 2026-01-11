import dayjs from "dayjs";
import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { PaymentRequestStatus } from "../../shared/enums/paymentRequest.enum";
import { AppError } from "../../utils/appError";
import type {
  ListPaymentRequestsDTO,
  PaymentRequestMutateDTO,
} from "./paymentRequests.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function paymentRequestsService() {
  return {
    async create(data: Omit<PaymentRequestMutateDTO, "id">) {
      const paymentRequest = await db.paymentRequest.create({
        data: {
          workShiftSlotId: data.workShiftSlotId,
          deliverymanId: data.deliverymanId,
          amount: data.amount,
          status: data.status || PaymentRequestStatus.NEW,
          logs: data.logs || [],
        },
      });

      return paymentRequest;
    },

    async edit(data: Partial<PaymentRequestMutateDTO> & { id: string }) {
      const existingPaymentRequest = await db.paymentRequest.findUnique({
        where: { id: data.id },
      });

      if (!existingPaymentRequest) {
        throw new AppError("Solicitação de pagamento não encontrada.", 404);
      }

      const updatedPaymentRequest = await db.paymentRequest.update({
        where: { id: data.id },
        data: {
          ...(data.workShiftSlotId && {
            workShiftSlotId: data.workShiftSlotId,
          }),
          ...(data.deliverymanId && { deliverymanId: data.deliverymanId }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.status && { status: data.status }),
          ...(data.logs && { logs: data.logs }),
        },
      });

      return updatedPaymentRequest;
    },

    async getById(id: string) {
      const paymentRequest = await db.paymentRequest.findUnique({
        where: { id },
        include: {
          deliveryman: true,
          workShiftSlot: {
            include: {
              client: true,
            },
          },
        },
      });

      if (!paymentRequest) {
        throw new AppError("Solicitação de pagamento não encontrada.", 404);
      }

      return paymentRequest;
    },

    async listAll(input: ListPaymentRequestsDTO = {}) {
      const {
        page = 1,
        limit = PAGE_SIZE,
        workShiftSlotId,
        deliverymanId,
        status,
        startDate,
        endDate,
      } = input;

      // Default date range: next 7 days from current date
      const defaultStartDate = dayjs().startOf("day").toDate();
      const defaultEndDate = dayjs().add(7, "days").endOf("day").toDate();

      const dateStart = startDate
        ? dayjs(startDate).startOf("day").toDate()
        : defaultStartDate;
      const dateEnd = endDate
        ? dayjs(endDate).endOf("day").toDate()
        : defaultEndDate;

      const where: Prisma.PaymentRequestWhereInput = {
        ...(workShiftSlotId ? { workShiftSlotId } : {}),
        ...(deliverymanId ? { deliverymanId } : {}),
        ...(status ? { status } : {}),
        createdAt: {
          gte: dateStart,
          lte: dateEnd,
        },
      };

      const [paymentRequests, count] = await db.$transaction([
        db.paymentRequest.findMany({
          take: limit,
          skip: (page - 1) * limit,
          where,
          orderBy: { createdAt: "desc" },
          include: {
            deliveryman: {
              select: {
                id: true,
                name: true,
              },
            },
            workShiftSlot: {
              select: {
                id: true,
                shiftDate: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
        db.paymentRequest.count({ where }),
      ]);

      return {
        data: paymentRequests,
        count,
      };
    },

    async delete(id: string) {
      const existingPaymentRequest = await db.paymentRequest.findUnique({
        where: { id },
      });

      if (!existingPaymentRequest) {
        throw new AppError("Solicitação de pagamento não encontrada.", 404);
      }

      if (existingPaymentRequest.status !== PaymentRequestStatus.NEW) {
        throw new AppError(
          "Apenas solicitações com status NEW podem ser deletadas.",
          400,
        );
      }

      await db.paymentRequest.delete({
        where: { id },
      });

      return { message: "Solicitação de pagamento deletada com sucesso." };
    },
  };
}

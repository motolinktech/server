import type { Prisma } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { resend } from "../../services/email.service";
import { hashService } from "../../services/hash.service";
import { historyTraceActionsEnum } from "../../shared/enums/historyTraceAction.enum";
import { statusEnum } from "../../shared/enums/status.enum";
import { AppError } from "../../utils/appError";
import { generateToken } from "../../utils/generateToken";
import { historyTraceService } from "../historyTraces/historyTraces.service";
import type {
  UserDetailedType,
  UserMutateDTO,
  UserPasswordChangeDTO,
} from "./users.schema";

const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 20;

export function usersService() {
  return {
    async create(body: Omit<UserMutateDTO, "id">) {
      const data = { ...body, status: statusEnum.PENDING as string };

      if (data.password) {
        data.password = await hashService().hash(data.password);
        data.status = statusEnum.ACTIVE as string;
      }

      const user = await db.user.create({
        data: {
          ...data,
        },
        omit: {
          password: true,
        },
      });

      if (data.status === statusEnum.PENDING && !data.password) {
        const token = await generateToken();

        await db.verificationToken.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

        const passwordSetupLink = `${process.env.WEB_APP_URL}/trocar-senha?token=${token}&userId=${user.id}`;

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
          to: user.email,
          subject: "Configure sua senha",
          html: `
            <p>Olá!</p>
            <p>Sua conta foi criada. Para configurar sua senha, clique no link abaixo:</p>
            <p><a href="${passwordSetupLink}">${passwordSetupLink}</a></p>
            <p>Este link expira em 24 horas.</p>
          `,
        });
      }

      // Record creation in history traces (non-blocking)
      void historyTraceService().create({
        new: {
          ...(user as unknown as Record<string, unknown>),
          entityType: "User",
        },
        old: null,
        userId: user.id,
        action: historyTraceActionsEnum.CREATE,
      });

      return user;
    },

    async delete(id: string) {
      const existingUser = await db.user.findUnique({
        where: { id },
        omit: { password: true },
      });

      const user = await db.user.update({
        where: { id },
        data: { isDeleted: true },
      });

      // Record deletion in history traces (non-blocking)
      void historyTraceService().create({
        new: {
          ...(user as unknown as Record<string, unknown>),
          entityType: "User",
        },
        old: existingUser
          ? { ...(existingUser as Record<string, unknown>), entityType: "User" }
          : null,
        userId: user.id,
        action: historyTraceActionsEnum.DELETE,
      });

      return user;
    },

    async getById(id: string) {
      const user = await db.user.findUnique({
        where: { id },
        omit: {
          password: true,
        },
      });

      if (!user) {
        throw new AppError("Usuário não encontrado.", 404);
      }

      return user as unknown as UserDetailedType;
    },

    async list(input: {
      page?: number;
      limit?: number;
      search?: string;
      currentBranch?: string;
    }) {
      const { page = 1, limit = PAGE_SIZE, search, currentBranch } = input;

      const where: Prisma.UserWhereInput = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [users, count] = await db.$transaction([
        db.user.findMany({
          take: Number(limit),
          skip: (page - 1) * Number(limit),
          where: {
            ...where,
            branches: { has: currentBranch },
            isDeleted: false,
          },
          orderBy: {
            id: "asc",
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
            branches: true,
            status: true,
            verificationTokens: {
              select: {
                token: true,
              },
            },
          },
        }),
        db.user.count({
          where: {
            branches: { has: currentBranch },
            isDeleted: false,
          },
        }),
      ]);

      return {
        data: users,
        count,
      };
    },

    async changePassword(data: UserPasswordChangeDTO) {
      const { token, password, passwordConfirmation, id } = data;

      if (password !== passwordConfirmation) {
        throw new AppError("As senhas não coincidem.", 400);
      }

      const validToken = await db.verificationToken.findUnique({
        where: { token },
        select: {
          userId: true,
        },
      });

      if (!validToken) {
        throw new AppError("Acesso não autorizado.", 401);
      }

      if (validToken.userId !== id) {
        throw new AppError("Acesso não autorizado.", 401);
      }

      const hashedPassword = await hashService().hash(password);

      const prevUser = await db.user.findUnique({
        where: { id },
        omit: { password: true },
      });

      const updatedUser = await db.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          status: statusEnum.ACTIVE,
        },
        omit: {
          password: true,
        },
      });

      // Record password change in history traces (non-blocking)
      void historyTraceService().create({
        new: {
          ...(updatedUser as unknown as Record<string, unknown>),
          entityType: "User",
        },
        old: prevUser
          ? { ...(prevUser as Record<string, unknown>), entityType: "User" }
          : null,
        userId: updatedUser.id,
        action: historyTraceActionsEnum.EDIT,
      });

      await db.verificationToken.deleteMany({
        where: { userId: id },
      });

      return updatedUser;
    },

    async update(
      id: string,
      data: Partial<Omit<UserMutateDTO, "id" | "password">>,
    ) {
      const existingUser = await db.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new AppError("Usuário não encontrado.", 404);
      }

      const updatedUser = await db.user.update({
        where: { id },
        data: {
          ...data,
        },
      });

      // Record update in history traces (non-blocking)
      void historyTraceService().create({
        new: {
          ...(updatedUser as unknown as Record<string, unknown>),
          entityType: "User",
        },
        old: existingUser
          ? { ...(existingUser as Record<string, unknown>), entityType: "User" }
          : null,
        userId: updatedUser.id,
        action: historyTraceActionsEnum.EDIT,
      });

      return updatedUser;
    },
  };
}

export type UsersService = ReturnType<typeof usersService>;
export type ListUserServiceResponse = Awaited<ReturnType<UsersService["list"]>>;

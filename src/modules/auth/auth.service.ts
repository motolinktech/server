import type { User } from "../../../generated/prisma/client";
import { db } from "../../services/database.service";
import { hashService } from "../../services/hash.service";
import { AppError } from "../../utils/appError";
import type { AuthDTO } from "./auth.schema";

export const authService = () => {
  return {
    async authenticate(body: AuthDTO): Promise<Omit<User, "password">> {
      const { email, password } = body;

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        throw new AppError("Credenciais inválidas", 401);
      }

      const isValidPassword = await hashService().compare(
        password,
        user.password,
      );

      if (!isValidPassword) {
        throw new AppError("Credenciais inválidas", 401);
      }

      // @ts-expect-error
      // biome-ignore lint/suspicious/noTsIgnore: user cannot retrive with password field
      delete user.password;

      return user;
    },
  };
};

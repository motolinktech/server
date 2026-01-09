import { type Static, t } from "elysia";
import { passwordRegex } from "../../utils/passwordRegex";

export const AuthSchema = t.Object({
  email: t.String({
    format: "email",
    error: "Email inválido.",
  }),
  password: t.String({
    minLength: 8,
    maxLength: 128,
    pattern: passwordRegex.source,
    error:
      "Senha inválida. A senha deve ter entre 8 e 128 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.",
  }),
});

export type AuthDTO = Static<typeof AuthSchema>;

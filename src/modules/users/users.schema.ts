import { type Static, t } from "elysia";
import { userRolesArr } from "../../shared/enums/userRoles.enum";
import { passwordRegex } from "../../utils/passwordRegex";

export const UserMutateSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({
    minLength: 3,
    maxLength: 255,
    error: "Nome inválido.",
  }),
  email: t.String({
    format: "email",
    error: "Email inválido.",
  }),
  password: t.Optional(
    t.String({
      minLength: 8,
      maxLength: 128,
      pattern: passwordRegex.source,
      error:
        "Senha inválida. A senha deve ter entre 8 e 128 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.",
    }),
  ),
  role: t.Union(
    userRolesArr.map((role) => t.Literal(role)),
    {
      error: "Tipo de usuário inválida.",
    },
  ),
  branches: t.Optional(t.Array(t.String({ format: "uuid" }))),
  permissions: t.Optional(t.Array(t.String())),
});

export const UserPasswordChangeSchema = t.Object({
  id: t.String({
    error: "ID do usuário é obrigatório",
  }),
  password: t.String({
    minLength: 8,
    maxLength: 128,
    pattern: passwordRegex.source,
    error:
      "Senha inválida. A senha deve ter entre 8 e 128 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial.",
  }),
  passwordConfirmation: t.String({
    error: "Confirmação de senha é obrigatória",
  }),
  token: t.String({
    error: "Token é obrigatório",
  }),
});

export type UserMutateDTO = Static<typeof UserMutateSchema>;
export type UserPasswordChangeDTO = Static<typeof UserPasswordChangeSchema>;

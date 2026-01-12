import { type Static, t } from "elysia";
import { userRolesArr } from "../../shared/enums/userRoles.enum";
import { passwordRegex } from "../../utils/passwordRegex";
import { UserPlain } from "../../../generated/prismabox/User";

export const UserDocumentSchema = t.Object({
  url: t.String({
    error: "URL do documento é obrigatória.",
  }),
  type: t.String({
    error: "Tipo do documento é obrigatório.",
  }),
  uploadedAt: t.Date({
    error: "Data de upload é obrigatória.",
  }),
});

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
  birthDate: t.Date({
    error: "Data de nascimento inválida.",
  }),
  documents: t.Optional(t.Array(UserDocumentSchema, { default: [] })),
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

export const UserDetailedDocumentSchema = t.Object({
  type: t.String(),
  url: t.String(),
  uploadedAt: t.Date(),
});

export const UserDetailed = t.Composite([
  t.Omit(UserPlain, ["documents"]),
  t.Object({
    documents: t.Array(UserDetailedDocumentSchema),
  }),
]);

export type UserDocumentDTO = Static<typeof UserDocumentSchema>;
export type UserMutateDTO = Static<typeof UserMutateSchema>;
export type UserPasswordChangeDTO = Static<typeof UserPasswordChangeSchema>;
export type UserDetailedType = Static<typeof UserDetailed>;

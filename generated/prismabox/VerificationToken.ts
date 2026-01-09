import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const VerificationTokenPlain = t.Object(
  {
    id: t.String(),
    token: t.String(),
    userId: t.String(),
    expiresAt: t.Date(),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const VerificationTokenRelations = t.Object(
  {
    user: t.Object(
      {
        id: t.String(),
        name: t.String(),
        email: t.String(),
        password: __nullable__(t.String()),
        status: t.String(),
        image: __nullable__(t.String()),
        role: t.String(),
        permissions: t.Array(t.String(), { additionalProperties: false }),
        branchs: t.Array(t.String(), { additionalProperties: false }),
        isDeleted: t.Boolean(),
        updatedAt: t.Date(),
        createdAt: t.Date(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const VerificationTokenPlainInputCreate = t.Object(
  { token: t.String(), expiresAt: t.Date() },
  { additionalProperties: false },
);

export const VerificationTokenPlainInputUpdate = t.Object(
  { token: t.Optional(t.String()), expiresAt: t.Optional(t.Date()) },
  { additionalProperties: false },
);

export const VerificationTokenRelationsInputCreate = t.Object(
  {
    user: t.Object(
      {
        connect: t.Object(
          {
            id: t.String({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const VerificationTokenRelationsInputUpdate = t.Partial(
  t.Object(
    {
      user: t.Object(
        {
          connect: t.Object(
            {
              id: t.String({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
);

export const VerificationTokenWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          token: t.String(),
          userId: t.String(),
          expiresAt: t.Date(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "VerificationToken" },
  ),
);

export const VerificationTokenWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), token: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.String() }), t.Object({ token: t.String() })],
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.String(),
              token: t.String(),
              userId: t.String(),
              expiresAt: t.Date(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "VerificationToken" },
);

export const VerificationTokenSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      token: t.Boolean(),
      userId: t.Boolean(),
      user: t.Boolean(),
      expiresAt: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const VerificationTokenInclude = t.Partial(
  t.Object(
    { user: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const VerificationTokenOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      token: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      expiresAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const VerificationToken = t.Composite(
  [VerificationTokenPlain, VerificationTokenRelations],
  { additionalProperties: false },
);

export const VerificationTokenInputCreate = t.Composite(
  [VerificationTokenPlainInputCreate, VerificationTokenRelationsInputCreate],
  { additionalProperties: false },
);

export const VerificationTokenInputUpdate = t.Composite(
  [VerificationTokenPlainInputUpdate, VerificationTokenRelationsInputUpdate],
  { additionalProperties: false },
);

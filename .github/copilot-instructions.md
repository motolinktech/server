# Motolink Server - AI Coding Agent Instructions

## Tech Stack
- **Runtime**: Bun (not Node.js)
- **Framework**: ElysiaJS with TypeBox for validation
- **Database**: PostgreSQL via Prisma ORM with `@prisma/adapter-pg`
- **Code Quality**: Biome (formatter/linter), not ESLint/Prettier

## Architecture Overview

### Module Structure Pattern
Each feature follows a consistent three-file pattern under `src/modules/{feature}/`:
- `{feature}.schema.ts` - TypeBox (t imported from ElysiaJS) schemas and TypeScript types using `Static<typeof Schema>`
- `{feature}.service.ts` - Business logic exported as factory function returning object with methods
- `{feature}.routes.ts` - ElysiaJS route definitions with OpenAPI tags

**Example** (see `src/modules/clients/` or `src/modules/deliverymen/`):
```typescript
// service.ts
export function clientsService() {
  return {
    async create(data) { /* ... */ },
    async edit(id, data) { /* ... */ }
  };
}

// routes.ts
const service = clientsService();
export const clientsRoutes = new Elysia({ prefix: "/clients", detail: { tags: ["Clients"] } })
  .use(authPlugin)
  .guard({ isAuth: true }, (app) => app.post("/", ...))
```

### Nested Module Pattern
Sub-resources use nested prefixes (e.g., `src/modules/clients/blocks/` with routes at `/:clientId/blocks`). The parent module imports and uses child routes with `.use(childRoutes)`.

## Prisma & Database

### UUID Generation
Always use `@default(uuid(7))` for primary keys (not `cuid()` or standard UUID).

### Schema Changes Workflow
1. Edit `prisma/schema.prisma`
2. Run `bun prisma migrate dev --name descriptive_name` to create and apply migration
3. Prisma Client and Prismabox types regenerate automatically in `generated/`

### Prisma Relationships
- Use `onDelete: Cascade` for dependent data (e.g., `CommercialCondition` → `Client`)
- Use `onDelete: Restrict` for protected references (e.g., `Branch` → `Client`)
- Use `onDelete: SetNull` for optional references that should persist

### Prismabox Integration
Generated TypeBox schemas in `generated/prismabox/` provide Elysia-compatible validation. Use `t.Omit(GeneratedSchema, [...])` in route definitions.

## Authentication & Authorization

### Auth Plugin (`src/hooks/auth.hook.ts`)
Provides two guard macros:
- `isAuth: true` - Requires valid JWT, injects `user` into context
- `branchCheck: true` - Requires `branch-id` header, validates user has access to branch, injects `currentBranch`

**Development Mode**: Fake users are activated via bearer token matching keys in `src/utils/fakeUser.ts`.

### JWT Flow
1. Login returns JWT token
2. Client sends token via `Authorization: Bearer <token>` header
3. `authPlugin.derive()` verifies token and loads user into context
4. Guards validate and inject `user` or `currentBranch` into handler context

## Error Handling & Validation

### AppError Pattern
Throw `AppError` for expected errors with Portuguese messages and HTTP status codes:
```typescript
throw new AppError("Cliente não encontrado.", 404);
throw new AppError("Cliente já foi deletado.", 400);
```

### Validation
- Use TypeBox schemas with Elysia's built-in validation (body, params, query, headers)
- Error messages in Portuguese when needed: `t.String({ error: "Mensagem customizada" })`

## Conventions

### Language
- **Code**: English (variables, functions, types)
- **User-facing**: Portuguese (error messages, API documentation)
- **Database**: English (table/column names)

### Soft Deletes
Use `isDeleted: Boolean` flag, never hard delete. Always check `isDeleted` in service methods:
```typescript
if (existingClient.isDeleted) {
  throw new AppError("Cliente foi deletado.", 400);
}
```

### Pagination
Default `PAGE_SIZE` from env or 20. Return `{ data: [], count: number }` structure. Use `db.$transaction([findMany, count])` for consistency.

### Service Pattern
Export factory functions, not classes:
```typescript
export function myService() {
  return {
    async method1() {},
    async method2() {}
  };
}
```

### Query Patterns
Build `Prisma.{Model}WhereInput` objects conditionally using spread operators:
```typescript
const where = {
  isDeleted,
  ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
  ...(branchId ? { branchId } : {}),
};
```

## Development Commands

```bash
bun run dev              # Start dev server with watch mode
bun run lint             # Run Biome linter with auto-fix
bun run format           # Format code with Biome
bun run check            # Check without fixing

# Prisma
bun prisma migrate dev --name migration_name
bun prisma studio
bun prisma generate

# Build
bun run build           # Compile to standalone executable
```

## Key Files
- `src/server.ts` - App entry with CORS, OpenAPI/Scalar docs at `/docs`
- `src/routes.ts` - Central route registry at `/api` prefix
- `src/services/database.service.ts` - Shared Prisma client instance (`db`)
- `src/hooks/auth.hook.ts` - Authentication guards and JWT verification
- `prisma/schema.prisma` - Database schema with prismabox generator

## Common Patterns

### Adding New Module
1. Create `src/modules/{feature}/{feature}.schema.ts` with TypeBox schemas
2. Create `src/modules/{feature}/{feature}.service.ts` with factory function
3. Create `src/modules/{feature}/{feature}.routes.ts` with Elysia instance
4. Register in `src/routes.ts` with `.use({feature}Routes)`

### Adding Nested Routes
1. Create subdirectory `src/modules/{parent}/{child}/`
2. Use dynamic params in prefix: `prefix: "/:parentId/{child}"`
3. Import and `.use()` in parent routes file

### Working with Decimals
Prisma Decimal fields are returned as Prisma.Decimal objects. In response schemas, use `t.Any()` or `t.Object({})` for compatibility with TypeBox.

### Module Routes
All routes should be a ElysiaJS instance by itself to improve type safety and modularity.

### Git Commit Messages
The commit messages should be in portguese but follow the conventional commits structure. The pattern is:  
`<type>[escopo opcional]: <descrição>`
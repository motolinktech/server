# Motolink Server API Reference

## 1. Overview
- Purpose: Backend API for Motolink administration and operational features (users, branches, clients, deliverymen, scheduling, payments, events, etc.).
- Base URL: `/api` (see [src/routes.ts](src/routes.ts#L1-L20)).
- Auth mechanism: JWT-based authentication using `@elysiajs/jwt`. The `/auth` route issues tokens. Many modules use an `authPlugin` which derives the `user` and supports two guards: `isAuth` and `branchCheck`.
- Error response standard: services throw `AppError` with message and HTTP status; the app returns JSON error objects. Common success responses follow TypeBox schemas defined in each route file.

## 2. Authentication
- How it works: Call `POST /api/auth` with credentials (see `AuthSchema` in `src/modules/auth/auth.schema.ts`) to receive `{ user, token }`. The server signs JWTs with `process.env.JWT_SECRET` (default `secret`).
- Token delivery: `Authorization: Bearer <token>` header.
- Protected vs public routes: `authRoutes` (`/api/auth`) is public. Other module routes use `authPlugin` and `.guard({ isAuth: true })` — authenticated. Many also require `branchCheck: true` for branch-scoped operations.
- Roles/permissions: `User.role` and `User.permissions` exist; `branches` route has a server-side `onBeforeHandle` check restricting creation to `ADMIN` role.

## 3. Database (Prisma) — Key Models
See `prisma/schema.prisma` for full model definitions. Below are models that affect API behavior.

- `User`
  - id: String (uuid(7))
  - name: String
  - email: String (unique)
  - password: String? (nullable)
  - role: String (default "USER")
  - permissions: String[]
  - branches: String[]
  - isDeleted: Boolean
  - verificationTokens: Relation -> `VerificationToken`

- `Branch`
  - id, name, code(unique), address?
  - relations: `groups`, `regions`, `deliverymen`, `clients`

- `Client`
  - id, name, cnpj, address fields, contactName, contactPhone
  - branchId (relation to Branch)
  - commercialCondition: One-to-one `CommercialCondition`
  - isDeleted flag

- `Deliveryman`
  - id, name, document, phone, contractType
  - branchId, regionId
  - isBlocked, isDeleted
  - relations: `workShiftSlots`, `blocks`, `paymentRequests`

- `WorkShiftSlot`
  - id, deliverymanId?, clientId, status, contractType, shiftDate, startTime, endTime, logs
  - relations: `paymentRequests`

- `PaymentRequest`
  - id, workShiftSlotId, deliverymanId, amount (Decimal 16,2), status

- `Event`
  - id, name, description?, date, startHour, endHour, branches(String[]), createdBy -> User

- `Planning`
  - id, clientId, branchId, plannedDate, plannedCount
  - unique: [clientId, plannedDate]

- `CommercialCondition`
  - Many decimal fields and arrays for payment/delivery settings; clientId unique.

- `ClientBlock`
  - Unique composite of [clientId, deliverymanId]

Note: Prisma generator `prismabox` produces TypeBox schemas in `generated/prismabox/` used in route validators.

## 4. Shared Schemas
- Error format: thrown `AppError` -> HTTP status + JSON message. Each route also defines `response` TypeBox validators for success 200 responses.
- Pagination: Many list endpoints accept `page` and `limit` with default `PAGE_SIZE` from env (default 20). Response pattern: `{ data: [...], count: number }`.
- Common DTOs: Route files reuse `generated/prismabox` types (e.g., `User`, `Client`, `Deliveryman`, etc.) and local `*MutateSchema` and `List*Schema` TypeBox validators.

## 5. Modules and Endpoints
Paths below are prefixed with the global base `/api`.

Summary of modules discovered:
- Auth
- Branches
- Users
- Events
- Groups
- Regions
- History Traces
- Deliverymen
- Clients (and nested Client Blocks)
- Work Shift Slots
- Payment Requests
- Planning

Total endpoints documented: 58

(For each module we list method, path, auth, params/query/body, and response schema references with small examples.)

---

**Auth**
- POST /api/auth
  - Description: Authenticate and receive JWT
  - Auth: Public
  - Body: `AuthSchema` (email/password)
  - Response 200: `{ user: User (without password), token: string }`
  - Example body: `{ "email": "admin@example.com", "password": "secret" }`

**Branches** (`/api/branches`)
- GET `/api/branches` — Auth: isAuth
  - Query: optional pagination
  - Response: `{ data: Branch[], count: number }`
- POST `/api/branches` — Auth: isAuth, role must be `ADMIN` (server-side check)
  - Body: `BranchMutateSchema` (name, code, address?)
  - Response: Branch
- GET `/api/branches/:id` — Auth: isAuth
  - Params: `id` (string)
  - Response: Branch
- PUT `/api/branches/:id` — Auth: isAuth
  - Body: `BranchMutateSchema`
  - Response: Branch

**Users** (`/api/users`)
- POST `/api/users` — Auth: isAuth, branchCheck
  - Body: `UserMutateSchema` (without id)
  - Response: User (omit password and some relations)
- GET `/api/users` — Auth: isAuth, branchCheck
  - Query: pagination/filter
  - Response: `{ data: [...], count }` (user list shape defined in route)
- GET `/api/users/:id` — Auth: isAuth, branchCheck
- GET `/api/users/me` — Auth: isAuth
  - Response: current user (omit password)
- DELETE `/api/users/:id` — Auth: isAuth
- POST `/api/users/:id/change-password` — Public/auth not required by guard (defined outside guard)
  - Body: `UserPasswordChangeSchema`

**Events** (`/api/events`) — guarded with `isAuth` and `branchCheck`
- POST `/api/events` — Body: `EventMutateSchema` (route signs createdBy using `user.id`)
- GET `/api/events` — Query: `ListEventsSchema` (page/limit/search)
  - Response: `{ data: Event[], count }`
- GET `/api/events/:id` — Response: `EventDetailed`
- PUT `/api/events/:id` — Body: `EventMutateSchema` (without id)
- DELETE `/api/events/:id`

**Groups** (`/api/groups`)
- POST `/api/groups` — Auth + branchCheck
- GET `/api/groups` — Auth + branchCheck (list with pagination)
- GET `/api/groups/:id` — Auth + branchCheck
- PUT `/api/groups/:id` — Auth + branchCheck
- DELETE `/api/groups/:id` — Auth + branchCheck

**Regions** (`/api/regions`)
- POST `/api/regions` — Auth + branchCheck (body excluding branchId)
- GET `/api/regions` — Auth + branchCheck
- GET `/api/regions/:id` — Auth + branchCheck
- PUT `/api/regions/:id` — Auth + branchCheck
- DELETE `/api/regions/:id` — Auth + branchCheck

**History Traces** (`/api/history-traces`)
- GET `/api/history-traces` — Auth
  - Query: `HistoryTraceListQuerySchema`
  - Response: `HistoryTraceListResponseSchema`
- GET `/api/history-traces/:id` — Auth

**Deliverymen** (`/api/deliverymen`)
- POST `/api/deliverymen` — Auth + branchCheck (body will be merged with `currentBranch`)
- GET `/api/deliverymen` — Auth + branchCheck (list with pagination)
- GET `/api/deliverymen/:id` — Auth + branchCheck
- PUT `/api/deliverymen/:id` — Auth + branchCheck
- PATCH `/api/deliverymen/:id/toggle-block` — Auth + branchCheck (toggles `isBlocked`)
- DELETE `/api/deliverymen/:id` — Auth + branchCheck

**Clients** (`/api/clients`)
- POST `/api/clients` — Auth + branchCheck
  - Body: `{ client: ClientMutateSchema (without id, branchId), commercialCondition?: CommercialConditionSchema }`
- GET `/api/clients/simplified` — Auth + branchCheck
- GET `/api/clients/complete` — Auth + branchCheck
- GET `/api/clients/:clientId` — Auth + branchCheck
- PUT `/api/clients/:clientId` — Auth + branchCheck
- DELETE `/api/clients/:clientId` — Auth + branchCheck

**Client Blocks** (nested under clients)
- POST `/api/clients/:clientId/blocks` — Auth + branchCheck
  - Body: `CreateClientBlockSchema`
- GET `/api/clients/:clientId/blocks` — Auth + branchCheck
- DELETE `/api/clients/:clientId/blocks/:blockId` — Auth + branchCheck

**Work Shift Slots** (`/api/work-shift-slots`)
- POST `/api/work-shift-slots` — Auth + branchCheck
- GET `/api/work-shift-slots` — Auth + branchCheck
- GET `/api/work-shift-slots/:id` — Auth + branchCheck
- GET `/api/work-shift-slots/group/:groupId` — Auth + branchCheck
- PUT `/api/work-shift-slots/:id` — Auth + branchCheck

**Payment Requests** (`/api/payment-requests`)
- POST `/api/payment-requests` — Auth + branchCheck
- GET `/api/payment-requests` — Auth + branchCheck
- GET `/api/payment-requests/:id` — Auth + branchCheck
- PUT `/api/payment-requests/:id` — Auth + branchCheck
- DELETE `/api/payment-requests/:id` — Auth + branchCheck

**Planning** (`/api/planning`)
- POST `/api/planning` — Auth + branchCheck
- GET `/api/planning` — Auth + branchCheck
- GET `/api/planning/:id` — Auth + branchCheck
- PUT `/api/planning/:id` — Auth + branchCheck
- DELETE `/api/planning/:id` — Auth + branchCheck

---

## Notes & Examples
- UUIDs used across models are `uuid(7)` format strings.
- Dates are ISO-8601 (`Date` TypeBox validators used).
- Monetary/decimal fields use Prisma `Decimal` and responses often map to `t.Any()` or `t.Object({ amount: t.Any() })` to accommodate Decimal serialization.

## Files referenced while generating this document
- [src/routes.ts](src/routes.ts#L1-L20)
- [prisma/schema.prisma](prisma/schema.prisma#L1-L400)
- Module route files (examples):
  - [src/modules/auth/auth.routes.ts](src/modules/auth/auth.routes.ts#L1-L60)
  - [src/modules/clients/clients.routes.ts](src/modules/clients/clients.routes.ts#L1-L200)
  - [src/modules/clients/blocks/blocks.routes.ts](src/modules/clients/blocks/blocks.routes.ts#L1-L200)
  - [src/modules/events/events.routes.ts](src/modules/events/events.routes.ts#L1-L200)


---

End of generated server documentation.

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
  - provideMeal: Boolean (default false) — indicates whether the client receives meal provision
  - branchId (relation to Branch)
  - commercialCondition: One-to-one `CommercialCondition`
  - isDeleted flag

- `Deliveryman`
  - id, name, document, phone, contractType
  - branchId, regionId
  - isBlocked, isDeleted
  - relations: `workShiftSlots`, `blocks`, `paymentRequests`

- `WorkShiftSlot`
  - id: String (uuid(7))
  - deliverymanId: String? (nullable)
  - clientId: String
  - status: String (OPEN | INVITED | CONFIRMED | CHECKED_IN | PENDING_COMPLETION | COMPLETED | ABSENT | CANCELLED | REJECTED)
  - contractType: String
  - shiftDate: DateTime
  - startTime: DateTime
  - endTime: DateTime
  - period: String[] (default ["daytime"]) — values: `daytime` | `nighttime`
  - auditStatus: String
  - logs: Json[]
  - checkInAt: DateTime?
  - checkOutAt: DateTime?
  - isFreelancer: Boolean (default false)
  - inviteSentAt: DateTime?
  - inviteToken: String? (unique)
  - inviteExpiresAt: DateTime?
  - trackingConnected: Boolean (default false)
  - trackingConnectedAt: DateTime?
  - deliverymanAmountDay: Decimal(16,2) (default 0) — payment amount for daytime shifts
  - deliverymanAmountNight: Decimal(16,2) (default 0) — payment amount for nighttime shifts
  - updatedAt, createdAt
  - relations: `deliveryman`, `client`, `paymentRequests`, `invites`
  - indexes: [clientId, shiftDate], [deliverymanId, shiftDate], [inviteToken]
  - deliverymanPaymentType: String — (e.g. "mainPixKey" | "account" ) indicates how the deliveryman is paid
  - deliverymenPaymentValue: String — string value representing the payment metric (matches `deliverymanPaymentType`, e.g. "pix-key-asda")

- `PaymentRequest`
  - id, workShiftSlotId, deliverymanId, amount (Decimal 16,2), status

- `Invite`
  - id: String (uuid(7))
  - token: String (unique)
  - status: String (PENDING | ACCEPTED | REJECTED | EXPIRED)
  - workShiftSlotId: String
  - deliverymanId: String
  - clientId: String
  - clientName: String
  - clientAddress: String
  - shiftDate: DateTime
  - startTime: DateTime
  - endTime: DateTime
  - sentAt: DateTime
  - expiresAt: DateTime
  - respondedAt: DateTime?
  - updatedAt, createdAt
  - relations: `workShiftSlot`, `deliveryman`, `client`
  - indexes: [token], [workShiftSlotId]

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
- Work Shift Slot Invites
- Payment Requests
- Planning

Total endpoints documented: 67

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
    - Note: `ClientMutateSchema` includes `provideMeal?: boolean` (default: false)
- GET `/api/clients/simplified` — Auth + branchCheck
- GET `/api/clients/complete` — Auth + branchCheck
- GET `/api/clients/:clientId` — Auth + branchCheck
- PUT `/api/clients/:clientId` — Auth + branchCheck
  - Note: `ClientMutateSchema` includes `provideMeal?: boolean` (default: false)
- DELETE `/api/clients/:clientId` — Auth + branchCheck

**Client Blocks** (nested under clients)
- POST `/api/clients/:clientId/blocks` — Auth + branchCheck
  - Body: `CreateClientBlockSchema`
- GET `/api/clients/:clientId/blocks` — Auth + branchCheck
- DELETE `/api/clients/:clientId/blocks/:blockId` — Auth + branchCheck

**Work Shift Slots** (`/api/work-shift-slots`)
- Summary: Manage scheduled delivery shifts (create, list, lifecycle actions, check-in/out, mark absent, connect tracking, delete/cancel). Invitation sending/response lives under the `/invites` submodule.
- Auth: Core slot routes require `isAuth` and `branchCheck` via `authPlugin`. Invite lookup/response is public (token required), while bulk invite sending requires auth (see Invites module below).

Response format note: Most responses use `WorkShiftSlotResponse`, which converts Decimal fields (`deliverymanAmountDay`, `deliverymanAmountNight`) to strings. `GET /api/work-shift-slots/:id` returns the full `WorkShiftSlot` with `deliveryman` and `client` relations, but still coerces the Decimal amounts to strings.

Status enum values: `OPEN` | `INVITED` | `CONFIRMED` | `CHECKED_IN` | `PENDING_COMPLETION` | `COMPLETED` | `ABSENT` | `CANCELLED` | `REJECTED`

Valid status transitions:
- `OPEN` → `INVITED`, `CONFIRMED`, `CANCELLED`
- `INVITED` → `CONFIRMED`, `OPEN`, `CANCELLED`, `REJECTED`
- `CONFIRMED` → `CHECKED_IN`, `ABSENT`, `CANCELLED`
- `CHECKED_IN` → `PENDING_COMPLETION`, `ABSENT`
- `PENDING_COMPLETION` → `COMPLETED`
- `COMPLETED` → (terminal)
- `ABSENT` → (terminal)
- `CANCELLED` → (terminal)
- `REJECTED` → (terminal)

Endpoints (detailed):
- POST `/api/work-shift-slots`
  - Description: Create a new work shift slot for a client (optionally assign a deliveryman).
  - Auth: `isAuth`, `branchCheck`
  - Body (request): `WorkShiftSlotMutateSchema`
    - `clientId` (string) — required
    - `deliverymanId` (string) — optional
    - `contractType` (string) — required
    - `shiftDate` (string, ISO) — required
    - `startTime` (string, ISO) — required
    - `endTime` (string, ISO) — required
    - `period` (array of `daytime` | `nighttime`) — required, error: "Período é obrigatório (daytime ou nighttime)", default: `["daytime"]`
    - `auditStatus` (string) — required
    - `status` (string) — optional, defaults to `OPEN`
    - `isFreelancer` (boolean) — optional, default: false
    - `logs` (array) — optional
  - Time normalization:
    - `startTime` and `endTime` are normalized to the provided `shiftDate` day.
    - If `endTime` is the same as or earlier than `startTime`, it is treated as overnight and stored on the next day.
  - Response 200: `WorkShiftSlotResponse`. Example:
    ```json
    {
      "id": "01JHRZ5K8MNPQRS",
      "clientId": "01JHRZ5K8MABCDE",
      "deliverymanId": null,
      "status": "OPEN",
      "contractType": "CLT",
      "shiftDate": "2026-01-16T00:00:00.000Z",
      "startTime": "2026-01-16T08:00:00.000Z",
      "endTime": "2026-01-16T12:00:00.000Z",
      "period": ["daytime"],
      "auditStatus": "PENDING",
      "isFreelancer": false,
      "logs": [],
      "deliverymanAmountDay": "150.00",
      "deliverymanAmountNight": "0",
      "deliverymanPaymentType": "per_shift",
      "deliverymenPaymentValue": "150.00"
    }
    ```

- GET `/api/work-shift-slots`
  - Description: List work shift slots with pagination and filters.
  - Auth: `isAuth`, `branchCheck`
  - Query params (`ListWorkShiftSlotsSchema`):
    - `page` (number) — optional, default 1
    - `limit` (number) — optional, default PAGE_SIZE env or 20
    - `clientId` (string) — optional (single ID only)
    - `groupId` (string) — optional, filters by `client.groupId`
    - `deliverymanId` (string) — optional
    - `status` (string) — optional
    - `period` (array of `daytime` | `nighttime`) — optional, filters slots containing any of the provided periods (uses Prisma `hasSome`)
    - `isFreelancer` (boolean) — optional
    - `startDate` (string) — optional, ISO or `YYYY-MM-DD`
    - `endDate` (string) — optional, ISO or `YYYY-MM-DD`
    - `month` (number) — optional, narrows `shiftDate` to that month
    - `week` (number) — optional, narrows `shiftDate` to that week
  - Date handling behavior:
    - If `startDate` or `endDate` is provided, those are used to build the date range (supports ISO or `YYYY-MM-DD`); date-only values are normalized to start/end of day.
    - If only one date is provided, the range is that single day.
    - If no dates are provided, falls back to `month`/`week`, and finally to the current week (Mon–Sun).
  - Response 200: `{ data: WorkShiftSlotResponse[] (with deliveryman{ id,name } + client{ id,name }), count: number }`
  - Note: Items in `data` include `checkInAt` and `checkOutAt` (nullable ISO-8601 timestamps) when present.
  - Example query: `?page=1&limit=20&groupId=01JHRZ5K8MGRP01&startDate=2026-01-13&endDate=2026-01-19&period[]=daytime`

- GET `/api/work-shift-slots/:id`
  - Description: Retrieve a single slot with `deliveryman` and `client` relations.
  - Auth: `isAuth`, `branchCheck`
  - Params: `id` (string)
  - Response 200: Full `WorkShiftSlot` with `deliveryman` (nullable) and `client` objects. `deliverymanAmountDay`/`deliverymanAmountNight` are strings in the JSON response.
  - Additional fields returned by GET routes:
    - `checkInAt`: `Date | null` — ISO-8601 timestamp when the slot was checked in. Set by `POST /api/work-shift-slots/:id/check-in` when the status transitions to `CHECKED_IN`.
      - Example: `"checkInAt": "2026-01-16T10:15:30.000Z"`
    - `checkOutAt`: `Date | null` — ISO-8601 timestamp when the slot was checked out. Set by `POST /api/work-shift-slots/:id/check-out` when the status transitions to `PENDING_COMPLETION`.
      - Example: `"checkOutAt": "2026-01-16T13:05:45.000Z"`

- GET `/api/work-shift-slots/group/:groupId`
  - Description: Returns work shift slots grouped by client name for a given `groupId`.
  - Auth: `isAuth`, `branchCheck`
  - Params: `groupId` (string)
  - Query params (`ListWorkShiftSlotsByGroupSchema`):
    - `startDate` (string) — optional, accepts ISO (e.g., `2026-01-15T00:00:00.000Z`) or date-only (`2026-01-15`) format
    - `endDate` (string) — optional, accepts ISO or date-only format
  - Date handling behavior:
    - If both omitted, defaults to current week (Monday-Sunday) via `getDateRange()`
    - If only `startDate` provided, `endDate` defaults to end of that same day
    - If only `endDate` provided, `startDate` defaults to start of that same day
    - If format is `YYYY-MM-DD`, date is normalized to start/end of day respectively
  - Response 200: `Record<string, WorkShiftSlotResponse[]>` keyed by client name. Each slot includes `deliveryman` (nullable id/name).
  - Errors:
    - 400 "startDate inválido. Use formato ISO ou YYYY-MM-DD." — if `startDate` cannot be parsed
    - 400 "endDate inválido. Use formato ISO ou YYYY-MM-DD." — if `endDate` cannot be parsed
    - 400 "endDate não pode ser anterior a startDate." — if `endDate < startDate`
  - Example queries:
    - `?startDate=2026-01-13&endDate=2026-01-19` — date range filter
    - `?startDate=2026-01-15` — single day (start to end of Jan 15)
    - `?startDate=2026-01-15T08:00:00.000Z&endDate=2026-01-15T18:00:00.000Z` — ISO timestamps

- PUT `/api/work-shift-slots/:id`
  - Description: Update a slot. Status transitions are validated server-side.
  - Auth: `isAuth`, `branchCheck`
  - Params: `id` (string)
  - Body: same as create (`WorkShiftSlotMutateSchema`, `id` omitted)
  - Important: Invalid status transitions will return 400 with message like `Transição de status inválida: OPEN -> CONFIRMED`.
  - Time normalization: If `shiftDate`, `startTime`, or `endTime` is updated, times are re-normalized to the (possibly updated) `shiftDate` and overnight end-times are moved to the next day.
  - Response 200: Updated `WorkShiftSlotResponse`.

Action endpoints (stateful operations):
- POST `/api/work-shift-slots/:id/check-in`
  - Description: Mark slot as `CHECKED_IN` and set `checkInAt`. Only allowed when slot status is `CONFIRMED`.
  - Auth: `isAuth`, `branchCheck`
  - Body (`CheckInOutSchema`): optional `{ location?: { lat: number, lng: number } }`
  - Response 200: Updated `WorkShiftSlotResponse`.
  - Errors: 404 "Turno não encontrado."; 400 "Apenas turnos CONFIRMADOS podem fazer check-in."

- POST `/api/work-shift-slots/:id/check-out`
  - Description: Mark slot as `PENDING_COMPLETION` and set `checkOutAt`. Only allowed when slot status is `CHECKED_IN`.
  - Auth: `isAuth`, `branchCheck`
  - Body (`CheckInOutSchema`): optional `{ location?: { lat: number, lng: number } }`
  - Response 200: Updated `WorkShiftSlotResponse`.
  - Errors: 404 "Turno não encontrado."; 400 "Apenas turnos com CHECK_IN podem fazer check-out."

- POST `/api/work-shift-slots/:id/confirm-completion`
  - Description: Mark slot as `COMPLETED`. Only allowed when slot status is `PENDING_COMPLETION`.
  - Auth: `isAuth`, `branchCheck`
  - Response 200: Updated `WorkShiftSlotResponse`.
  - Errors: 404 "Turno não encontrado."; 400 "Apenas turnos com PENDING_COMPLETION podem ser concluídos."

- POST `/api/work-shift-slots/:id/mark-absent`
  - Description: Mark slot as `ABSENT`. Allowed from any status.
  - Auth: `isAuth`, `branchCheck`
  - Body (`MarkAbsentSchema`): `{ reason?: string (maxLength 500) }`
  - Response 200: Updated `WorkShiftSlotResponse`.
  - Errors: 404 "Turno não encontrado."

- POST `/api/work-shift-slots/:id/connect-tracking`
  - Description: Marks `trackingConnected = true` and sets `trackingConnectedAt`.
  - Auth: `isAuth`, `branchCheck`
  - Response 200: Updated `WorkShiftSlotResponse`.
  - Errors: 404 "Turno não encontrado."

- DELETE `/api/work-shift-slots/:id`
  - Description: Deletes a slot if it is `OPEN`; otherwise sets status to `CANCELLED` and appends a log entry.
  - Auth: `isAuth`, `branchCheck`
  - Params: `id` (string)
  - Response 200: Updated `WorkShiftSlotResponse`.
  - Errors: 404 "Turno não encontrado."

- POST `/api/work-shift-slots/copy`
  - Description: Copies all work shift slots from a source date to a target date for a specific client. Handles deliveryman conflicts by copying shifts without the deliveryman assignment if conflicts exist.
  - Auth: `isAuth`, `branchCheck`
  - Body (`CopyWorkShiftSlotsSchema`):
    - `sourceDate` (string, ISO date) — required, the date to copy shifts from
    - `targetDate` (string, ISO date) — required, the date to copy shifts to
    - `clientId` (string) — required, only copies shifts for this client
  - Business rules:
    - Ignores shifts with status `CANCELLED`
    - Copies all other shifts (including `OPEN` shifts without deliveryman)
    - Keeps the same hours (e.g., 08:00-14:00 becomes 08:00-14:00 on target date)
    - Checks for deliveryman time conflicts on target date
    - If a deliveryman has a conflicting shift (status `INVITED`, `CONFIRMED`, `CHECKED_IN`, or `PENDING_COMPLETION`), the shift is copied WITHOUT the deliveryman (set to null, status `OPEN`) and included in warnings
  - Response 200:
    ```json
    {
      "copiedShifts": [WorkShiftSlotResponse, ...],
      "warnings": {
        "message": "2 turno(s) copiado(s) sem entregador devido a conflitos de horário",
        "conflictedShifts": [
          {
            "sourceShiftId": "01JHRZ5K8MNPQRS",
            "deliverymanId": "01JHRZ5K8MABCDE",
            "deliverymanName": "João Silva",
            "conflictingShiftId": "01JHRZ5K8MXYZAB"
          }
        ]
      }
    }
    ```
    Note: `warnings` is `null` if no conflicts occurred.
  - Errors:
    - 404 "Nenhum turno encontrado na data de origem" — if no non-cancelled shifts exist on source date for the client
  - Example request body:
    ```json
    {
      "sourceDate": "2026-01-25",
      "targetDate": "2026-01-26",
      "clientId": "01JHRZ5K8MABCDE"
    }
    ```

Notes & behavior details:
- Date/time fields: route validation expects ISO strings for `shiftDate`, `startTime`, `endTime`. The service normalizes `startTime`/`endTime` to the `shiftDate` day and bumps overnight `endTime` to the next day. Responses use `Date` types (from generated Prismabox schemas).
- Decimal fields: `deliverymanAmountDay` and `deliverymanAmountNight` are Prisma `Decimal(16,2)` in DB but converted to strings in API responses.
 - Check-in / check-out flow:
   - `POST /api/work-shift-slots/:id/check-in` sets `status = CHECKED_IN` and `checkInAt = <now>`; the response includes the `checkInAt` value (nullable before action).
   - `POST /api/work-shift-slots/:id/check-out` sets `status = PENDING_COMPLETION` and `checkOutAt = <now>`; the response includes the `checkOutAt` value (nullable before action).
   - Both `checkInAt` and `checkOutAt` are nullable and only populated after their respective actions occur.
- Status transitions: enforced by `isValidStatusTransition` in service; invalid transitions return 400.
- Invite flow: `POST /api/work-shift-slots/invites` creates an `Invite`, sets `inviteToken`, `inviteSentAt`, and `inviteExpiresAt` on the slot, appends `INVITE_SENT` to logs, and sends a WhatsApp message with a `WEB_APP_URL` confirmation link. Public invite endpoints (`GET/POST /api/work-shift-slots/invites/:inviteId`) require the token query param. Accepting updates the invite to `ACCEPTED`, sets slot status to `CONFIRMED`, clears `inviteToken` (keeps `inviteSentAt`/`inviteExpiresAt`), and logs `INVITE_ACCEPTED`. Rejecting updates the invite to `REJECTED`, sets slot status to `OPEN`, clears `deliverymanId`, `inviteToken`, `inviteSentAt`, and `inviteExpiresAt`, and logs `INVITE_REJECTED`.
- Pagination: `GET /api/work-shift-slots` returns `{ data, count }` and supports `page`/`limit` and date narrowing via `month`/`week` params which the service maps to a date range.
- Filters: `GET /api/work-shift-slots` also supports `startDate`/`endDate` (ISO or `YYYY-MM-DD`) and `groupId` (filters by `client.groupId`). If both `clientId` and `groupId` are provided, both must match.
- Logs: Each action (INVITE_SENT, INVITE_ACCEPTED, INVITE_REJECTED, CHECK_IN, CHECK_OUT, CONFIRM_COMPLETION, MARKED_ABSENT, TRACKING_CONNECTED, CANCELLED) appends to the `logs` array with timestamp and relevant data.

**Work Shift Slot Invites** (`/api/work-shift-slots/invites`)
- Summary: Send invites for `WorkShiftSlot` records and allow deliverymen to view/respond via token-based endpoints.
- Auth: Public token-based endpoints (`GET /:inviteId`, `POST /:inviteId/respond`); bulk send (`POST /`) requires `isAuth` and `branchCheck`.

Endpoints (detailed):
- POST `/api/work-shift-slots/invites`
  - Description: Sends WhatsApp invites in bulk for `INVITED` slots on a given date (single slot, client, or group).
  - Auth: `isAuth`, `branchCheck`
  - Body (`SendBulkInvitesSchema`):
    - `date` (string, `DD/MM/YYYY`) — required
    - `workShiftSlotId` (string) — optional
    - `groupId` (string) — optional
    - `clientId` (string) — optional
    - At least one of `workShiftSlotId`, `groupId`, `clientId` must be provided.
  - Behavior:
    - `workShiftSlotId`: slot must exist, be `INVITED`, and have `deliverymanId`.
    - `groupId`: must resolve to at least one client; invites are sent to all `INVITED` slots for those clients on `date`.
    - `clientId`: client must exist; invites are sent to that client’s `INVITED` slots on `date`.
    - Each invite creates an `Invite` record, sets `inviteToken`, `inviteSentAt`, and `inviteExpiresAt` (24h) on the slot, and logs `INVITE_SENT`.
    - If no matching slots for a client/group on the given date, the response is `sent: 0, failed: 0, errors: []`.
  - Response 200: `{ sent: number, failed: number, errors: Array<{ slotId: string, reason: string }> }`
  - Errors:
    - 400 "Pelo menos um dos campos workShiftSlotId, groupId ou clientId deve ser fornecido."
    - 400 "Data inválida. Use o formato dd/MM/YYYY."
    - 404 "Turno não encontrado." / "Cliente não encontrado." / "Nenhum cliente encontrado para este grupo."
    - 400 "Apenas turnos com status INVITED podem receber convites." / "Turno não possui entregador atribuído."
  - Example body:
    ```json
    { "date": "28/01/2026", "groupId": "01JHRZ5K8MGRP01" }
    ```
  - Example response:
    ```json
    { "sent": 3, "failed": 1, "errors": [{ "slotId": "01JHRZ5K8MNPQRS", "reason": "Falha ao enviar mensagem WhatsApp." }] }
    ```

- GET `/api/work-shift-slots/invites/:inviteId` (Public)
  - Description: Fetch invite details by ID (token required).
  - Query (`GetInviteQuerySchema`): `token` (string) — required
  - Response 200: `InviteResponseSchema`
    - Fields: `id`, `token`, `status`, `workShiftSlotId`, `deliverymanId`, `clientId`, `clientName`, `clientAddress`, `shiftDate`, `startTime`, `endTime`, `sentAt`, `expiresAt`, `respondedAt`
  - Behavior: If `status=PENDING` and `expiresAt` is in the past, the invite is updated to `EXPIRED` before returning.
  - Errors: 404 "Convite não encontrado."; 401 "Token inválido."
  - Example query: `?token=0e14b7f1b8f34f2e9a`

- POST `/api/work-shift-slots/invites/:inviteId/respond` (Public)
  - Description: Accept or reject an invite using the token.
  - Query (`GetInviteQuerySchema`): `token` (string) — required
  - Body (`RespondInviteSchema`): `{ isAccepted: boolean }`
  - Success:
    - `isAccepted=true`: invite status → `ACCEPTED`, slot status → `CONFIRMED`, `inviteToken` cleared, logs `INVITE_ACCEPTED`.
    - `isAccepted=false`: invite status → `REJECTED`, slot status → `OPEN`, clears `deliverymanId`, `inviteToken`, `inviteSentAt`, `inviteExpiresAt`, logs `INVITE_REJECTED`.
  - Response 200: `WorkShiftSlotResponse`
  - Errors: 404 "Convite não encontrado."; 401 "Token inválido."; 400 "Este convite não está mais válido."; 400 "Este convite expirou."
  - Example body: `{ "isAccepted": true }`

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

Notes on `Planning` payloads:
- `PlanningMutateSchema` fields: `clientId: string`, `branchId: string`, `plannedDate: string (ISO)`, `plannedCount: number`, `period: 'daytime' | 'nighttime'`
- Unique constraint in DB: `@@unique([clientId, plannedDate, period])` — creating duplicates will raise AppError/validation from service layer.

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

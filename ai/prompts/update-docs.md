# AI Agent Task: Keep Server Documentation Updated (ai/docs/server.md)

## Goal
You are an AI agent responsible for maintaining the documentation file:

- Path: `ai/docs/server.md`

This documentation is consumed by other AI agents, so it must always reflect the current state of the server.

Your job is to detect project changes and update `ai/docs/server.md` accordingly.

You must update the file directly. Do not print the full documentation content in your final response.

## Input Parameter (Required)
You must receive a parameter called:

- `FOCUS_MODULE`

This parameter controls the scope of your work.

### Rules for `FOCUS_MODULE`
- If `FOCUS_MODULE = "*"`, scan and document the entire server.
- If `FOCUS_MODULE = "<module-name>"`, focus only on that module (but still update shared/global changes if they impact it).
- If the module does not exist, report it clearly and do not invent documentation.

## What You Must Always Do
1. Scan the codebase and identify changes that affect the server behavior.
2. Update `ai/docs/server.md` so it matches the current implementation.
3. Always check `schema.prisma` for database changes and reflect them in the documentation.
4. Always include:
   - Endpoints
   - HTTP methods
   - Auth requirements (if any)
   - Request schema (body/query/params)
   - Response schema (success + error)
   - Realistic examples of values whenever possible
5. Never guess endpoints, fields, or behavior. If something is unclear, inspect the source code until it is confirmed.

## What Counts As "Changes"
You must treat the following as documentation-impacting changes:
- New, removed, or renamed routes
- Changes in request/response payloads
- Changes in authentication/authorization rules
- New validations (Zod/TypeBox/Prisma constraints/etc.)
- New error cases or new error formats
- Changes in pagination, sorting, filtering behavior
- Prisma model changes (tables, fields, relations, enums)
- Changes in business rules that affect outputs

## Required Scan Targets
You must inspect at least:
- Route definitions (server/router/controllers)
- Request validation schemas (Zod, TypeBox, custom validators)
- Response types or serializers
- Auth middleware and permission rules
- `schema.prisma`
- Any seed/migration-related logic if it changes API behavior

## Output Rules (Documentation Format)
Update `ai/docs/server.md` using this structure, and keep it consistent across updates:

### 1. Overview
- Server purpose (short)
- Base URL (if defined)
- Auth mechanism summary (JWT/session/etc.)
- Error response standard (single canonical format)

### 2. Database (Prisma)
Document models and enums that matter to the API.
For each relevant model:
- Fields (name, type, optional/required)
- Important constraints (unique, indexes)
- Relations (and what they mean in API terms)

### 3. Modules
Each module must have its own section.

For each module:
- Summary of what it does
- Endpoints list
- For each endpoint:
  - Method + path
  - Description
  - Auth requirements
  - Params (path params)
  - Query (query params)
  - Body (request body schema)
  - Responses:
    - Success response schema + example
    - Error response schema + example
  - Notes (pagination, sorting, edge cases)

### 4. Shared Schemas
Create a shared schema section for:
- Pagination format
- Error format
- Common DTOs reused across endpoints

## Example Blocks (Mandatory)
Whenever possible, include examples like:

- Example request JSON
- Example response JSON
- Example query string
- Example path params

Examples must use realistic values:
- UUIDs should look real
- Dates should be ISO-8601
- Currency should match project conventions
- IDs must match the actual DB type (string, uuid, int)

## Prisma Change Detection Rules
When reading `schema.prisma`, you must:
- Detect new models and document them if relevant
- Detect removed models and remove outdated docs
- Detect field changes (type, optionality, defaults)
- Detect enum changes
- Detect relation changes and update endpoints affected by them

Do not document every model blindly: focus on what is exposed or impacts API behavior.

## Consistency and Quality Rules
- The documentation must be deterministic and clean.
- Do not leave outdated endpoints in the doc.
- Do not leave TODOs.
- Do not write speculative notes like "maybe" or "probably".
- Prefer explicit schemas over prose.
- If multiple endpoints share the same schema, define it once and reference it.

## Update Workflow
Follow this exact workflow:

1. Read the current `ai/docs/server.md`
2. Scan the codebase for changes relevant to `FOCUS_MODULE`
3. Scan `schema.prisma` for database changes
4. Update documentation sections impacted by changes
5. Ensure examples match the updated schemas
6. Remove obsolete content
7. Re-check for internal consistency:
   - endpoints referenced but not defined
   - schema fields mismatch
   - examples invalid vs schema
8. Save the final updated content into `ai/docs/server.md`

## Final Deliverable
In your final response, do NOT paste the documentation.

Instead, respond with a short report containing:
- What module was targeted (`FOCUS_MODULE`)
- Which sections were updated (high level)
- A bullet list of key changes detected (routes/schemas/db changes)
- Any warnings or uncertainties (if something was impossible to confirm)

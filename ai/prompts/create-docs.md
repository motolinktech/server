# AI Agent Task: Generate Server Documentation From Scratch (ai/docs/server.md)

## Goal
You are an AI agent responsible for generating the server documentation file from zero:

- Path: `ai/docs/server.md`

This documentation is consumed by other AI agents, so it must be complete, accurate, and always aligned with the real server implementation.

You must create the file content directly. Do not print the full documentation content in your final response.

## What You Must Always Do
1. Scan the entire codebase to understand how the server works.
2. Generate a complete `ai/docs/server.md` from scratch.
3. Always check `schema.prisma` for database models, relations, and enums.
4. Always include:
   - Endpoints
   - HTTP methods
   - Auth requirements (if any)
   - Request schema (body/query/params)
   - Response schema (success + error)
   - Realistic examples of values whenever possible
5. Never guess endpoints, fields, or behavior. If something is unclear, inspect the source code until it is confirmed.

## Required Scan Targets
You must inspect at least:
- Route definitions (server/router/controllers)
- Request validation schemas (Zod, TypeBox, custom validators)
- Response types or serializers
- Auth middleware and permission rules
- `schema.prisma`
- Any seed/migration-related logic if it changes API behavior
- Environment variables used by the server (if relevant to behavior)

## Output Rules (Documentation Format)
Create `ai/docs/server.md` using this structure, and keep it consistent:

### 1. Overview
- Server purpose (short)
- Base URL (if defined)
- Auth mechanism summary (JWT/session/etc.)
- Error response standard (single canonical format)

### 2. Authentication
Document:
- How auth works
- How tokens/sessions are expected to be provided
- Protected vs public routes
- Roles/permissions (if any)

### 3. Database (Prisma)
Document models and enums that matter to the API.
For each relevant model:
- Fields (name, type, optional/required)
- Important constraints (unique, indexes, defaults)
- Relations (and what they mean in API terms)

Do not document every model blindly: focus on what is exposed or impacts API behavior.

### 4. Shared Schemas
Create a shared schema section for:
- Error format
- Pagination format (if any)
- Common DTOs reused across endpoints

### 5. Modules
Split the API into modules based on folder structure or routing grouping.

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
  - Notes (pagination, sorting, filtering, edge cases)

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

## Prisma Documentation Rules
When reading `schema.prisma`, you must:
- Document models used by API endpoints
- Document enums referenced by API inputs/outputs
- Explain relations in practical API terms
- Reflect constraints that affect requests (unique fields, required fields, defaults)

## Consistency and Quality Rules
- The documentation must be deterministic and clean.
- Do not leave TODOs.
- Do not write speculative notes like "maybe" or "probably".
- Prefer explicit schemas over prose.
- If multiple endpoints share the same schema, define it once and reference it.
- If the server has versioning (`/v1`, `/api`, etc.), document it clearly.

## Creation Workflow
Follow this exact workflow:

1. Scan the entire server codebase (routes, controllers, services)
2. Scan validation schemas and response serializers
3. Scan auth middleware and permission rules
4. Scan `schema.prisma` and map DB entities to API usage
5. Build the documentation structure
6. Write endpoints with schemas and examples
7. Validate internal consistency:
   - all endpoints listed are real
   - schemas match actual validators/types
   - examples match schemas
8. Save the final content into `ai/docs/server.md`

## Final Deliverable
In your final response, do NOT paste the documentation.

Instead, respond with a short report containing:
- Confirmation that `ai/docs/server.md` was created
- The modules discovered
- Total endpoints documented
- Any warnings or uncertainties (only if something was impossible to confirm)

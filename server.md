# Motolink Server API Documentation

## Introduction

This document provides comprehensive API documentation for the **Motolink Server**, a backend service built with ElysiaJS for managing a delivery/logistics platform. The API handles user authentication, branch management, client management, deliveryman management, work shift scheduling, and payment request processing.

**Tech Stack:**
- Framework: ElysiaJS
- Runtime: Bun
- Database: PostgreSQL (via Prisma ORM)
- Authentication: JWT Bearer tokens
- Validation: TypeBox schemas

---

## Base URL

```
http://localhost:8888/api
```

**OpenAPI Documentation:** Available at `/docs`

---

## General Authentication

Most endpoints require authentication via JWT Bearer tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

**Token expiration:** 7 days

### Branch-Scoped Requests

Many endpoints require a `branch-id` header to scope operations to a specific branch:

```
branch-id: <branch_uuid>
```

**Branch Access Rules:**
- **ADMIN** users can access all branches
- **USER** role users can only access branches they are assigned to

---

## Error Response Format

All error responses follow this structure:

```json
{
  "status": 400,
  "message": "Mensagem de erro em Portugues"
}
```

**Note:** Error messages are returned in Portuguese.

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input or business rule violation |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - User lacks permission for this branch |
| 404 | Not Found - Resource does not exist |

---

## Pagination

List endpoints support pagination with the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Items per page |

**List Response Format:**
```json
{
  "data": [...],
  "count": 100
}
```

---

## Soft Delete Behavior

Entities that support soft delete use an `isDeleted` boolean field. By default, list endpoints exclude deleted records. Some endpoints allow filtering by `isDeleted` parameter.

---

# API Endpoints

---

## Auth Module

Authentication endpoints for user login and token generation.

### POST /api/auth/

Authenticate a user and receive a JWT token.

**Authentication Required:** No

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| email | string | Yes | Valid email format | User's email address |
| password | string | Yes | 8-128 chars, must include uppercase, lowercase, digit, and special character | User's password |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response (200):**
```json
{
  "user": {
    "id": "019012ab-1234-7000-8000-000000000001",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "USER",
    "status": "ACTIVE",
    "permissions": ["clients.read", "clients.write"],
    "branches": ["019012ab-1234-7000-8000-000000000010"],
    "birthDate": "1990-01-15T00:00:00.000Z",
    "documents": [],
    "isDeleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 401 | Credenciais invalidas | Invalid email or password |
| 400 | Email invalido. | Invalid email format |
| 400 | Senha invalida. A senha deve ter... | Password doesn't meet requirements |

---

## Users Module

User management endpoints for creating, listing, updating, and deleting users.

### POST /api/users

Create a new user.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID to assign the user |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 3-255 characters | User's full name |
| email | string | Yes | Valid email format | User's email (unique) |
| password | string | No | 8-128 chars with complexity | Initial password (if omitted, user gets PENDING status) |
| role | string | Yes | "ADMIN" or "USER" | User role |
| birthDate | Date | Yes | Valid date | User's birth date |
| permissions | string[] | No | - | List of permission codes |
| documents | object[] | No | - | User documents |

**Documents Object:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Document URL |
| type | string | Yes | Document type (e.g., "CNH", "RG") |
| uploadedAt | Date | Yes | Upload timestamp |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "role": "USER",
    "birthDate": "1992-05-20",
    "permissions": ["clients.read"]
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000002",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "USER",
  "status": "ACTIVE",
  "permissions": ["clients.read"],
  "branches": ["019012ab-1234-7000-8000-000000000010"],
  "birthDate": "1992-05-20T00:00:00.000Z",
  "documents": [],
  "isDeleted": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Note:** If password is not provided, user is created with `PENDING` status and a verification token is generated.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 401 | Nao autorizado | Missing or invalid token |
| 403 | Nao autorizado para esta filial | User lacks branch access |

---

### GET /api/users

List users with pagination and filtering.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| search | string | No | Search by name or email |

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/users?page=1&limit=10&search=john" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000001",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "status": "ACTIVE",
      "permissions": ["*"],
      "branches": ["019012ab-1234-7000-8000-000000000010"],
      "verificationTokens": []
    }
  ],
  "count": 1
}
```

---

### GET /api/users/:id

Get user details by ID.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | User ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/users/019012ab-1234-7000-8000-000000000001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000001",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "permissions": ["*"],
  "branches": ["019012ab-1234-7000-8000-000000000010"],
  "birthDate": "1990-01-15T00:00:00.000Z",
  "documents": [
    {
      "type": "CNH",
      "url": "https://storage.example.com/docs/cnh.pdf",
      "uploadedAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "isDeleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Usuario nao encontrado. | User not found |

---

### GET /api/users/me

Get the authenticated user's profile.

**Authentication Required:** Yes (Bearer token only)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000001",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "permissions": ["*"],
  "branches": ["019012ab-1234-7000-8000-000000000010"],
  "birthDate": "1990-01-15T00:00:00.000Z",
  "documents": [],
  "isDeleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### DELETE /api/users/:id

Soft delete a user (sets isDeleted to true).

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | User ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8888/api/users/019012ab-1234-7000-8000-000000000002 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):** Returns the deleted user object.

---

### POST /api/users/:id/change-password

Change user password using a verification token.

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | User ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| password | string | Yes | New password (8-128 chars with complexity) |
| passwordConfirmation | string | Yes | Must match password |
| token | string | Yes | Verification token |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/users/019012ab-1234-7000-8000-000000000002/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass123!",
    "passwordConfirmation": "NewSecurePass123!",
    "token": "abc123verification"
  }'
```

**Response (200):** Returns the updated user object.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 400 | As senhas nao coincidem. | Passwords don't match |
| 401 | Acesso nao autorizado. | Invalid or expired token |

---

## Branches Module

Branch management endpoints. Creating and updating branches requires ADMIN role.

### GET /api/branches

List all branches with pagination.

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| search | string | No | Search by name or address |

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/branches?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000010",
      "name": "Filial Sao Paulo",
      "address": "Av. Paulista, 1000 - Sao Paulo, SP",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### POST /api/branches

Create a new branch.

**Authentication Required:** Yes (Bearer token, ADMIN role only)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 3-255 characters | Branch name |
| address | string | No | 3-1024 characters | Branch address |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/branches \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filial Rio de Janeiro",
    "address": "Av. Rio Branco, 500 - Rio de Janeiro, RJ"
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000011",
  "name": "Filial Rio de Janeiro",
  "address": "Av. Rio Branco, 500 - Rio de Janeiro, RJ",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 401 | Acesso negado | User is not ADMIN |

---

### GET /api/branches/:id

Get branch details by ID.

**Authentication Required:** Yes (Bearer token, ADMIN role only)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Branch ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/branches/019012ab-1234-7000-8000-000000000010 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000010",
  "name": "Filial Sao Paulo",
  "address": "Av. Paulista, 1000 - Sao Paulo, SP",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Filial nao encontrada. | Branch not found |

---

### PUT /api/branches/:id

Update a branch.

**Authentication Required:** Yes (Bearer token, ADMIN role only)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Branch ID |

**Request Body:** Same as POST /api/branches

**Example Request:**
```bash
curl -X PUT http://localhost:8888/api/branches/019012ab-1234-7000-8000-000000000010 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filial Sao Paulo - Centro",
    "address": "Av. Paulista, 1000 - Centro, Sao Paulo, SP"
  }'
```

**Response (200):** Returns the updated branch object.

---

## Clients Module

Client management endpoints for managing business clients.

### POST /api/clients

Create a new client with optional commercial conditions.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| client | object | Yes | Client data |
| commercialCondition | object | No | Pricing and payment terms |

**Client Object:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 3-100 characters | Client name |
| cnpj | string | Yes | - | Brazilian company ID |
| cep | string | Yes | - | Postal code |
| street | string | Yes | - | Street address |
| number | string | Yes | - | Address number |
| complement | string | Yes | - | Address complement |
| city | string | Yes | - | City |
| neighborhood | string | Yes | - | Neighborhood |
| uf | string | Yes | - | State code (e.g., "SP") |
| contactName | string | Yes | - | Contact person name |
| branchId | string (UUID) | Yes | - | Branch ID |
| regionId | string (UUID) | No | - | Region ID |
| groupId | string (UUID) | No | - | Group ID |

**Commercial Condition Object (all fields optional):**
| Field | Type | Description |
|-------|------|-------------|
| paymentForm | string[] | Payment methods |
| dailyPeriods | string[] | Daily work shift periods |
| guaranteedPeriods | string[] | Guaranteed work shift periods |
| deliveryAreaKm | number | Delivery area in km |
| isMotolinkCovered | boolean | Motolink coverage flag |
| guaranteedDay | number | Guaranteed daily rate (day) |
| guaranteedDayWeekend | number | Guaranteed daily rate (weekend day) |
| guaranteedNight | number | Guaranteed daily rate (night) |
| guaranteedNightWeekend | number | Guaranteed daily rate (weekend night) |
| clientDailyDay | number | Client daily fee (day) |
| clientDailyDayWknd | number | Client daily fee (weekend day) |
| clientDailyNight | number | Client daily fee (night) |
| clientDailyNightWknd | number | Client daily fee (weekend night) |
| clientPerDelivery | number | Client per-delivery fee |
| clientAdditionalKm | number | Client additional km fee |
| deliverymanDailyDay | number | Deliveryman daily fee (day) |
| deliverymanDailyDayWknd | number | Deliveryman daily fee (weekend day) |
| deliverymanDailyNight | number | Deliveryman daily fee (night) |
| deliverymanDailyNightWknd | number | Deliveryman daily fee (weekend night) |
| deliverymanPerDelivery | number | Deliveryman per-delivery fee |
| deliverymanAdditionalKm | number | Deliveryman additional km fee |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/clients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "client": {
      "name": "Restaurante Bom Sabor",
      "cnpj": "12.345.678/0001-90",
      "cep": "01310-100",
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "Sala 101",
      "city": "Sao Paulo",
      "neighborhood": "Bela Vista",
      "uf": "SP",
      "contactName": "Maria Silva",
      "branchId": "019012ab-1234-7000-8000-000000000010",
      "regionId": "019012ab-1234-7000-8000-000000000020"
    },
    "commercialCondition": {
      "paymentForm": ["PIX", "Boleto"],
      "dailyPeriods": ["DAY", "NIGHT"],
      "guaranteedPeriods": ["DAY"],
      "deliveryAreaKm": 10,
      "isMotolinkCovered": true,
      "clientPerDelivery": 8.50,
      "deliverymanPerDelivery": 6.00
    }
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000030",
  "name": "Restaurante Bom Sabor",
  "cnpj": "12.345.678/0001-90",
  "cep": "01310-100",
  "street": "Av. Paulista",
  "number": "1000",
  "complement": "Sala 101",
  "city": "Sao Paulo",
  "neighborhood": "Bela Vista",
  "uf": "SP",
  "contactName": "Maria Silva",
  "branchId": "019012ab-1234-7000-8000-000000000010",
  "regionId": "019012ab-1234-7000-8000-000000000020",
  "groupId": null,
  "isDeleted": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /api/clients/simplified

List clients with basic information (lightweight response).

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| name | string | No | Filter by name |
| cnpj | string | No | Filter by CNPJ |
| city | string | No | Filter by city |
| uf | string | No | Filter by state |
| branchId | string | No | Filter by branch |
| regionId | string | No | Filter by region |
| groupId | string | No | Filter by group |
| isDeleted | boolean | No | Include deleted (default: false) |

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/clients/simplified?page=1&limit=10&city=Sao%20Paulo" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000030",
      "name": "Restaurante Bom Sabor",
      "cnpj": "12.345.678/0001-90",
      "cep": "01310-100",
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "Sala 101",
      "city": "Sao Paulo",
      "neighborhood": "Bela Vista",
      "uf": "SP",
      "contactName": "Maria Silva",
      "isDeleted": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "branch": {
        "id": "019012ab-1234-7000-8000-000000000010",
        "name": "Filial Sao Paulo"
      },
      "region": {
        "id": "019012ab-1234-7000-8000-000000000020",
        "name": "Centro"
      },
      "group": null
    }
  ],
  "count": 1
}
```

---

### GET /api/clients/complete

List clients with full information including commercial conditions.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:** Same as GET /api/clients/simplified

**Query Parameters:** Same as GET /api/clients/simplified

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/clients/complete?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000030",
      "name": "Restaurante Bom Sabor",
      "cnpj": "12.345.678/0001-90",
      "cep": "01310-100",
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "Sala 101",
      "city": "Sao Paulo",
      "neighborhood": "Bela Vista",
      "uf": "SP",
      "contactName": "Maria Silva",
      "branchId": "019012ab-1234-7000-8000-000000000010",
      "regionId": "019012ab-1234-7000-8000-000000000020",
      "groupId": null,
      "isDeleted": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "branch": {
        "id": "019012ab-1234-7000-8000-000000000010",
        "name": "Filial Sao Paulo"
      },
      "region": {
        "id": "019012ab-1234-7000-8000-000000000020",
        "name": "Centro"
      },
      "group": null,
      "commercialCondition": {
        "id": "019012ab-1234-7000-8000-000000000031",
        "clientId": "019012ab-1234-7000-8000-000000000030",
        "paymentForm": ["PIX", "Boleto"],
        "dailyPeriods": ["DAY", "NIGHT"],
        "guaranteedPeriods": ["DAY"],
        "deliveryAreaKm": 10,
        "isMotolinkCovered": true,
        "clientPerDelivery": "8.50",
        "deliverymanPerDelivery": "6.00"
      }
    }
  ],
  "count": 1
}
```

---

### GET /api/clients/:clientId

Get client details by ID.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string (UUID) | Yes | Client ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/clients/019012ab-1234-7000-8000-000000000030 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns client with all relations (branch, region, group, commercialCondition).

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Cliente nao encontrado. | Client not found |

---

### PUT /api/clients/:clientId

Update a client.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string (UUID) | Yes | Client ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| client | object | No | Partial client data to update |
| commercialCondition | object | No | Partial commercial conditions to update |

**Example Request:**
```bash
curl -X PUT http://localhost:8888/api/clients/019012ab-1234-7000-8000-000000000030 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "client": {
      "contactName": "Joao Santos"
    },
    "commercialCondition": {
      "paymentTermDays": 45
    }
  }'
```

**Response (200):** Returns updated client with commercialCondition.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Cliente nao encontrado. | Client not found |
| 400 | Cliente foi deletado. | Client was deleted |

---

### DELETE /api/clients/:clientId

Soft delete a client.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string (UUID) | Yes | Client ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8888/api/clients/019012ab-1234-7000-8000-000000000030 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns the deleted client object.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Cliente nao encontrado. | Client not found |
| 400 | Cliente ja foi deletado. | Client already deleted |

---

## Client Blocks Sub-module

Manage deliveryman blocks for specific clients.

### POST /api/clients/:clientId/blocks

Create a block preventing a deliveryman from serving a client.

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string (UUID) | Yes | Client ID |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| deliverymanId | string (UUID) | Yes | - | Deliveryman to block |
| reason | string | Yes | Min 3 characters | Reason for the block |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/clients/019012ab-1234-7000-8000-000000000030/blocks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "deliverymanId": "019012ab-1234-7000-8000-000000000040",
    "reason": "Reclamacao do cliente sobre comportamento"
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000050",
  "clientId": "019012ab-1234-7000-8000-000000000030",
  "deliverymanId": "019012ab-1234-7000-8000-000000000040",
  "reason": "Reclamacao do cliente sobre comportamento",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "deliveryman": {
    "id": "019012ab-1234-7000-8000-000000000040",
    "name": "Carlos Ferreira",
    "document": "123.456.789-00",
    "phone": "(11) 99999-9999"
  }
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Cliente nao encontrado. | Client not found |
| 400 | Cliente foi deletado. | Client was deleted |
| 404 | Entregador nao encontrado. | Deliveryman not found |
| 400 | Entregador foi deletado. | Deliveryman was deleted |
| 400 | Este entregador ja esta bloqueado para este cliente. | Block already exists |

---

### GET /api/clients/:clientId/blocks

List all blocks for a client.

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string (UUID) | Yes | Client ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/clients/019012ab-1234-7000-8000-000000000030/blocks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
[
  {
    "id": "019012ab-1234-7000-8000-000000000050",
    "clientId": "019012ab-1234-7000-8000-000000000030",
    "deliverymanId": "019012ab-1234-7000-8000-000000000040",
    "reason": "Reclamacao do cliente sobre comportamento",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "deliveryman": {
      "id": "019012ab-1234-7000-8000-000000000040",
      "name": "Carlos Ferreira",
      "document": "123.456.789-00",
      "phone": "(11) 99999-9999"
    }
  }
]
```

---

### DELETE /api/clients/:clientId/blocks/:blockId

Remove a deliveryman block.

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string (UUID) | Yes | Client ID |
| blockId | string (UUID) | Yes | Block ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8888/api/clients/019012ab-1234-7000-8000-000000000030/blocks/019012ab-1234-7000-8000-000000000050 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):** Returns the deleted block object.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Bloqueio nao encontrado. | Block not found |
| 403 | Este bloqueio nao pertence ao cliente especificado. | Block belongs to different client |

---

## Deliverymen Module

Manage delivery personnel (couriers/motoboys).

### POST /api/deliverymen

Create a new deliveryman.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 3-100 characters | Full name |
| document | string | Yes | - | CPF document number |
| phone | string | Yes | - | Phone number |
| contractType | string | Yes | - | Contract type (e.g., "CLT", "PJ", "FREELANCER") |
| mainPixKey | string | Yes | - | Primary PIX key for payments |
| files | string[] | No | - | Array of uploaded file URLs |
| secondPixKey | string | No | - | Secondary PIX key |
| thridPixKey | string | No | - | Third PIX key |
| agency | string | No | - | Bank agency |
| account | string | No | - | Bank account |
| vehicleModel | string | No | - | Vehicle model |
| vehiclePlate | string | No | - | Vehicle plate |
| vehicleColor | string | No | - | Vehicle color |
| regionId | string (UUID) | No | - | Assigned region |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/deliverymen \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carlos Ferreira",
    "document": "123.456.789-00",
    "phone": "(11) 99999-9999",
    "contractType": "PJ",
    "mainPixKey": "carlos@email.com",
    "vehicleModel": "Honda CG 160",
    "vehiclePlate": "ABC-1234",
    "vehicleColor": "Vermelho",
    "files": ["https://cdn.example.com/files/id1.jpg"],
    "regionId": "019012ab-1234-7000-8000-000000000020"
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000040",
  "name": "Carlos Ferreira",
  "document": "123.456.789-00",
  "phone": "(11) 99999-9999",
  "contractType": "PJ",
  "mainPixKey": "carlos@email.com",
  "secondPixKey": null,
  "thridPixKey": null,
  "agency": null,
  "account": null,
  "vehicleModel": "Honda CG 160",
  "vehiclePlate": "ABC-1234",
  "vehicleColor": "Vermelho",
  "files": [],
  "branchId": "019012ab-1234-7000-8000-000000000010",
  "regionId": "019012ab-1234-7000-8000-000000000020",
  "isBlocked": false,
  "isDeleted": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /api/deliverymen

List deliverymen with filtering.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| name | string | No | Filter by name |
| document | string | No | Filter by document |
| phone | string | No | Filter by phone |
| contractType | string | No | Filter by contract type |
| regionId | string | No | Filter by region |
| isBlocked | boolean | No | Filter by blocked status |
| isDeleted | boolean | No | Include deleted (default: false) |

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/deliverymen?page=1&limit=10&isBlocked=false" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000040",
      "name": "Carlos Ferreira",
      "document": "123.456.789-00",
      "phone": "(11) 99999-9999",
      "contractType": "PJ",
      "mainPixKey": "carlos@email.com",
      "secondPixKey": null,
      "thridPixKey": null,
      "agency": null,
      "account": null,
      "vehicleModel": "Honda CG 160",
      "vehiclePlate": "ABC-1234",
      "vehicleColor": "Vermelho",
      "files": [],
      "branchId": "019012ab-1234-7000-8000-000000000010",
      "regionId": "019012ab-1234-7000-8000-000000000020",
      "isBlocked": false,
      "isDeleted": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "branch": {
        "id": "019012ab-1234-7000-8000-000000000010",
        "name": "Filial Sao Paulo"
      },
      "region": {
        "id": "019012ab-1234-7000-8000-000000000020",
        "name": "Centro"
      }
    }
  ],
  "count": 1
}
```

---

### GET /api/deliverymen/:id

Get deliveryman details by ID.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Deliveryman ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/deliverymen/019012ab-1234-7000-8000-000000000040 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns deliveryman with branch, region relations and `files` array.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Entregador nao encontrado. | Deliveryman not found |

---

### PUT /api/deliverymen/:id

Update a deliveryman.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Deliveryman ID |

**Request Body:** Same fields as POST (all optional)

**Example Request:**
```bash
curl -X PUT http://localhost:8888/api/deliverymen/019012ab-1234-7000-8000-000000000040 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "(11) 98888-8888",
    "vehicleModel": "Honda CG 160 Titan"
  }'
```

**Response (200):** Returns updated deliveryman.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Entregador nao encontrado. | Deliveryman not found |
| 400 | Entregador foi deletado. | Deliveryman was deleted |

---

### PATCH /api/deliverymen/:id/toggle-block

Toggle the blocked status of a deliveryman.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Deliveryman ID |

**Example Request:**
```bash
curl -X PATCH http://localhost:8888/api/deliverymen/019012ab-1234-7000-8000-000000000040/toggle-block \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns deliveryman with updated `isBlocked` status.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Entregador nao encontrado. | Deliveryman not found |
| 400 | Entregador foi deletado. | Deliveryman was deleted |

---

### DELETE /api/deliverymen/:id

Soft delete a deliveryman.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Deliveryman ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8888/api/deliverymen/019012ab-1234-7000-8000-000000000040 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns the deleted deliveryman object.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Entregador nao encontrado. | Deliveryman not found |
| 400 | Entregador ja foi deletado. | Deliveryman already deleted |

---

## Groups Module

Manage client groups/categories.

### POST /api/groups

Create a new group.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 3-100 characters | Group name |
| description | string | No | Max 255 characters | Group description |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/groups \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurantes Premium",
    "description": "Clientes de alto volume com prioridade"
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000060",
  "name": "Restaurantes Premium",
  "description": "Clientes de alto volume com prioridade",
  "branchId": "019012ab-1234-7000-8000-000000000010",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /api/groups

List groups with filtering.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| name | string | No | Filter by name |

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/groups?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000060",
      "name": "Restaurantes Premium",
      "description": "Clientes de alto volume com prioridade",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /api/groups/:id

Get group details by ID.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/groups/019012ab-1234-7000-8000-000000000060 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000060",
  "name": "Restaurantes Premium",
  "description": "Clientes de alto volume com prioridade",
  "branchId": "019012ab-1234-7000-8000-000000000010",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Grupo nao encontrado. | Group not found |

---

### PUT /api/groups/:id

Update a group.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Request Body:** Same as POST (all fields optional)

**Example Request:**
```bash
curl -X PUT http://localhost:8888/api/groups/019012ab-1234-7000-8000-000000000060 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Clientes VIP com atendimento prioritario"
  }'
```

**Response (200):** Returns updated group.

---

### DELETE /api/groups/:id

**Hard delete** a group (permanently removes from database).

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Group ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8888/api/groups/019012ab-1234-7000-8000-000000000060 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns deleted group object.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Grupo nao encontrado. | Group not found |

---

## Regions Module

Manage geographic regions within branches.

### POST /api/regions

Create a new region.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 3-100 characters | Region name |
| description | string | No | Max 255 characters | Region description |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/regions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Centro",
    "description": "Regiao central de Sao Paulo"
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000020",
  "name": "Centro",
  "description": "Regiao central de Sao Paulo",
  "branchId": "019012ab-1234-7000-8000-000000000010",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /api/regions

List regions with filtering.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| name | string | No | Filter by name |

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/regions?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000020",
      "name": "Centro",
      "description": "Regiao central de Sao Paulo",
      "branchId": "019012ab-1234-7000-8000-000000000010",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /api/regions/:id

Get region details by ID.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Region ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/regions/019012ab-1234-7000-8000-000000000020 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000020",
  "name": "Centro",
  "description": "Regiao central de Sao Paulo",
  "branchId": "019012ab-1234-7000-8000-000000000010",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Regiao nao encontrada. | Region not found |

---

### PUT /api/regions/:id

Update a region.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Region ID |

**Request Body:** Same as POST (all fields optional)

**Example Request:**
```bash
curl -X PUT http://localhost:8888/api/regions/019012ab-1234-7000-8000-000000000020 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Centro Historico"
  }'
```

**Response (200):** Returns updated region.

---

### DELETE /api/regions/:id

**Hard delete** a region (permanently removes from database).

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Region ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8888/api/regions/019012ab-1234-7000-8000-000000000020 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns deleted region object.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Regiao nao encontrada. | Region not found |

---

## Work Shift Slots Module

Manage delivery work shift scheduling.

### POST /api/work-shift-slots

Create a new work shift slot.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | string (UUID) | Yes | Client for the shift |
| deliverymanId | string (UUID) | No | Assigned deliveryman (can be null) |
| status | string | Yes | Shift status |
| contractType | string | Yes | Contract type for this shift |
| shiftDate | string (ISO date) | Yes | Date of the shift |
| startTime | string (ISO datetime) | Yes | Shift start time |
| endTime | string (ISO datetime) | Yes | Shift end time |
| auditStatus | string | Yes | Audit status |
| logs | array | No | Activity logs |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/work-shift-slots \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "019012ab-1234-7000-8000-000000000030",
    "deliverymanId": "019012ab-1234-7000-8000-000000000040",
    "status": "SCHEDULED",
    "contractType": "DAILY",
    "shiftDate": "2024-01-20",
    "startTime": "2024-01-20T08:00:00.000Z",
    "endTime": "2024-01-20T18:00:00.000Z",
    "auditStatus": "PENDING"
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000070",
  "clientId": "019012ab-1234-7000-8000-000000000030",
  "deliverymanId": "019012ab-1234-7000-8000-000000000040",
  "status": "SCHEDULED",
  "contractType": "DAILY",
  "shiftDate": "2024-01-20T00:00:00.000Z",
  "startTime": "2024-01-20T08:00:00.000Z",
  "endTime": "2024-01-20T18:00:00.000Z",
  "auditStatus": "PENDING",
  "logs": [],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

### GET /api/work-shift-slots

List work shift slots with filtering.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| clientId | string | No | Filter by client |
| deliverymanId | string | No | Filter by deliveryman |
| status | string | No | Filter by status |
| month | number | No | Filter by month (1-12) |
| week | number | No | Filter by ISO week number |

**Note:** If neither month nor week is specified, defaults to current week.

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/work-shift-slots?page=1&limit=10&status=SCHEDULED" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000070",
      "clientId": "019012ab-1234-7000-8000-000000000030",
      "deliverymanId": "019012ab-1234-7000-8000-000000000040",
      "status": "SCHEDULED",
      "contractType": "DAILY",
      "shiftDate": "2024-01-20T00:00:00.000Z",
      "startTime": "2024-01-20T08:00:00.000Z",
      "endTime": "2024-01-20T18:00:00.000Z",
      "auditStatus": "PENDING",
      "logs": [],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "deliveryman": {
        "id": "019012ab-1234-7000-8000-000000000040",
        "name": "Carlos Ferreira"
      },
      "client": {
        "id": "019012ab-1234-7000-8000-000000000030",
        "name": "Restaurante Bom Sabor"
      }
    }
  ],
  "count": 1
}
```

---

### GET /api/work-shift-slots/:id

Get work shift slot details by ID.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Work shift slot ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/work-shift-slots/019012ab-1234-7000-8000-000000000070 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns work shift slot with full deliveryman and client details.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Turno nao encontrado. | Work shift slot not found |

---

### GET /api/work-shift-slots/group/:groupId

Get work shift slots grouped by client name for a specific group.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string (UUID) | Yes | Group ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/work-shift-slots/group/019012ab-1234-7000-8000-000000000060 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "Restaurante Bom Sabor": [
    {
      "id": "019012ab-1234-7000-8000-000000000070",
      "clientId": "019012ab-1234-7000-8000-000000000030",
      "deliverymanId": "019012ab-1234-7000-8000-000000000040",
      "status": "SCHEDULED",
      "contractType": "DAILY",
      "shiftDate": "2024-01-20T00:00:00.000Z",
      "startTime": "2024-01-20T08:00:00.000Z",
      "endTime": "2024-01-20T18:00:00.000Z",
      "auditStatus": "PENDING",
      "logs": [],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "deliveryman": {
        "id": "019012ab-1234-7000-8000-000000000040",
        "name": "Carlos Ferreira"
      }
    }
  ],
  "Pizzaria Napoli": []
}
```

---

### PUT /api/work-shift-slots/:id

Update a work shift slot.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Work shift slot ID |

**Request Body:** Same as POST (all fields optional)

**Example Request:**
```bash
curl -X PUT http://localhost:8888/api/work-shift-slots/019012ab-1234-7000-8000-000000000070 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "auditStatus": "APPROVED"
  }'
```

**Response (200):** Returns updated work shift slot.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Turno nao encontrado. | Work shift slot not found |

---

## Payment Requests Module

Manage payment requests for deliverymen.

### Status Values

| Status | Description |
|--------|-------------|
| NEW | Newly created request |
| ANALYZING | Under review |
| REQUESTED | Payment requested |
| PAID | Payment completed |

### POST /api/payment-requests

Create a new payment request.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**Request Body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| workShiftSlotId | string (UUID) | Yes | - | Related work shift slot |
| deliverymanId | string (UUID) | Yes | - | Deliveryman to pay |
| amount | number | Yes | >= 0 | Payment amount |
| status | string | No | NEW, ANALYZING, REQUESTED, PAID | Default: NEW |
| logs | array | No | - | Activity logs |

**Example Request:**
```bash
curl -X POST http://localhost:8888/api/payment-requests \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "workShiftSlotId": "019012ab-1234-7000-8000-000000000070",
    "deliverymanId": "019012ab-1234-7000-8000-000000000040",
    "amount": 150.00
  }'
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000080",
  "workShiftSlotId": "019012ab-1234-7000-8000-000000000070",
  "deliverymanId": "019012ab-1234-7000-8000-000000000040",
  "amount": "150.00",
  "status": "NEW",
  "logs": [],
  "createdAt": "2024-01-20T10:00:00.000Z",
  "updatedAt": "2024-01-20T10:00:00.000Z"
}
```

---

### GET /api/payment-requests

List payment requests with filtering.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20, max: 100) |
| workShiftSlotId | string | No | Filter by work shift slot |
| deliverymanId | string | No | Filter by deliveryman |
| status | string | No | Filter by status (NEW, ANALYZING, REQUESTED, PAID) |
| startDate | string | No | Filter start date (ISO format) |
| endDate | string | No | Filter end date (ISO format) |

**Note:** Default date range is current date to 7 days in the future.

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/payment-requests?page=1&limit=10&status=NEW" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000080",
      "workShiftSlotId": "019012ab-1234-7000-8000-000000000070",
      "deliverymanId": "019012ab-1234-7000-8000-000000000040",
      "amount": "150.00",
      "status": "NEW",
      "logs": [],
      "createdAt": "2024-01-20T10:00:00.000Z",
      "updatedAt": "2024-01-20T10:00:00.000Z",
      "deliveryman": {
        "id": "019012ab-1234-7000-8000-000000000040",
        "name": "Carlos Ferreira"
      },
      "workShiftSlot": {
        "id": "019012ab-1234-7000-8000-000000000070",
        "shiftDate": "2024-01-20T00:00:00.000Z",
        "client": {
          "id": "019012ab-1234-7000-8000-000000000030",
          "name": "Restaurante Bom Sabor"
        }
      }
    }
  ],
  "count": 1
}
```

---

### GET /api/payment-requests/:id

Get payment request details by ID.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Payment request ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/payment-requests/019012ab-1234-7000-8000-000000000080 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):** Returns payment request with full deliveryman and workShiftSlot (including client) details.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Solicitacao de pagamento nao encontrada. | Payment request not found |

---

### PUT /api/payment-requests/:id

Update a payment request.

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |
| Content-Type | Yes | `application/json` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Payment request ID |

**Request Body:** Same as POST (all fields optional)

**Example Request:**
```bash
curl -X PUT http://localhost:8888/api/payment-requests/019012ab-1234-7000-8000-000000000080 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ANALYZING"
  }'
```

**Response (200):** Returns updated payment request.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Solicitacao de pagamento nao encontrada. | Payment request not found |

---

### DELETE /api/payment-requests/:id

Delete a payment request (only allowed for NEW status).

**Authentication Required:** Yes (Bearer token + branch-id header)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |
| branch-id | Yes | Branch UUID |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Payment request ID |

**Example Request:**
```bash
curl -X DELETE http://localhost:8888/api/payment-requests/019012ab-1234-7000-8000-000000000080 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "branch-id: 019012ab-1234-7000-8000-000000000010"
```

**Response (200):**
```json
{
  "message": "Solicitacao de pagamento deletada com sucesso."
}
```

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Solicitacao de pagamento nao encontrada. | Payment request not found |
| 400 | Apenas solicitacoes com status NEW podem ser deletadas. | Cannot delete non-NEW requests |

---

## History Traces Module

Audit log system for tracking entity changes.

### Action Types

| Action | Description |
|--------|-------------|
| CREATE | New entity created |
| EDIT | Entity modified |
| DELETE | Entity deleted |

### GET /api/history-traces

List history traces with filtering.

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**Query Parameters:**
| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| page | number | No | >= 1 | Page number (default: 1) |
| limit | number | No | 1-100 | Items per page (default: 20) |
| userId | string | No | - | Filter by user who made the change |
| action | string | No | CREATE, EDIT, DELETE | Filter by action type |
| entityType | string | No | - | Filter by entity type |
| entityId | string | No | - | Filter by entity ID |

**Example Request:**
```bash
curl -X GET "http://localhost:8888/api/history-traces?page=1&limit=10&action=CREATE" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "019012ab-1234-7000-8000-000000000090",
      "userId": "019012ab-1234-7000-8000-000000000001",
      "action": "CREATE",
      "entityType": "Client",
      "entityId": "019012ab-1234-7000-8000-000000000030",
      "changes": {
        "name": "Restaurante Bom Sabor",
        "cnpj": "12.345.678/0001-90",
        "city": "Sao Paulo"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "user": {
        "id": "019012ab-1234-7000-8000-000000000001",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "ADMIN",
        "permissions": ["*"],
        "branches": ["019012ab-1234-7000-8000-000000000010"],
        "status": "ACTIVE"
      }
    }
  ],
  "count": 1
}
```

---

### GET /api/history-traces/:id

Get history trace details by ID.

**Authentication Required:** Yes (Bearer token)

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | `Bearer <token>` |

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | History trace ID |

**Example Request:**
```bash
curl -X GET http://localhost:8888/api/history-traces/019012ab-1234-7000-8000-000000000090 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Response (200):**
```json
{
  "id": "019012ab-1234-7000-8000-000000000090",
  "userId": "019012ab-1234-7000-8000-000000000001",
  "action": "EDIT",
  "entityType": "Client",
  "entityId": "019012ab-1234-7000-8000-000000000030",
  "changes": {
    "contactName": {
      "old": "Maria Silva",
      "new": "Joao Santos"
    }
  },
  "createdAt": "2024-01-16T10:00:00.000Z",
  "user": {
    "id": "019012ab-1234-7000-8000-000000000001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",
    "permissions": ["*"],
    "branches": ["019012ab-1234-7000-8000-000000000010"],
    "status": "ACTIVE"
  }
}
```

**Note:** For EDIT actions, changes contain old and new values. For CREATE actions, changes contain all initial values.

**Error Responses:**
| Status | Message | Description |
|--------|---------|-------------|
| 404 | Historico nao encontrado. | History trace not found |

---

## Enums Reference

### User Roles
| Value | Description |
|-------|-------------|
| ADMIN | Full system access, can access all branches |
| USER | Limited access based on assigned branches |

### User Status
| Value | Description |
|-------|-------------|
| ACTIVE | Fully functional user |
| INACTIVE | Disabled user |
| PENDING | New user awaiting password setup |

### Payment Request Status
| Value | Description |
|-------|-------------|
| NEW | Newly created request |
| ANALYZING | Under review |
| REQUESTED | Payment requested |
| PAID | Payment completed |

### History Trace Actions
| Value | Description |
|-------|-------------|
| CREATE | Entity created |
| EDIT | Entity modified |
| DELETE | Entity deleted |

---

## Development Notes

### Fake Users (Development Mode)

In development mode (`NODE_ENV=development`), you can use fake authentication tokens:

| Token | User Type |
|-------|-----------|
| ADMIN | Admin user with full permissions |

Use the token directly in the Authorization header:
```
Authorization: Bearer ADMIN
```

### OpenAPI Documentation

Interactive API documentation is available at:
```
http://localhost:8888/docs
```

This provides a Swagger-style interface for exploring and testing the API.

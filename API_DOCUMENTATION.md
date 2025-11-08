# Data Whisperer API Documentation

## Overview

The Data Whisperer backend provides RESTful APIs for dynamic table management, data operations, and table context management.

**Base URL:** `http://localhost:3001/api`

---

## Table Operations

### 1. Create Table

Create a new dynamic table in the database.

**Endpoint:** `POST /api/tables/create`

**Request Body:**
```json
{
  "tableName": "travelers",
  "columns": [
    {
      "name": "name",
      "type": "TEXT",
      "nullable": true
    },
    {
      "name": "age",
      "type": "INTEGER",
      "nullable": false
    },
    {
      "name": "email",
      "type": "VARCHAR(255)",
      "nullable": true
    }
  ]
}
```

**Supported Column Types:**
- `TEXT` - Variable-length text
- `INTEGER` - Whole numbers
- `REAL` - Floating point numbers
- `BOOLEAN` - True/false values
- `TIMESTAMP` - Date and time
- `VARCHAR(255)` - Limited-length text
- `JSONB` - JSON data

**Response:**
```json
{
  "success": true,
  "message": "Table 'travelers' created successfully",
  "tableName": "travelers"
}
```

**Notes:**
- Table names must start with a letter or underscore
- Auto-creates `id` (primary key), `created_at`, and `updated_at` columns
- Creates trigger for automatic `updated_at` updates

---

### 2. List Tables

Get all user-created tables.

**Endpoint:** `GET /api/tables/list`

**Response:**
```json
{
  "success": true,
  "tables": ["travelers", "products", "customers"]
}
```

---

### 3. Get Table Schema

Get the schema/structure of a specific table.

**Endpoint:** `GET /api/tables/:tableName/schema`

**Response:**
```json
{
  "success": true,
  "tableName": "travelers",
  "columns": [
    {
      "column_name": "id",
      "data_type": "integer",
      "is_nullable": "NO"
    },
    {
      "column_name": "name",
      "data_type": "text",
      "is_nullable": "YES"
    }
  ]
}
```

---

### 4. Delete Table

Delete a table and its associated context.

**Endpoint:** `DELETE /api/tables/:tableName`

**Response:**
```json
{
  "success": true,
  "message": "Table 'travelers' deleted successfully"
}
```

---

## Data Operations

### 1. Add Single Row

Add a single row of data to a table.

**Endpoint:** `POST /api/data/add`

**Request Body:**
```json
{
  "tableName": "travelers",
  "data": {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data added successfully",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. Bulk Add Rows

Add multiple rows of data at once.

**Endpoint:** `POST /api/data/bulk-add`

**Request Body:**
```json
{
  "tableName": "travelers",
  "data": [
    {
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com"
    },
    {
      "name": "Jane Smith",
      "age": 25,
      "email": "jane@example.com"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 rows added successfully",
  "data": [...]
}
```

---

### 3. Get Data

Retrieve data from a table with pagination.

**Endpoint:** `GET /api/data/:tableName?limit=100&offset=0`

**Query Parameters:**
- `limit` (optional, default: 100) - Number of rows to return
- `offset` (optional, default: 0) - Number of rows to skip

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 30,
      "email": "john@example.com",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 1
  }
}
```

---

### 4. Update Row

Update a specific row by ID.

**Endpoint:** `PUT /api/data/:tableName/:id`

**Request Body:**
```json
{
  "name": "John Updated",
  "age": 31
}
```

**Response:**
```json
{
  "success": true,
  "message": "Data updated successfully",
  "data": [...]
}
```

---

### 5. Delete Row

Delete a specific row by ID.

**Endpoint:** `DELETE /api/data/:tableName/:id`

**Response:**
```json
{
  "success": true,
  "message": "Data deleted successfully"
}
```

---

## Context Operations

### 1. Save Context

Create or update context/description for a table.

**Endpoint:** `POST /api/context`

**Request Body:**
```json
{
  "tableName": "travelers",
  "description": "This table stores information about travelers including their name, age, and contact details. Use this for customer management and trip planning."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Context saved successfully",
  "context": {
    "id": "clx123abc",
    "tableName": "travelers",
    "description": "This table stores information about travelers..."
  }
}
```

---

### 2. Get Context

Get context for a specific table.

**Endpoint:** `GET /api/context/:tableName`

**Response:**
```json
{
  "success": true,
  "context": {
    "id": "clx123abc",
    "tableName": "travelers",
    "description": "This table stores information about travelers..."
  }
}
```

---

### 3. Get All Contexts

Get contexts for all tables.

**Endpoint:** `GET /api/context`

**Response:**
```json
{
  "success": true,
  "contexts": [
    {
      "id": "clx123abc",
      "tableName": "travelers",
      "description": "..."
    },
    {
      "id": "clx456def",
      "tableName": "products",
      "description": "..."
    }
  ]
}
```

---

### 4. Delete Context

Delete context for a table.

**Endpoint:** `DELETE /api/context/:tableName`

**Response:**
```json
{
  "success": true,
  "message": "Context deleted successfully"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional validation details
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## Security Notes

⚠️ **IMPORTANT:**
- All table and column names are validated with regex: `^[a-zA-Z_][a-zA-Z0-9_]*$`
- SQL injection protection via parameterized queries
- Input validation using Zod schemas
- CORS enabled for frontend communication

---

## Running the Server

```bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev

# Start the server
npm run server

# Or run both frontend and backend
npm run dev:all
```

The server will run on `http://localhost:3001`

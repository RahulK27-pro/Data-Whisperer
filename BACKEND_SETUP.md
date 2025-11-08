# Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Setup Database

Make sure your `.env` file has the correct `DATABASE_URL`:

```env
DATABASE_URL="postgresql://..."
```

### 3. Run Prisma Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

This will create the `TableContext` table in your database.

### 4. Start the Backend Server

```bash
npm run server
```

The server will start on `http://localhost:3001`

### 5. Start the Frontend (in another terminal)

```bash
npm run dev
```

The frontend will start on `http://localhost:8080`

### 6. Run Both Together

```bash
npm run dev:all
```

This runs both frontend and backend concurrently.

---

## Project Structure

```
Data-Whisperer/
├── server/
│   ├── index.ts              # Express server entry point
│   └── routes/
│       ├── tables.ts         # Table CRUD operations
│       ├── data.ts           # Data CRUD operations
│       └── context.ts        # Context management
├── src/
│   └── lib/
│       └── api.ts            # Frontend API client
├── prisma/
│   └── schema.prisma         # Database schema
└── API_DOCUMENTATION.md      # Complete API docs
```

---

## API Endpoints

### Tables
- `POST /api/tables/create` - Create dynamic table
- `GET /api/tables/list` - List all tables
- `GET /api/tables/:name/schema` - Get table schema
- `DELETE /api/tables/:name` - Delete table

### Data
- `POST /api/data/add` - Add single row
- `POST /api/data/bulk-add` - Add multiple rows
- `GET /api/data/:tableName` - Get data (with pagination)
- `PUT /api/data/:tableName/:id` - Update row
- `DELETE /api/data/:tableName/:id` - Delete row

### Context
- `POST /api/context` - Save table context
- `GET /api/context/:tableName` - Get context
- `GET /api/context` - Get all contexts
- `DELETE /api/context/:tableName` - Delete context

---

## Usage Example

### 1. Create a Table

```typescript
import { api } from '@/lib/api';

await api.createTable('travelers', [
  { name: 'name', type: 'TEXT', nullable: false },
  { name: 'age', type: 'INTEGER', nullable: true },
  { name: 'email', type: 'VARCHAR(255)', nullable: false },
]);
```

### 2. Add Data

```typescript
await api.addData('travelers', {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
});
```

### 3. Save Context

```typescript
await api.saveContext('travelers', 
  'This table stores traveler information for booking management.'
);
```

### 4. Query Data

```typescript
const response = await api.getData('travelers', 100, 0);
console.log(response.data); // Array of rows
```

---

## Security Features

✅ **Input Validation** - All inputs validated with Zod schemas
✅ **SQL Injection Protection** - Parameterized queries
✅ **Table Name Validation** - Regex validation for safe names
✅ **CORS Enabled** - Configured for frontend communication
✅ **Error Handling** - Comprehensive error responses

---

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, change it in `.env`:

```env
PORT=3002
VITE_API_URL=http://localhost:3002/api
```

### Database Connection Issues

1. Check your `DATABASE_URL` in `.env`
2. Ensure your PostgreSQL database is running
3. Run `npx prisma migrate dev` to sync schema

### TypeScript Errors

The lint errors about missing Express types will resolve after `npm install` completes.

---

## Next Steps

1. ✅ Backend API is ready
2. 🔄 Update frontend components to use the API
3. 🔄 Add chat functionality with AI
4. 🔄 Implement vector embeddings for context

See `API_DOCUMENTATION.md` for complete API reference.

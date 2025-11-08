# Quick Reference Card

## 🚀 Start Commands

```bash
# Backend only
npm run server

# Frontend only  
npm run dev

# Both together
npm run dev:all
```

## 📍 URLs

- **Frontend:** http://localhost:8080
- **Backend:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## 🔑 API Client Usage

```typescript
import { api } from '@/lib/api';

// Tables
await api.createTable(name, columns);
await api.listTables();
await api.getTableSchema(name);
await api.deleteTable(name);

// Data
await api.addData(tableName, data);
await api.bulkAddData(tableName, dataArray);
await api.getData(tableName, limit, offset);
await api.updateData(tableName, id, data);
await api.deleteData(tableName, id);

// Context
await api.saveContext(tableName, description);
await api.getContext(tableName);
await api.getAllContexts();
await api.deleteContext(tableName);
```

## 📊 Column Types

- `TEXT` - Variable text
- `INTEGER` - Whole numbers
- `REAL` - Decimals
- `BOOLEAN` - True/false
- `TIMESTAMP` - Date/time
- `VARCHAR(255)` - Limited text
- `JSONB` - JSON data

## 🛠️ Common Tasks

### Create a table
```typescript
await api.createTable('users', [
  { name: 'email', type: 'VARCHAR(255)', nullable: false },
  { name: 'age', type: 'INTEGER', nullable: true },
]);
```

### Add data
```typescript
await api.addData('users', {
  email: 'user@example.com',
  age: 25,
});
```

### Save context
```typescript
await api.saveContext('users', 
  'Stores user information for authentication and profiles.'
);
```

## 📁 Key Files

- `server/index.ts` - Server entry
- `server/routes/*.ts` - API routes
- `src/lib/api.ts` - Frontend client
- `prisma/schema.prisma` - DB schema
- `.env` - Configuration

## 🔍 Debugging

```bash
# Check server logs
npm run server

# Test API endpoint
curl http://localhost:3001/health

# View database
npx prisma studio
```

## ⚠️ Important Notes

- Table names: `^[a-zA-Z_][a-zA-Z0-9_]*$`
- Auto-created columns: `id`, `created_at`, `updated_at`
- All responses have `success` boolean
- Errors include `error` message and optional `details`

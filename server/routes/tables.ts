import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const columnSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid column name'),
  type: z.enum(['TEXT', 'INTEGER', 'REAL', 'BOOLEAN', 'TIMESTAMP', 'VARCHAR(255)', 'JSONB']),
  nullable: z.boolean().optional().default(true),
});

const createTableSchema = z.object({
  tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid table name'),
  columns: z.array(columnSchema).min(1, 'At least one column is required'),
});

// POST /api/tables/create - Create a new dynamic table
router.post('/create', async (req: Request, res: Response) => {
  try {
    console.log('Received table creation request:', JSON.stringify(req.body, null, 2));
    
    // Validate input
    const { tableName, columns } = createTableSchema.parse(req.body);
    console.log('Validation passed. Creating table:', tableName);

    // Build column definitions
    const columnDefinitions = columns.map((col) => {
      const nullConstraint = col.nullable ? '' : ' NOT NULL';
      return `"${col.name}" ${col.type}${nullConstraint}`;
    }).join(', ');

    // Create the SQL query with an auto-incrementing ID
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        ${columnDefinitions},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Execute the raw SQL
    await prisma.$executeRawUnsafe(createTableQuery);

    // Note: Skipping trigger creation due to Prisma limitations with raw SQL
    // The updated_at field will need to be updated manually in the application

    res.json({
      success: true,
      message: `Table '${tableName}' created successfully`,
      tableName,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Table creation validation error:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error creating table:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/tables/list - List all user-created tables
router.get('/list', async (req: Request, res: Response) => {
  try {
    // Query PostgreSQL information schema to get user tables
    const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'TableContext'
      AND tablename != '_prisma_migrations'
      ORDER BY tablename;
    `);

    res.json({
      success: true,
      tables: tables.map((t) => t.tablename),
    });
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/tables/:tableName/schema - Get table schema
router.get('/:tableName/schema', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name',
      });
    }

    const columns = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);

    res.json({
      success: true,
      tableName,
      columns,
    });
  } catch (error) {
    console.error('Error getting table schema:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/tables/alter - Add a column to an existing table
router.post('/alter', async (req: Request, res: Response) => {
  try {
    const { tableName, columnName, columnType } = req.body;

    // Validation
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName) || !tableNameRegex.test(columnName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table or column name',
      });
    }

    const allowedTypes = ['TEXT', 'INTEGER', 'REAL', 'BOOLEAN', 'TIMESTAMP', 'VARCHAR(255)', 'JSONB'];
    if (!allowedTypes.includes(columnType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid column type',
      });
    }

    // Add column using ALTER TABLE
    const alterQuery = `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType};`;
    await prisma.$executeRawUnsafe(alterQuery);

    res.json({
      success: true,
      message: `Column '${columnName}' added to table '${tableName}' successfully`,
    });
  } catch (error) {
    console.error('Error altering table:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/tables/:tableName - Delete a table
router.delete('/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name',
      });
    }

    // Drop the table
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);

    // Also delete the context for this table
    await prisma.tableContext.deleteMany({
      where: { tableName },
    });

    res.json({
      success: true,
      message: `Table '${tableName}' deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema
const addDataSchema = z.object({
  tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid table name'),
  data: z.record(z.any()), // Key-value pairs for column: value
});

const bulkAddDataSchema = z.object({
  tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid table name'),
  data: z.array(z.record(z.any())).min(1, 'At least one row is required'),
});

// POST /api/data/add - Add a single row to a table
router.post('/add', async (req: Request, res: Response) => {
  try {
    const { tableName, data } = addDataSchema.parse(req.body);

    // Build column names and values
    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
      });
    }

    // Create placeholders for parameterized query
    const columnNames = columns.map((col) => `"${col}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const insertQuery = `
      INSERT INTO "${tableName}" (${columnNames})
      VALUES (${placeholders})
      RETURNING *;
    `;

    const result = await prisma.$queryRawUnsafe(insertQuery, ...values);

    res.json({
      success: true,
      message: 'Data added successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error adding data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/data/bulk-add - Add multiple rows to a table
router.post('/bulk-add', async (req: Request, res: Response) => {
  try {
    const { tableName, data } = bulkAddDataSchema.parse(req.body);

    // Get all unique column names from all rows
    const allColumns = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((col) => allColumns.add(col));
    });

    const columns = Array.from(allColumns);
    const columnNames = columns.map((col) => `"${col}"`).join(', ');

    // Build values for each row
    const valueRows: string[] = [];
    const allValues: any[] = [];
    let paramIndex = 1;

    data.forEach((row) => {
      const rowValues = columns.map((col) => {
        allValues.push(row[col] ?? null);
        return `$${paramIndex++}`;
      });
      valueRows.push(`(${rowValues.join(', ')})`);
    });

    const insertQuery = `
      INSERT INTO "${tableName}" (${columnNames})
      VALUES ${valueRows.join(', ')}
      RETURNING *;
    `;

    const result = await prisma.$queryRawUnsafe(insertQuery, ...allValues);

    res.json({
      success: true,
      message: `${data.length} rows added successfully`,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error adding bulk data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/data/:tableName - Get all data from a table
router.get('/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { limit = '100', offset = '0' } = req.query;

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name',
      });
    }

    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const data = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${tableName}" ORDER BY id LIMIT ${limitNum} OFFSET ${offsetNum};`
    );

    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "${tableName}";`
    );

    const totalCount = Number(countResult[0]?.count || 0);

    res.json({
      success: true,
      data,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/data/:tableName/:id - Update a row
router.put('/:tableName/:id', async (req: Request, res: Response) => {
  try {
    const { tableName, id } = req.params;
    const data = req.body;

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name',
      });
    }

    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
      });
    }

    // Build SET clause
    const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');

    const updateQuery = `
      UPDATE "${tableName}"
      SET ${setClause}
      WHERE id = $${columns.length + 1}
      RETURNING *;
    `;

    const result = await prisma.$queryRawUnsafe(updateQuery, ...values, parseInt(id, 10));

    res.json({
      success: true,
      message: 'Data updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/data/:tableName/:id - Delete a row
router.delete('/:tableName/:id', async (req: Request, res: Response) => {
  try {
    const { tableName, id } = req.params;

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name',
      });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM "${tableName}" WHERE id = $1;`,
      parseInt(id, 10)
    );

    res.json({
      success: true,
      message: 'Data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/data/add
 * Adds a new row of data to a specified table
 * 
 * Request body:
 * {
 *   tableName: string,
 *   data: { columnName: value, ... }
 * }
 */
export async function POST(request) {
  try {
    const { tableName, data } = await request.json();

    // Validation: Check if tableName and data are provided
    if (!tableName || !data || typeof data !== 'object') {
      return Response.json(
        { error: 'Invalid request. Please provide tableName and data object.' },
        { status: 400 }
      );
    }

    // Validation: Sanitize table name
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
      return Response.json(
        { error: 'Invalid table name.' },
        { status: 400 }
      );
    }

    // Get column names and values
    const columns = Object.keys(data);
    const values = Object.values(data);

    if (columns.length === 0) {
      return Response.json(
        { error: 'No data provided. Please include at least one column.' },
        { status: 400 }
      );
    }

    // Validate column names
    for (const col of columns) {
      if (!tableNameRegex.test(col)) {
        return Response.json(
          { error: `Invalid column name: ${col}` },
          { status: 400 }
        );
      }
    }

    // Build the INSERT query with parameterized values
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const insertQuery = `
      INSERT INTO "${tableName}" (${columnNames})
      VALUES (${placeholders})
      RETURNING *;
    `;

    // Execute the query with parameterized values (prevents SQL injection)
    const result = await prisma.$queryRawUnsafe(insertQuery, ...values);

    return Response.json({
      success: true,
      message: 'Data added successfully',
      data: result[0] // Return the inserted row
    });

  } catch (error) {
    console.error('Error adding data:', error);

    // Check for common errors
    if (error.message.includes('does not exist')) {
      return Response.json(
        { error: `Table '${tableName}' does not exist. Please create it first.` },
        { status: 404 }
      );
    }

    if (error.message.includes('column') && error.message.includes('does not exist')) {
      return Response.json(
        { error: 'One or more columns do not exist in this table.' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: error.message || 'Failed to add data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

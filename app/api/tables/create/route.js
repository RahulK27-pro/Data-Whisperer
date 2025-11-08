import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/tables/create
 * Creates a new dynamic table in the database
 * 
 * Request body:
 * {
 *   tableName: string,
 *   columns: [{ name: string, type: string }]
 * }
 */
export async function POST(request) {
  try {
    const { tableName, columns } = await request.json();

    // Validation: Check if tableName and columns are provided
    if (!tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
      return Response.json(
        { error: 'Invalid request. Please provide tableName and columns array.' },
        { status: 400 }
      );
    }

    // Validation: Sanitize table name (only alphanumeric and underscore)
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
      return Response.json(
        { error: 'Invalid table name. Use only letters, numbers, and underscores. Must start with a letter.' },
        { status: 400 }
      );
    }

    // Validation: Sanitize column names and types
    const allowedTypes = ['TEXT', 'INTEGER', 'REAL', 'BOOLEAN', 'TIMESTAMP', 'VARCHAR(255)', 'JSONB'];
    
    for (const col of columns) {
      if (!tableNameRegex.test(col.name)) {
        return Response.json(
          { error: `Invalid column name: ${col.name}. Use only letters, numbers, and underscores.` },
          { status: 400 }
        );
      }
      
      if (!allowedTypes.includes(col.type.toUpperCase())) {
        return Response.json(
          { error: `Invalid column type: ${col.type}. Allowed types: ${allowedTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build column definitions
    const columnDefinitions = columns
      .map(col => `"${col.name}" ${col.type.toUpperCase()}`)
      .join(', ');

    // Create the SQL query with auto-incrementing ID and timestamps
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

    // Create a trigger to auto-update the updated_at field
    const triggerQuery = `
      CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS ${tableName}_updated_at_trigger ON "${tableName}";
      
      CREATE TRIGGER ${tableName}_updated_at_trigger
      BEFORE UPDATE ON "${tableName}"
      FOR EACH ROW
      EXECUTE FUNCTION update_${tableName}_updated_at();
    `;

    await prisma.$executeRawUnsafe(triggerQuery);

    return Response.json({
      success: true,
      message: `Table '${tableName}' created successfully with ${columns.length} columns.`,
      tableName: tableName,
      columns: columns
    });

  } catch (error) {
    console.error('Error creating table:', error);
    
    // Check for duplicate table error
    if (error.message.includes('already exists')) {
      return Response.json(
        { error: `Table already exists. Please use a different name.` },
        { status: 409 }
      );
    }

    return Response.json(
      { error: error.message || 'Failed to create table' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

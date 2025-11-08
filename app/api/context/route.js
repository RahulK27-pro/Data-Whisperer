import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/context
 * Creates or updates the context/description for a table
 * This is used by the LLM to understand the business logic
 * 
 * Request body:
 * {
 *   tableName: string,
 *   description: string
 * }
 */
export async function POST(request) {
  try {
    const { tableName, description } = await request.json();

    // Validation
    if (!tableName || !description) {
      return Response.json(
        { error: 'Please provide both tableName and description.' },
        { status: 400 }
      );
    }

    if (typeof description !== 'string' || description.trim().length === 0) {
      return Response.json(
        { error: 'Description must be a non-empty string.' },
        { status: 400 }
      );
    }

    // Validate table name format
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
      return Response.json(
        { error: 'Invalid table name format.' },
        { status: 400 }
      );
    }

    // Use upsert: create a new context or update the existing one
    // This is type-safe because TableContext is defined in schema.prisma
    const context = await prisma.tableContext.upsert({
      where: { tableName: tableName },
      update: { description: description.trim() },
      create: { 
        tableName: tableName, 
        description: description.trim() 
      },
    });

    return Response.json({
      success: true,
      message: 'Context saved successfully',
      context: context
    });

  } catch (error) {
    console.error('Error saving context:', error);

    return Response.json(
      { error: error.message || 'Failed to save context' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/context?tableName=<name>
 * Retrieves the context for a specific table
 * If no tableName is provided, returns all contexts
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');

    if (tableName) {
      // Get context for a specific table
      const context = await prisma.tableContext.findUnique({
        where: { tableName: tableName }
      });

      if (!context) {
        return Response.json(
          { error: `No context found for table '${tableName}'` },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        context: context
      });

    } else {
      // Get all contexts
      const contexts = await prisma.tableContext.findMany({
        orderBy: { tableName: 'asc' }
      });

      return Response.json({
        success: true,
        contexts: contexts,
        count: contexts.length
      });
    }

  } catch (error) {
    console.error('Error fetching context:', error);

    return Response.json(
      { error: error.message || 'Failed to fetch context' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/context?tableName=<name>
 * Deletes the context for a specific table
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName');

    if (!tableName) {
      return Response.json(
        { error: 'Please provide a tableName parameter.' },
        { status: 400 }
      );
    }

    await prisma.tableContext.delete({
      where: { tableName: tableName }
    });

    return Response.json({
      success: true,
      message: `Context for table '${tableName}' deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting context:', error);

    if (error.code === 'P2025') {
      return Response.json(
        { error: `No context found for table '${tableName}'` },
        { status: 404 }
      );
    }

    return Response.json(
      { error: error.message || 'Failed to delete context' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

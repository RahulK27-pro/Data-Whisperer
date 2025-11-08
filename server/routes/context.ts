import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Function to generate embeddings using Gemini
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    throw error;
  }
}

// Validation schema
const contextSchema = z.object({
  tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid table name'),
  description: z.string().min(1, 'Description is required'),
});

// POST /api/context - Create or update table context
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received context save request:', req.body);
    const { tableName, description } = contextSchema.parse(req.body);

    // Generate embedding from description
    console.log('Generating embedding for:', tableName);
    const embedding = await generateEmbedding(description.trim());
    console.log('Embedding generated, length:', embedding.length);

    // Convert embedding array to pgvector format string
    const embeddingString = `[${embedding.join(',')}]`;

    // Use raw SQL to upsert with vector field
    // We need raw SQL because Prisma doesn't fully support the vector type yet
    await prisma.$executeRawUnsafe(`
      INSERT INTO "TableContext" (id, "tableName", description, embedding)
      VALUES (gen_random_uuid(), $1, $2, $3::vector)
      ON CONFLICT ("tableName")
      DO UPDATE SET 
        description = EXCLUDED.description,
        embedding = EXCLUDED.embedding
    `, tableName, description.trim(), embeddingString);

    // Fetch the updated context to return
    const context = await prisma.tableContext.findUnique({
      where: { tableName },
    });

    res.json({
      success: true,
      message: 'Context saved successfully with embedding',
      context,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Error saving context:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/context/:tableName - Get context for a specific table
router.get('/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;

    // Validate table name format
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name format',
      });
    }

    const context = await prisma.tableContext.findUnique({
      where: { tableName },
    });

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Context not found',
      });
    }

    res.json({
      success: true,
      context,
    });
  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/context - Get all table contexts
router.get('/', async (req: Request, res: Response) => {
  try {
    const contexts = await prisma.tableContext.findMany({
      orderBy: { tableName: 'asc' },
    });

    res.json({
      success: true,
      contexts,
    });
  } catch (error) {
    console.error('Error fetching contexts:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/context/:tableName - Delete table context
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

    await prisma.tableContext.delete({
      where: { tableName },
    });

    res.json({
      success: true,
      message: 'Context deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting context:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

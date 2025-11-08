import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import OpenAI from 'openai';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
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
    const { tableName, description } = contextSchema.parse(req.body);

    // Use upsert: create a new context or update the existing one
    const context = await prisma.tableContext.upsert({
      where: { tableName },
      update: { description },
      create: { tableName, description },
    });

    res.json({
      success: true,
      message: 'Context saved successfully',
      context,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
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

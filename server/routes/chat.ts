import express from 'express';
import { z } from 'zod';
import { geminiService } from '../utils/geminiService';

const router = express.Router();

// Validation schemas
const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  tableName: z.string().min(1, 'Table name is required'),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string()
  })),
  rows: z.array(z.record(z.any())),
  schema: z.string().optional(),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'ai']),
    content: z.string()
  })).optional()
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    // Validate request body
    const { message, tableName, columns, rows, schema, chatHistory = [] } = 
      chatSchema.parse(req.body);

    console.log(`Processing chat message for table ${tableName}: ${message}`);
    
    // Get response from Gemini
    const { response, sql } = await geminiService.chatAboutData({
      message,
      tableName,
      columns,
      rows,
      schema,
      chatHistory
    });

    // If SQL was generated, execute it and include results in the response
    let queryResults = null;
    if (sql) {
      try {
        // You'll need to implement executeQuery based on your database setup
        queryResults = await executeQuery(sql);
      } catch (error) {
        console.error('Error executing query:', error);
        // Don't fail the whole request if query execution fails
      }
    }

    res.json({
      success: true,
      response,
      ...(sql && { sql }),
      ...(queryResults && { results: queryResults })
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to execute SQL queries
async function executeQuery(sql: string) {
  // This is a placeholder - implement based on your database setup
  // You might want to use Prisma's $queryRaw or another query builder
  console.log('Executing SQL:', sql);
  
  // Example implementation with Prisma:
  // return await prisma.$queryRawUnsafe(sql);
  
  // For now, just return the SQL that would be executed
  return { query: sql, executed: false, message: 'Query execution not implemented' };
}

export default router;

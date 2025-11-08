import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private embeddingModel: any;
  private generationConfig: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    // Initialize with API key and configuration
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Generation configuration
    this.generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
    };
    
    // Initialize the main model (Gemini 2.5 Flash)
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: this.generationConfig,
    });
    
    // Initialize the embedding model
    this.embeddingModel = this.genAI.getGenerativeModel({ 
      model: 'embedding-001',
    });
  }

  /**
   * Generate an embedding for the given text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate SQL query based on natural language question and table context
   */
  async generateSQL({
    question,
    tableName,
    columns,
    rows,
    schema
  }: {
    question: string;
    tableName: string;
    columns: Array<{ name: string; type: string }>;
    rows: any[];
    schema?: string;
  }): Promise<string> {
    const prompt = this.buildSQLPrompt({ question, tableName, columns, rows, schema });
    
    try {
      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });
      
      const response = await result.response;
      const text = response.text();
      return this.extractSQL(text);
    } catch (error) {
      console.error('Error generating SQL:', error);
      throw new Error('Failed to generate SQL query');
    }
  }

  /**
   * Get a natural language explanation of the SQL query
   */
  async explainSQL(sql: string): Promise<string> {
    const prompt = `
      Explain what this SQL query does in simple terms:
      ${sql}

      Keep the explanation under 3 sentences and focus on the business logic.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error explaining SQL:', error);
      return "Could not generate explanation for this query.";
    }
  }

  /**
   * Chat with the AI about the table data
   */
  async chatAboutData({
    message,
    tableName,
    columns,
    rows,
    schema,
    chatHistory = []
  }: {
    message: string;
    tableName: string;
    columns: Array<{ name: string; type: string }>;
    rows: any[];
    schema?: string;
    chatHistory?: Array<{ role: 'user' | 'ai'; content: string }>;
  }): Promise<{ response: string; sql?: string }> {
    const prompt = this.buildChatPrompt({
      message,
      tableName,
      columns,
      rows,
      schema,
      chatHistory
    });

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text().trim();
      
      // Try to extract SQL if present
      const sqlMatch = content.match(/```sql\n([\s\S]*?)\n```/);
      const sql = sqlMatch ? sqlMatch[1].trim() : undefined;
      
      // Extract just the response text (without code blocks)
      const responseText = content.replace(/```[\s\S]*?```/g, '').trim();
      
      return {
        response: responseText,
        ...(sql && { sql })
      };
    } catch (error) {
      console.error('Error in chat:', error);
      return { 
        response: "I'm sorry, I encountered an error processing your request." 
      };
    }
  }

  private buildSQLPrompt({
    question,
    tableName,
    columns,
    rows,
    schema
  }: {
    question: string;
    tableName: string;
    columns: Array<{ name: string; type: string }>;
    rows: any[];
    schema?: string;
  }): string {
    return `
      You are an expert SQL developer. Generate a PostgreSQL query based on the following:

      TABLE: ${tableName}
      ${schema ? `\nSCHEMA:\n${schema}\n` : ''}
      COLUMNS: ${columns.map(c => `${c.name} (${c.type})`).join(', ')}
      
      SAMPLE DATA (first 3 rows):
      ${JSON.stringify(rows.slice(0, 3), null, 2)}

      QUESTION: ${question}

      INSTRUCTIONS:
      1. Return ONLY the SQL query
      2. Use proper JOINs if needed
      3. Include all necessary WHERE conditions
      4. Use appropriate aggregation if needed
      5. Format for readability
      6. Don't use backticks or any markdown formatting

      SQL QUERY:
    `;
  }

  private buildChatPrompt({
    message,
    tableName,
    columns,
    rows,
    schema,
    chatHistory = []
  }: {
    message: string;
    tableName: string;
    columns: Array<{ name: string; type: string }>;
    rows: any[];
    schema?: string;
    chatHistory?: Array<{ role: 'user' | 'ai'; content: string }>;
  }): string {
    // Build chat history context
    const historyContext = chatHistory.length > 0 
      ? `\n\nPREVIOUS CONVERSATION:\n${chatHistory.map(msg => 
        `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content}`
      ).join('\n')}`
      : '';

    return `
      You are a helpful data assistant. You help users understand and query their database tables.
      The user is working with a table named "${tableName}".
      
      TABLE SCHEMA:
      ${schema || 'No additional schema information provided.'}
      
      COLUMNS:
      ${columns.map(c => `- ${c.name} (${c.type})`).join('\n')}
      
      SAMPLE DATA (first 3 rows):
      ${JSON.stringify(rows.slice(0, 3), null, 2)}
      
      ${historyContext}
      
      USER MESSAGE: ${message}
      
      INSTRUCTIONS:
      1. If the user is asking a question that can be answered with data, generate a SQL query
      2. Format SQL queries in a code block with language "sql"
      3. Provide a clear, concise explanation of the results
      4. If the user asks for an explanation of the data or schema, provide it
      5. Keep responses friendly and helpful
      
      RESPONSE:
    `;
  }

  private extractSQL(text: string): string {
    // Remove code block markers if present
    return text
      .replace(/```sql\n?/g, '')
      .replace(/```/g, '')
      .trim();
  }
}

// Create a singleton instance
export const geminiService = new GeminiService();

export default geminiService;

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tablesRouter from './routes/tables';
import dataRouter from './routes/data';
import contextRouter from './routes/context';
import chatRouter from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tables', tablesRouter);
app.use('/api/data', dataRouter);
app.use('/api/context', contextRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

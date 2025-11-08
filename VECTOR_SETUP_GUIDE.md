# Vector Embeddings Setup Guide

## Overview

This guide will help you set up pgvector and Google Gemini embeddings for semantic search on your table contexts.

---

## Step 1: Enable pgvector in Neon Database

1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Run this SQL command:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

5. Verify it's enabled:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see a row with `vector` extension.

---

## Step 2: Get Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add it to your `.env` file:

```env
GEMINI_API_KEY=your-actual-gemini-key-here
```

⚠️ **Important:** Never commit your API key to Git!
✨ **Free tier:** 60 requests per minute, no credit card required!

---

## Step 3: Install Dependencies

```bash
npm install --legacy-peer-deps
```

This will install:
- `@google/generative-ai` - Google Gemini SDK for generating embeddings
- Updated Prisma with pgvector support

---

## Step 4: Update Database Schema

```bash
npx prisma db push
```

This will add the `embedding` column to your `TableContext` table.

---

## Step 5: Restart Your Server

```bash
# Stop the current server (Ctrl+C)
npm run server
```

---

## How It Works

### When You Save Context:

1. **User types** business logic in Context Settings
2. **Frontend sends** description to `/api/context`
3. **Backend generates** embedding using Google Gemini:
   ```typescript
   const model = genAI.getGenerativeModel({ model: 'embedding-001' });
   const result = await model.embedContent(description);
   const embedding = result.embedding.values;
   ```
4. **Saves to database** with vector:
   ```sql
   INSERT INTO "TableContext" (tableName, description, embedding)
   VALUES ('travelers', 'This table stores...', '[0.123, -0.456, ...]')
   ```

### When AI Searches (Future):

1. **User asks** question in chat
2. **Convert question** to embedding
3. **Search database** using vector similarity:
   ```sql
   SELECT tableName, description
   FROM "TableContext"
   ORDER BY embedding <-> '[question_embedding]'
   LIMIT 3;
   ```
4. **Use results** as context for SQL generation

---

## Testing

### Test 1: Save Context with Embedding

1. Go to **Context & Settings**
2. Add description for a table:
   ```
   This table stores traveler information. A "frequent traveler" 
   is someone with more than 20 trips. The balance field is in cents.
   ```
3. Click **Save All**
4. Check server logs - you should see:
   ```
   Generating embedding for: travelers
   Embedding generated, length: 768
   ```

### Test 2: Verify in Database

Run this in Neon SQL Editor:

```sql
SELECT 
  "tableName", 
  description, 
  embedding IS NOT NULL as has_embedding
FROM "TableContext";
```

You should see `has_embedding` = `true`

---

## Troubleshooting

### Error: "Cannot find module '@google/generative-ai'"

**Solution:** Run `npm install --legacy-peer-deps`

### Error: "type vector does not exist"

**Solution:** Enable pgvector extension in Neon (Step 1)

### Error: "Invalid API key"

**Solution:** Check your `GEMINI_API_KEY` in `.env` file

### Error: "Embedding generation failed"

**Possible causes:**
1. No Gemini API key
2. Invalid API key
3. Rate limit exceeded (60 requests/minute on free tier)
4. Network issues

**Check:** Server console logs for detailed error

---

## Cost Estimation

**Google Gemini Embeddings Pricing:**
- Model: `embedding-001`
- **FREE tier:** 60 requests per minute
- **768 dimensions** (vs 1536 for OpenAI)
- **No credit card required!**

Example:
- Unlimited tables with contexts = **$0.00** (FREE!)
- Perfect for development and small-medium projects

---

## Next Steps

Once embeddings are working, you can:

1. **Build Chat API** - Use embeddings to find relevant contexts
2. **Semantic Search** - Search tables by meaning, not just keywords
3. **Smart SQL Generation** - AI uses context to write better queries

---

## Architecture Diagram

```
User saves context
      ↓
Frontend → POST /api/context
      ↓
Backend generates embedding
      ↓
Google Gemini API (embedding-001)
      ↓
Returns 768-dimensional vector
      ↓
Saves to Neon (pgvector)
      ↓
Success!
```

---

## Files Modified

- ✅ `prisma/schema.prisma` - Added vector field (768 dimensions)
- ✅ `server/routes/context.ts` - Added Gemini embedding generation
- ✅ `package.json` - Added @google/generative-ai dependency
- ✅ `.env` - Added GEMINI_API_KEY
- ✅ `enable-pgvector.sql` - SQL to enable extension

---

## Verification Checklist

- [ ] pgvector extension enabled in Neon
- [ ] Gemini API key added to `.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma schema updated (`npx prisma db push`)
- [ ] Server restarted
- [ ] Test: Save a context successfully
- [ ] Test: Check database for embedding

---

## Support

If you encounter issues:
1. Check server console logs
2. Verify `.env` file has correct Gemini API key
3. Ensure pgvector is enabled in Neon
4. Check rate limits (60 requests/minute on free tier)

**Ready for the next phase: Building the Chat API!** 🚀

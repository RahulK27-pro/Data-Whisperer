import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiKey(apiKey) {
  try {
    console.log('🔑 Testing Gemini API key...');
    
    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
      },
    });
    
    // Test a simple completion
    const prompt = 'Hello, Gemini! This is a test. Please respond with a short message.';
    console.log('\n🤖 Sending test prompt to Gemini...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('\n✅ Gemini API is working! Response:');
    console.log('----------------------------------------');
    console.log(text);
    console.log('----------------------------------------');
    
    // Test embeddings
    console.log('\n🔍 Testing embeddings...');
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const embeddingResult = await embeddingModel.embedContent('Test embedding');
    const embedding = embeddingResult.embedding;
    
    console.log('✅ Embeddings generated successfully!');
    console.log(`📏 Vector dimensions: ${embedding.values.length}`);
    
  } catch (error) {
    console.error('\n❌ Error testing Gemini API:');
    
    if (error.message.includes('API key not valid')) {
      console.error('The API key appears to be invalid.');
      console.error('Please verify your API key at: https://aistudio.google.com/app/apikey');
    } else if (error.message.includes('quota')) {
      console.error('API quota exceeded or account not properly configured.');
      console.error('Check your Google Cloud Console for quota and billing setup.');
    } else {
      console.error(error.message);
    }
    
    process.exit(1);
  }
}

// Get API key from command line or environment variable
const apiKey = process.argv[2] || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ No API key provided.');
  console.log('Usage: node test-gemini.js YOUR_API_KEY');
  console.log('Or set GEMINI_API_KEY environment variable');
  process.exit(1);
}

testGeminiKey(apiKey);

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function run() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API key");
    return;
  }
  
  console.log("Testing with API Key:", process.env.GEMINI_API_KEY.slice(0, 10) + "...");
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  try {
    const result = await model.generateContent("Hello, just testing!");
    console.log("Success! Response:", result.response.text());
  } catch (error: any) {
    console.error("RAW ERROR OBJECT:");
    console.error(error);
  }
}

run();

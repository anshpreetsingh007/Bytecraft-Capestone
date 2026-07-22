import express from 'express';
import cors from 'cors';
import { streamText, convertToModelMessages } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize the Azure OpenAI provider
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Convert UIMessages (parts-based, from frontend) to model messages (content-based, for LLM)
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-mini'),
      messages: modelMessages,
      system: "You are a helpful customer service assistant for Markit Roofing. You help customers understand their roofing estimates, the inspection process, and answer general roofing FAQs. Keep your answers friendly, professional, and concise.",
    });

    // Use UIMessageStream format (required by AI SDK v7 DefaultChatTransport)
    result.pipeUIMessageStreamToResponse(res);
  } catch (error) {
    console.error("Error generating chat response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Chatbot microservice running on http://localhost:${port}`);
});

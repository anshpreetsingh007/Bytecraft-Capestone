import express from 'express';
import cors from 'cors';
import { streamText, tool, isStepCount } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const SUBMISSION_SERVICE_URL = process.env.SUBMISSION_SERVICE_URL || 'http://localhost:3007';

// Initialize the Azure OpenAI provider
const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Map standard client messages to CoreMessages for streamText
    const coreMessages = messages.map((m: any) => {
      let content = m.content;
      if (m.parts) {
        content = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
      }
      return { role: m.role, content: content || '' };
    });

    const result = streamText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-mini'),
      messages: coreMessages,
      system: `You are a helpful customer service assistant for Markit Roofing.
You help customers book roofing inspections, understand roofing estimates, the inspection process, and answer general roofing FAQs.
Keep your answers friendly, professional, and concise.

IMPORTANT RULES:
- Only answer questions related to roofing, inspections, estimates, and Markit Roofing services.
- If a customer asks something unrelated (e.g. coding, math, general knowledge), politely decline and redirect them to roofing topics.
- When a customer wants to book an inspection, use the bookInspection tool. Ask for their details (what the issue is) before calling the tool.`,
      tools: {
        bookInspection: tool({
          description: 'Book a roofing inspection request for a customer. Use this when the customer wants to schedule or request an inspection.',
          inputSchema: z.object({
            clientId: z.number().describe('The client ID of the customer. Use 1 as default if unknown.'),
            details: z.string().describe('Description of the roofing issue and any relevant details the customer provided.'),
          }),
          execute: async ({ clientId, details }) => {
            const response = await fetch(`${SUBMISSION_SERVICE_URL}/api/inspection-requests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ client_id: clientId, details, status: 'pending' }),
            });

            if (!response.ok) {
              return `Sorry, I couldn't book the inspection right now. Please try again later.`;
            }

            const created = await response.json();
            return `Inspection request #${created.request_id} has been submitted successfully! Our team will review it and get back to you soon.`;
          },
        }),
      },
      stopWhen: isStepCount(3),
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

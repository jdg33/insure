
import { GoogleGenAI } from "@google/genai";
import { Provision } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this environment, we assume the key is present.
  console.warn("API_KEY environment variable not set. AI features will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = "gemini-2.5-flash";

export async function summarizeProvisions(provisions: Omit<Provision, 'summary'>[]): Promise<string[]> {
  if (!provisions.length) return [];

  const BATCH_SIZE = 10;
  const summaries: string[] = [];

  for (let i = 0; i < provisions.length; i += BATCH_SIZE) {
    const batch = provisions.slice(i, i + BATCH_SIZE);
    
    const requests = batch.map(provision => {
        const prompt = `You are a legal analyst. Summarize the following contract clause in one concise sentence, focusing on the core insurance obligation, coverage requirement, or liability assignment.
        
        Clause: "${provision.text}"
        
        Summary:`;
        
        return ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.2,
                topP: 0.8,
                topK: 10,
                // Disable thinking for faster, more direct responses suitable for this task
                thinkingConfig: { thinkingBudget: 0 } 
            }
        });
    });

    try {
        const responses = await Promise.all(requests);
        summaries.push(...responses.map(response => response.text.trim()));
    } catch (error) {
        console.error("Error summarizing provision batch with Gemini API:", error);
        // Add placeholder errors for failed summaries in the batch
        summaries.push(...Array(batch.length).fill("AI summary failed."));
    }
  }

  return summaries;
}

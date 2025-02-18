import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeminiResponse {
  text: string;
  error?: string;
}

export async function generateResponse(
  prompt: string,
  context: string,
  messageHistory?: { role: 'user' | 'model'; text: string }[]
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const chat = model.startChat({
      history: messageHistory?.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      })) || [],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(`
      Context: ${context}
      
      User Message: ${prompt}
      
      Please provide a natural, engaging response that's appropriate for Instagram. 
      Keep it concise, friendly, and authentic. Use emojis sparingly if appropriate.
      Avoid any harmful, inappropriate, or offensive content.
    `);

    const response = result.response;
    const text = response.text();

    return { text };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      text: '',
      error: 'Failed to generate AI response. Please try again.',
    };
  }
} 
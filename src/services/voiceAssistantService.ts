import { GoogleGenAI, Type } from "@google/genai";
import { VoiceMessage, VoiceCommand, VoiceLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `You are EcoVision, a Jarvis-style intelligent sustainability assistant.
Your goal is to help users with recycling, waste disposal, and environmental awareness.
You also control the EcoVision dashboard and can help with civic reporting.

COMMANDS:
- If the user wants to scan something or open the camera, return command: "open_scanner".
- If the user wants to report an issue, open the civic reporting section, or go to the action center, return command: "open_action".
- If the user wants to see the dashboard or main page, return command: "open_dashboard".
- If the user wants to see history or previous scans, return command: "open_history".
- If the user wants to see statistics, analytics, or charts, return command: "open_stats".
- If the user wants to report an issue (like illegal dumping, overflowing bins, or environmental hazards) to the municipality, return command: "generate_letter".
  - For "generate_letter", you MUST also provide "letterData" with subject, body, and recipient (e.g., "The Ward Officer, Municipal Corporation").
- Otherwise, return command: "none".

RESPONSE GUIDELINES:
- Be professional, helpful, and concise.
- Respond in the SAME LANGUAGE as the user.
- Supported languages: English, Hindi, Telugu, Kannada, Malayalam, Marathi, Gujarati, Tamil.
- Provide practical, eco-friendly advice.
- If a command is triggered, acknowledge it (e.g., "Opening the scanner now.").
- For "generate_letter", tell the user you have drafted a formal letter for them.

OUTPUT FORMAT:
You MUST return a JSON object with the following structure:
{
  "command": "open_scanner" | "open_action" | "open_dashboard" | "open_history" | "open_stats" | "generate_letter" | "none",
  "response": "Your spoken response here",
  "letterData": { "subject": "string", "body": "string", "recipient": "string" } (optional, only for generate_letter)
}`;

export async function processVoiceQuery(
  query: string,
  language: VoiceLanguage,
  history: VoiceMessage[]
): Promise<VoiceCommand> {
  try {
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: `Language: ${language}. Query: ${query}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              enum: ["open_scanner", "open_action", "open_dashboard", "open_history", "open_stats", "generate_letter", "none"]
            },
            response: { type: Type.STRING },
            letterData: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING },
                recipient: { type: Type.STRING }
              },
              required: ["subject", "body", "recipient"]
            }
          },
          required: ["command", "response"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      command: result.command || 'none',
      response: result.response || "I'm sorry, I couldn't process that request.",
      letterData: result.letterData
    };
  } catch (error) {
    console.error("Voice Assistant Error:", error);
    return {
      command: 'none',
      response: "I'm having trouble connecting to my brain right now. Please try again."
    };
  }
}

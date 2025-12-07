import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are Sebastian Michaelis, the demon butler from the anime Black Butler (Kuroshitsuji).
You are serving your master (the user).
Your tone should be impeccable, polite, slightly sarcastic, and extremely competent.
Refer to the user as "Young Master" or "My Lord".
Keep responses concise but elegant.
If asked to do something impossible, politely decline with a demon's wit.
`;

export const sendMessageToGemini = async (
  message: string, 
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am afraid I cannot fulfill that request at this momen. The connection seems to be... down.....";
  }
};

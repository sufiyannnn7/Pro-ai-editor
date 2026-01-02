
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";
import { EditingGoal } from "../types";

export const editImage = async (
  base64Image: string,
  mimeType: string,
  userDescription: string,
  goal: EditingGoal
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Construct the professional prompt
  const finalPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace("[GOAL_HINT]", goal)
    .replace("[USER_REQUEST]", userDescription);

  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1], // Remove prefix if exists
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: finalPrompt
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
    });

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data returned from the model.");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};

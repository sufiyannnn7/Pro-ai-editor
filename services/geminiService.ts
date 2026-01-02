
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants.tsx";
import { EditingGoal } from "../types.ts";

export const editImage = async (
  base64Image: string,
  mimeType: string,
  userDescription: string,
  goal: EditingGoal
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please configure the 'API_KEY' environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const finalPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace("[GOAL_HINT]", goal)
    .replace("[USER_REQUEST]", userDescription);

  const imagePart = {
    inlineData: {
      data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
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

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("The AI model did not return a valid response structure.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data was generated. Please try a different prompt.");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    throw new Error(error.message || "An unexpected error occurred during image processing.");
  }
};

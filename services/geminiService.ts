
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";
import { EditingGoal } from "../types";

export const editImage = async (
  base64Image: string,
  mimeType: string,
  userDescription: string,
  goal: EditingGoal
): Promise<string> => {
  // Always initialize GoogleGenAI inside the function to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
      throw new Error("Invalid response structure from AI.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No edited image data was returned by the AI. It may have only returned text.");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    // Provide a more descriptive error message if possible
    const message = error.message || "An unexpected error occurred during image processing.";
    throw new Error(message);
  }
};

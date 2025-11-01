
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Removes the background from an image using the Gemini API.
 * @param base64ImageData The base64 encoded image data (without the data: prefix).
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @returns A promise that resolves to the base64 encoded string of the processed image.
 */
export const removeBackground = async (base64ImageData: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: 'Remove the background from this image. The new background must be transparent. Output a PNG file.',
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error('No image data found in the API response.');

  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the API.');
  }
};

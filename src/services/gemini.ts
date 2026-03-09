import { GoogleGenAI, Type } from "@google/genai";
import { WasteAnalysis } from "../types";

export async function analyzeWasteImage(base64Image: string): Promise<WasteAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this image for waste items. If there are multiple items or combined waste, SEGREGATE them and provide details for EACH item found.
  For each item, identify: name, category, hazard level, recycling/disposal method, environmental impact, decomposition time, recycled products, and an eco-score (0-100).
  Also provide an 'overall_advice' on how to handle the segregation of these items if they are mixed.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                item: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  enum: ['Plastic', 'Organic', 'Metal', 'Paper', 'Glass', 'Hazardous', 'E-waste', 'Other']
                },
                hazard_level: { 
                  type: Type.STRING,
                  enum: ['Low', 'Medium', 'High']
                },
                recycling_method: { type: Type.STRING },
                environmental_impact: { type: Type.STRING },
                decomposition_time: { type: Type.STRING },
                recycled_products: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                eco_score: { type: Type.INTEGER },
              },
              required: ["item", "category", "hazard_level", "recycling_method", "environmental_impact", "decomposition_time", "recycled_products", "eco_score"],
            }
          },
          overall_advice: { type: Type.STRING }
        },
        required: ["items", "overall_advice"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const result = JSON.parse(cleanJson);
  
  return {
    ...result,
    timestamp: Date.now(),
  };
}

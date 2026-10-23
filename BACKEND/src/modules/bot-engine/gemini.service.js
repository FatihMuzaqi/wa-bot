import crypto from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ApiError from "../../utils/ApiError.js";

const jsonShape = `Return valid JSON only with this shape:
{
  "answer": "short helpful answer",
  "confidence": 0.0,
  "shouldFallback": false,
  "fallbackReason": null,
  "sources": []
}`;

const resolveModel = (model) =>
  model || process.env.GEMINI_MODEL || "gemini-1.5-flash";

const formatInput = (input = []) =>
  input
    .map((message) => {
      if (typeof message === "string") return message;
      const role = message.role || "user";
      return `${role.toUpperCase()}: ${message.content || ""}`;
    })
    .join("\n\n");

export const createResponse = async ({
  instructions,
  input,
  model,
  temperature,
}) => {
  if (!process.env.GEMINI_API_KEY)
    throw new ApiError(500, "GEMINI_API_KEY is not configured");

  const requestId = crypto.randomUUID();
  const selectedModel = resolveModel(model);

  console.log("[GeminiService] Gemini request started:", {
    requestId,
    model: selectedModel,
  });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const geminiModel = genAI.getGenerativeModel({
      model: selectedModel,
      generationConfig: {
        temperature: temperature === undefined ? 0.3 : Number(temperature),
        responseMimeType: "application/json",
      },
    });

    const prompt = `${instructions || ""}

Conversation:
${formatInput(input)}

${jsonShape}`;

    const result = await geminiModel.generateContent(prompt);
    const outputText = result.response.text();

    console.log("[GeminiService] Gemini response received:", {
      requestId,
      length: outputText.length,
    });

    return {
      outputText,
      requestId,
      model: selectedModel,
    };
  } catch (error) {
    console.error("[GeminiService] Gemini request failed:", {
      message: error.message,
      status: error.status,
      details: error.details,
      stack: error.stack,
    });
    throw new ApiError(error.status || 502, message, error.details || null);
  }
};

export default {
  createResponse,
};

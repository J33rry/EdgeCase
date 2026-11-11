import OpenAI from "openai";

let client;

export function getClient() {
  if (!process.env.AI_API_KEY) throw new Error("AI_API_KEY is not set");
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    });
  }
  return client;
}

export const MODEL = process.env.AI_MODEL || "gpt-4o-mini";
export const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS) || 1200;

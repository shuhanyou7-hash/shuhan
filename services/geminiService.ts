
import { GoogleGenAI } from "@google/genai";

export const getStrategicAdvice = async (
  board: (string | number)[][],
  score: number,
  level: number,
  lines: number
) => {
  try {
    // Initializing with process.env.API_KEY directly as per SDK guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const boardStr = board.map(row => row.map(cell => (cell === 0 ? "." : "X")).join("")).join("\n");
    
    const prompt = `
      You are a world-class Tetris Grandmaster Coach. 
      Analyze this current board state (X = block, . = empty):
      ${boardStr}
      
      Stats: Score: ${score}, Level: ${level}, Lines Cleared: ${lines}.
      
      Provide a short, punchy piece of tactical advice (max 2 sentences). 
      Be snarky if the board looks messy, or encouraging if it's clean.
      Focus on things like: vertical holes, "wells" for I-pieces, or height management.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Keep calm and drop blocks.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI is pondering its own existence. Just keep playing!";
  }
};

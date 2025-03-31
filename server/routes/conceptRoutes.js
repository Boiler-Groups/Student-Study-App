import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import Note from "../models/Note.js";

dotenv.config();
const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
  const { notes, noteId } = req.body;

  if (!notes) return res.status(400).json({ error: "No notes provided" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = `
      Given the following study notes, extract and list the 3–5 most important key concepts.
      Respond with a list (not a paragraph) like:
      - Concept 1
      - Concept 2
      ...
      with no other details or explanations.

      Notes:
      ${notes}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const conceptArray = text
      .split('\n')
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line);

    await Note.findByIdAndUpdate(noteId, { keyConcepts: conceptArray });

    res.json({ concepts: text });
  } catch (error) {
    console.error("Concept extraction error:", error);
    res.status(500).json({ error: "Failed to extract key concepts" });
  }
});

export default router;
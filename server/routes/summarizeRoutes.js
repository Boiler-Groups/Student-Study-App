import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Note from "../models/Note.js";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", async (req, res) => {
    const { notes, noteId } = req.body;
  
    if (!notes) return res.status(400).json({ error: "No notes provided" });
  
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `Summarize these study notes into clear key points:\n\n${notes}.`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().replace(/`(.*?)`/g, "'$1'");
      await Note.findByIdAndUpdate(noteId, { summary });
  
      res.json({ summary });
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({ error: "Failed to summarize notes" });
    }
  });
  
export default router;
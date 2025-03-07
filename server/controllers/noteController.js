import Note from "../models/Note.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Find and return all study groups that the given user is a member of
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createNote = async (req, res) => {
    const { userId, name, content, date } = req.body;
  
    // Validate input before creating note
    if (!name || !userId || !content) {
      return res.status(400).json({ message: 'Error: You are missing a name, userId, or text content' });
    }
  
    try {
      const newNote = new Note({
        userId,
        name,
        content,
      });
  
      const savedNote = await newNote.save();
      res.status(201).json(savedNote);
    } catch (e) {
      res.status(500).json({ message: 'Server error', error: e.message });
    }
  };

// New function to delete a note
export const deleteNote = async (req, res) => {
    const { id } = req.params; // Get note ID from request parameters

    try {
        //Attempt to Delete a Note by id
        const deletedNote= await Note.findByIdAndDelete(id);

        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (e) {
        res.status(500).json({ message: 'Server error', error: e.message });
    }
};


import Note from "../models/Note.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';

// Find and return all study groups that the given user is a member of
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const getUserNotes = async (req, res) => {
  try {
    const userId = req.params.userId; 
    const notes = await Note.find({ userId });
    res.status(200).json(notes);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const createNote = async (req, res) => {
    const { name, content, userId } = req.body;
  
    // Validate input before creating note
    if (!name || !content || !userId) {
      return res.status(400).json({ message: 'Error: You are missing a name, userId, or text content' });
    }
  
    try {
      const newNote = new Note({
        name,
        content,
        userId,
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


export const editNote = async (req, res) => {
    const { id } = req.params; // Get group ID from request parameters
    const { name, content } = req.body; // Get the new group name from request body

    // Check if the name was provided
    if (!name || !content) {
        return res.status(400).json({
            message: 'Notes name and text content is required',
        });
    }

    try {
        // Attempt to find and update the Study Group by id
        const updatedNote = await Note.findByIdAndUpdate(id, { name, content }, { new: true });

        if (!updatedNote) {
            return res.status(404).json({
                message: 'Note not found',
                errorDetails: `No Note found with the id: ${id}.`
            });
        }

        res.status(200).json({
            message: 'Note edited successfully',
            Note: updatedNote
        });
    } catch (e) {
        // Log the error for debugging
        console.error('Error updating Note:', e);

        res.status(500).json({
            message: 'Server error occurred while updating the Note',
            errorDetails: `The error occurred while trying to update the Note with id: ${id}. Error: ${e.message}`,
        });
    }
};

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
    const deletedNote = await Note.findByIdAndDelete(id);

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
  const { name, content, images } = req.body; // Get the new group name from request body

  // Check if the name was provided
  if (!name || !content) {
    return res.status(400).json({
      message: 'Notes name and text content is required',
    });
  }
  let editDate = Date.now;
  try {
    // Attempt to find and update the Study Group by id
    const updatedNote = await Note.findByIdAndUpdate(id, { name, content, images, lastEdited: Date.now() }, { new: true });

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

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json(note);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const getSharedNotes = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const notes = await Note.find({ 'sharedWith.userId': userId });
    res.status(200).json(notes);
  } catch (e) {
    console.error("Error fetching shared notes:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
};

export const shareNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const User = mongoose.model('User');
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User with that email not found' });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const alreadyShared = note.sharedWith.some(share =>
      share.userId.toString() === user._id.toString()
    );

    if (alreadyShared) {
      return res.status(400).json({ message: 'Note already shared with this user' });
    }

    note.sharedWith.push({ userId: user._id, email: user.email });
    await note.save();

    res.status(200).json({
      message: 'Note shared successfully',
      sharedWith: note.sharedWith
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};

export const unshareNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const note = await Note.findByIdAndUpdate(
      id,
      { $pull: { sharedWith: { userId } } },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.status(200).json({
      message: 'Note unshared successfully',
      sharedWith: note.sharedWith
    });
  } catch (e) {
    console.error("Error unsharing note:", e);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
};
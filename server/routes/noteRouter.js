import express from 'express';
import Note from '../models/Note.js';
import { userMiddleware } from '../middleware/userMiddleware.js';

import {
    getNotes,
    createNote,
    deleteNote,
    editNote,
} from '../controllers/noteController.js';

const router = express.Router();

router.get('/', getNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);
router.put('/:id', editNote);
export default router;
/*
userMiddleware, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.user.id }); // Fetch notes for user
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notes' });
    }
});

// Make a new Note
router.post('/', userMiddleware, async (req, res) => {
    try {
        const { name, content } = req.body;
        const newNote = new Note({ userId: req.user.id, name, content });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ message: 'Error creating note' });
    }
});

// Delete a Note of the current user
router.delete('/:id', userMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findOneAndDelete({ _id: id, userId: req.user.id });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting note' });
    }
});

// Update a Note of the current User
router.put('/:id', userMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const {name, content } = req.body;

        const updatedNote = await Note.findOneAndUpdate(
            {_id: id, userId: req.user._id },
            { name, content },
            { new: true },
        );
        if(!updatedNote) {
            return res.status(404).json({ message: "Note not found" })
        }

        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: "Error from updating Note" });
    }

});
*/


import express from 'express';
import Note from '../models/Note.js';
import { userMiddleware } from '../middleware/userMiddleware.js';

import {
    getUserNotes,
    getNotes,
    createNote,
    deleteNote,
    editNote,
    shareNote,
    unshareNote,
    getSharedNotes,
    getNoteById,
} from '../controllers/noteController.js';

const router = express.Router();

router.get('/', getNotes);
router.get('/user/:userId', getUserNotes);
router.get('/shared/:userId', getSharedNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.delete('/:id', deleteNote);
router.put('/:id', editNote);
router.post('/share/:id', shareNote);
router.delete('/share/:id', unshareNote);
export default router;
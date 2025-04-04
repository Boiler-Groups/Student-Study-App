import express from 'express';
import Note from '../models/Note.js';
import { userMiddleware } from '../middleware/userMiddleware.js';

import {
    getUserNotes,
    getNotes,
    createNote,
    deleteNote,
    editNote,
} from '../controllers/noteController.js';

const router = express.Router();

router.get('/', getNotes);
router.get('/user/:userId', getUserNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);
router.put('/:id', editNote);
export default router;
import express from 'express';
import {
    getClasses,
    createClass,
    deleteClass,
} from '../controllers/classController.js';

const router = express.Router();

router.get('/:id', getClasses);
router.post('/', createClass);
router.delete('/:id', deleteClass);
//router.put('/:id',editClass);   <- add this if necesary, lets avoid it for now
export default router;
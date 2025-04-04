import express from 'express';
import {
    getClasses,
    createClass,
    deleteClass,
    getICalendar,
} from '../controllers/classController.js';

const router = express.Router();

router.get('/', getClasses);
router.post('/', createClass);
router.delete('/:id', deleteClass);
router.get('/cal', getICalendar);
//router.put('/:id',editClass);   <- add this if necesary, lets avoid it for now
export default router;
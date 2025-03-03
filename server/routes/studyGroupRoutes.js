import express from 'express';
import {getGroups, createStudyGroup, deleteStudyGroup} from '../controllers/studyGroupController.js';

const router = express.Router();

router.get('/:email', getGroups);
router.post('/', createStudyGroup);
router.delete('/id/:id', deleteStudyGroup);
export default router;
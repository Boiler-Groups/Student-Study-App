import express from 'express';
import { getGroups, createStudyGroup } from '../controllers/studyGroupController.js';

const router = express.Router();

router.get('/:email', getGroups);
router.post('/', createStudyGroup);

export default router;
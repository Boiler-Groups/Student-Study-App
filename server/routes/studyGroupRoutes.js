import express from 'express';
import {
    getGroups,
    createStudyGroup,
    deleteStudyGroup,
    editStudyGroupName
} from '../controllers/studyGroupController.js';

const router = express.Router();

router.get('/:email', getGroups);
router.post('/', createStudyGroup);
router.delete('/id/:id', deleteStudyGroup);
router.patch('/editName/:id',editStudyGroupName); //Editing is done by the group id
export default router;
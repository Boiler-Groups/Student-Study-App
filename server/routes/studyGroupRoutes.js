import express from 'express';
import {
    getGroups,
    createStudyGroup,
    deleteStudyGroup,
    editStudyGroupName,
    getGroupMessages,
    getGroupMembers,
    sendMessage,
    removeMember,
    getGroupsAll,
    addMemberToGroup
} from '../controllers/studyGroupController.js';
import { userMiddleware } from '../middleware/userMiddleware.js';

const router = express.Router();

router.get('/groups', getGroupsAll);
router.get('/:email', getGroups);
router.post('/', createStudyGroup);
router.delete('/id/:id', deleteStudyGroup);
router.patch('/editName/:id',editStudyGroupName); //Editing is done by the group id
router.get("/messages/:groupId", userMiddleware, getGroupMessages);
router.post("/messages/:groupId", userMiddleware, sendMessage);
router.get("/members/:groupId", userMiddleware, getGroupMembers);
router.patch('/remove/:groupId', userMiddleware, removeMember)
router.patch('/addMember/:id', addMemberToGroup);

export default router;
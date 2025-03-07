import express from 'express';
import { register, login, updateUser, getCurrentUser, getUser, searchUser } from '../controllers/userController.js';
import { userMiddleware } from '../middleware/userMiddleware.js';

const router = express.Router();
router.get('/search', searchUser);
router.post('/register', register);
router.post('/login', login);
router.put('/:userId', userMiddleware, updateUser);
router.get('/me', userMiddleware, getCurrentUser);
router.get('/:userId', getUser);


export default router;
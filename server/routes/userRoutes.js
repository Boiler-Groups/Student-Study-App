import express from 'express';
import { 
  register, 
  login, 
  updateUser, 
  getCurrentUser, 
  getUser, 
  searchUser,
  updateProfileImage,
  getPoints,
  getAllUsers,
  updatePoints,
  upload
} from '../controllers/userController.js';
import { userMiddleware } from '../middleware/userMiddleware.js';

const router = express.Router();

router.get('/search', searchUser);
router.post('/register', register);
router.post('/login', login);
router.put('/:userId', userMiddleware, updateUser);
router.get('/me', userMiddleware, getCurrentUser);
router.get('/:userId', getUser);
router.get('/:userId', getPoints)
router.put('/:userId', updatePoints)
router.get('/', getAllUsers)
router.post('/:userId/profile-image', userMiddleware, upload.single('profileImage'), updateProfileImage);

export default router;
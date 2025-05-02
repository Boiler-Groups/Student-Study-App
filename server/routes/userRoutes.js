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
  upload,
  verifyMFA,
  updateMfaOn,
  setUserOnlineStatus,
  updateShowOnlineStatus,
  getOnlineUsersWithAvatars,
  updateLastSeen,
} from '../controllers/userController.js';
import { userMiddleware } from '../middleware/userMiddleware.js';

const router = express.Router();

router.get('/search', searchUser);
router.post('/register', register);
router.post('/login', login);
router.put('/:userId', userMiddleware, updateUser);
router.get('/me', userMiddleware, getCurrentUser);
router.get('/online-avatars', getOnlineUsersWithAvatars);
router.get('/:userId', getUser);
router.get('/points/:userId', getPoints)
router.put('/points/:userId', updatePoints)
router.get('/', getAllUsers)
router.post('/:userId/profile-image', userMiddleware, upload.single('profileImage'), updateProfileImage);
router.post('/mfa', verifyMFA);
router.put('/mfa/:userId', updateMfaOn);
router.patch('/:userId/online', userMiddleware, setUserOnlineStatus);
router.patch('/:userId/settings', userMiddleware, updateShowOnlineStatus);
router.post('/heartbeat', userMiddleware, updateLastSeen);

export default router;
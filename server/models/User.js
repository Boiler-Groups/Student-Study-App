import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  avatarConfig: {
    type: Object,
    default: null,
  },
  points: {
    type: Number,
    default: 0,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  streak: {
    type: Number,
    default: 0,
  },
  mfaOn: {
    type: Boolean,
    default: false,
  },
  mfaCode: {
    type: String,
    default: null,
  },
  mfaExpiration: {
    type: Date,
    default: null,
  },
  showOnlineStatus: {
    type: Boolean,
    default: true,
  },
  online: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
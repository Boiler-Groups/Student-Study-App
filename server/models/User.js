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
  } , 
});

export default mongoose.model('User', UserSchema);
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
});

export default mongoose.model('User', UserSchema);
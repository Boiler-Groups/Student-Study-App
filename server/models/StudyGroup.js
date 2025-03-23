import mongoose from 'mongoose';

const StudyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: {
    type: Array,
  },
  messages: {
    type: Array,
  },
  newMessage: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model('StudyGroup', StudyGroupSchema);
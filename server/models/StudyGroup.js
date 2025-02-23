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
});

export default mongoose.model('StudyGroup', StudyGroupSchema);
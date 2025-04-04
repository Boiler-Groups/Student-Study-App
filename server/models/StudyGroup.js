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
  isDM: {
    type: Boolean,
    default: false,
  },
  newMessage: {
    type: Boolean,
    default: false,
  },
  membersWithUnopenedMessages: {
    type: Array,
  },
  membersTaggedOrReplied: {
    type: Array,
    default: []
  }
});

export default mongoose.model('StudyGroup', StudyGroupSchema);
import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false
  },
  name: {
    type: String, required: true
  },
  content: {
    type: String, required: true
  },
  summary: {
    type: String,
    default: ''
  },
  keyConcepts: {
    type: [String],
    default: []
  }
});

const Note = mongoose.model('Note', NoteSchema);
export default Note;
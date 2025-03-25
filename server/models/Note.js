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
});

const Note = mongoose.model('Note', NoteSchema);
export default Note;
import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
    userEmail: { 
        type: String, required: true
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
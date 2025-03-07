import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

export default function NotesPage() {
  const router = useRouter();
  const { isDarkTheme } = useTheme(); // Get dark mode state
  const [notesName, setNotesName] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [token, setToken] = useState('');
  const [editModal, openEditModal] = useState(false);
  const [createModal, openCreateModal] = useState(false);
  const [objContent, setObjContent] = useState('');
  const [objName, setObjName] = useState('');
  /** 🔹 Fetch notes from backend when the component mounts */
  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: 'GET',
      });

      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  useEffect(() => { fetchNotes() }, []);

  /** 🔹 Add a new note */
  const handleAddNote = async () => {
    if (notesName.trim() && notesContent.trim()) {
      try {
        const newNote = { name: notesName, content: notesContent };

        const res = await fetch(`${API_URL}/notes/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newNote),
        });

        const data = await res.json();
        setNotes([...notes, data]); // Update state with new note
        setNotesName('');
        setNotesContent('');
        openCreateModal(false);
      } catch (error) {
        console.error("Error adding note:", error);
      }
    }
  };

  /** 🔹 Delete a note */
  const removeNote = async (id) => {
    try {
      const res = await fetch(`${API_URL}/notes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) { 
        console.error("failure to delete.");
      };

      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleEditNote = async (id) => {
    if (notesName.trim() && notesContent.trim()) {
      try {
        const newNote = { name: notesName, content: notesContent };

        const res = await fetch(`${API_URL}/notes/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newNote),
        });

        const data = await res.json();
        if (res.ok) {
        setNotesName('');
        setNotesContent('');
        fetchNotes();
        openCreateModal(false);
        } else {
          console.error("Couldn't find Note")
        }
      } catch (error) {
        console.error("Error editing note:", error);
      }
    }
  };


  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Your Notes</Text>

      {/* Input Fields */}

      <View style={[styles.addNoteContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
        <Text style={[styles.addNoteText,isDarkTheme ? styles.darkInput : styles.lightInput}>Add Note</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { openCreateModal(true) }}>
          <Icon name="add-circle" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* List of Notes */}
      <FlatList
        style={styles.listContainer}
        data={notes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.notesItem, isDarkTheme ? styles.darkNoteItem : styles.lightNoteItem]}>
            <View>
              <Text style={[styles.notesText, isDarkTheme ? styles.darkText : styles.lightText]}>
                {item.name}
              </Text>
              <Text style={[styles.notesContent, isDarkTheme ? styles.darkText : styles.lightText]}>
                {item.content}
              </Text>
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={() => removeNotes(item._id)}>
                <Icon name="edit" size={24} color={isDarkTheme ? "#AAA" : "black"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeNotes(item._id)}>
                <Icon name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => {
              setNotesName(item.name);
              setNotesContent(item.content); 
              openEditModal(true);
            }}>
              <Icon name="edit" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeNote(item._id)}>
              <Icon name="delete" size={24} color="red" />
            </TouchableOpacity>

          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/home')}>
          <Text style={styles.buttonText}>Return to Classes</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Creating Group */}
      <Modal visible={createModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Create a Note</Text>
                  <TextInput
                      style={styles.modalInput}
                      placeholder="Note Name"
                      value={notesName}
                      onChangeText={setNotesName}
                  />
                  <TextInput
                      style={styles.modalInput}
                      placeholder="Write in your notes here...."
                      value={notesContent}
                      onChangeText={setNotesContent}
                  />
                  <TouchableOpacity style={styles.modalButton} onPress={handleAddNote}>
                      <Text style={styles.buttonText}>Create Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { 
                    openCreateModal(false); 
                    setNotesContent(''); 
                    setNotesName('');
                  }}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={editModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit a Note</Text>
                  <TextInput
                      style={styles.modalInput}
                      value={notesName}
                      onChangeText={setNotesName}
                  />
                  <TextInput
                      style={styles.modalInput}
                      value={notesContent}
                      onChangeText={setNotesContent}
                  />
                  <TouchableOpacity style={styles.modalButton} onPress={handleEditNote}>
                      <Text style={styles.buttonText}>Edit Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { 
                    openEditModal(false); 
                    setNotesContent(''); 
                    setNotesName('');
                  }}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center", 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#CFB991",
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'column',
    marginBottom: 12,
    borderRadius: 8,
    padding: 10,
  },
  input: {
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  notesText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesContent: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  addNoteContainer: {
    flexDirection: "row", 
    alignItems: "center",
    width: '60%',
    justifyContent: "center",
    backgroundColor: '#CFB991',
    borderWidth: 6,
    borderColor: "black",
  },
  addNoteText: {
    color: "white", 
    fontWeight: "bold", 
    fontSize: 18,
    marginRight: 8,
    marginTop: '1%',
    marginBottom: '1%',
  },
  addButton: {
    backgroundColor: '#1D3D47',
    padding: 10,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: '1%',
    marginTop: '1%',
  },
  listContainer: {
    borderBottomWidth: 6, 
    borderBottomColor: "black",
    padding: 5,
    width: '60%',
    borderRightWidth: 6, 
    borderRightColor: "black",
    borderLeftWidth: 6, 
    borderLeftColor: "black",
    padding: 5,
  },
  modalButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20, // Space above the button
},
buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
},
modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    justifyContent: 'space-between', // Ensure spacing between the buttons
    height: 'auto', // Allow height to adjust based on content
    paddingBottom: 20, // Add padding at the bottom to give space for the buttons
},
modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10 },
modalInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
},
cancelButton: {
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    marginTop: 20, // Space between Create Group and Cancel button
    alignItems: 'center',
    width: '80%', // Ensure buttons have the same width
},
cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold'
},
});


  /* Light Mode */
  lightBackground: {
    backgroundColor: "#FFFFFF",
  },
  lightText: {
    color: "#000",
  },
  lightInputContainer: {
    backgroundColor: "#F5F5F5",
  },
  lightInput: {
    backgroundColor: "#FFF",
    borderColor: "#CCC",
    color: "#000",
  },
  lightNoteItem: {
    backgroundColor: "#FFF",
    borderBottomColor: "#DDD",
  },

  /* Dark Mode */
  darkBackground: {
    backgroundColor: "#121212",
  },
  darkText: {
    color: "#F1F1F1",
  },
  darkInputContainer: {
    backgroundColor: "#1E1E1E",
  },
  darkInput: {
    backgroundColor: "#333",
    borderColor: "#555",
    color: "#F1F1F1",
  },
  darkNoteItem: {
    backgroundColor: "#1E1E1E",
    borderBottomColor: "#555",
  },
});
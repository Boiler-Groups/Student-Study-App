import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons'; 
import { API_URL } from '@env';

export default function NotesPage() {
  const router = useRouter();
  const [notesName, setNotesName] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [currentNote, setCurrentNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [token, setToken] = useState('');
  const [editModal, openEditModal] = useState(false);
  const [createModal, openCreateModal] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [speakingNoteId, setSpeakingNoteId] = useState(null);
  const [objId, setObjId] = useState("");
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

  const handleEditNote = async () => {
    if (notesName.trim() && notesContent.trim()) {
      try {
        const newNote = { name: notesName, content: notesContent };

        const res = await fetch(`${API_URL}/notes/${objId}`, {
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
        setObjId('');
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
    <View style={styles.container}>
      <Text style={styles.title}>Your Notes</Text>

      {/* Input Fields */}
      <View style={styles.addNoteContainer}>
        <Text style={styles.addNoteText}>Add Note</Text>
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
          <View style={styles.notesItem}>
            <View>
              <Text style={styles.notesText}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={() => {
              setNotesName(item.name);
              setNotesContent(item.content); 
              setObjId(item._id);
              setSummary(item.summary || '');
              setKeyConcepts(item.keyConcepts || []);
              setCurrentNote(item);
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
        <TouchableOpacity style={styles.button} onPress={() => router.dismissTo('/home')}>
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
                      style={styles.noteContentInput}
                      value={notesContent}
                      onChangeText={setNotesContent}
                      multiline
                      scrollEnabled
                      textAlignVertical="top"
                  />
                  <TouchableOpacity style={styles.modalButton} onPress={handleAddNote}>
                      <Text style={styles.buttonText}>Create Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { 
                    openCreateModal(false); 
                    setNotesContent(''); 
                    setNotesName('');
                    setCurrentNote(null);
                  }}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={editModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Text style={styles.modalTitle}>Edit a Note</Text>
                  <TouchableOpacity
                    style={{ padding: 0, marginTop: -5, marginLeft: 8 }}
                    onPress={() => {
                      if (speakingNoteId === objId) {
                        Speech.stop();
                        setSpeakingNoteId(null);
                      } else {
                        Speech.speak(notesContent, {
                          voice: "Microsoft Zira - English (United States)", //Microsoft David - English (United States)
                                                                             //Microsoft Mark - English (United States)
                          onDone: () => setSpeakingNoteId(null),
                        });
                        setSpeakingNoteId(objId);
                      }
                    }}
                  >
                    <MaterialIcons
                      name={speakingNoteId === objId ? 'pause-circle-filled' : 'volume-up'}
                      size={28}
                      color="#007AFF"
                    />
                  </TouchableOpacity>
                </View>
                  <TextInput
                      style={styles.modalInput}
                      value={notesName}
                      onChangeText={setNotesName}
                  />
                  <TextInput
                      style={styles.noteContentInput}
                      value={notesContent}
                      onChangeText={setNotesContent}
                      multiline
                      scrollEnabled
                      textAlignVertical="top"
                  />

                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: '#444' }]}
                    onPress={async () => {
                      setLoadingSummary(true);
                      try {
                        const response = await fetch(`${API_URL}/summarize`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ notes: notesContent, noteId: objId }),
                        });
                        const data = await response.json();
                        setSummary(data.summary);
                      } catch (err) {
                        console.error("Failed to fetch summary:", err);
                        setSummary("Error fetching summary.");
                      }
                      setLoadingSummary(false);
                    }}
                  >
                  
                  <Text style={styles.buttonText}>Generate AI Summary</Text>
                  </TouchableOpacity>
                    {loadingSummary ? (
                      <ActivityIndicator size="small" color="#0000ff" />
                    ) : (
                      <ScrollView style={{ maxHeight: 200, width: '100%', }}>
                      <Markdown style={{ body: { fontSize: 16, borderWidth: 1, width: '100%', padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10,} }}>
                        {summary}
                      </Markdown>
                      </ScrollView>
                    )}
                  
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#444' }]}
                      onPress={async () => {
                        setLoadingConcepts(true);
                        try {
                          const response = await fetch(`${API_URL}/concepts`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notes: notesContent, noteId: objId }),
                          });
                          const data = await response.json();
                          // Split by line to get bullet points
                          const conceptsArray = data.concepts.split('\n').filter(line => line.trim() !== '');
                          setKeyConcepts(conceptsArray);
                        } catch (err) {
                          console.error("Failed to get key concepts:", err);
                          setKeyConcepts(["Error fetching concepts."]);
                        }
                        setLoadingConcepts(false);
                      }}
                    >
                      <Text style={styles.buttonText}>Find Key Concepts</Text>
                    </TouchableOpacity>

                    {loadingConcepts ? (
                      <ActivityIndicator size="small" color="#0000ff" />
                    ) : (
                      <ScrollView style={styles.conceptsScroll} nestedScrollEnabled={true}>
                        <View style={styles.conceptsContainer}>
                          {keyConcepts.map((concept, idx) => (
                            <View key={idx} style={styles.conceptPill}>
                              <Text style={styles.conceptText}>{concept.replace(/^[-*]\s*/, '')}</Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    )}

                  <TouchableOpacity style={styles.modalButton} onPress={handleEditNote}>
                      <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      openEditModal(false); 
                      setNotesContent(''); 
                      setNotesName('');
                      setCurrentNote(null);
                      Speech.stop();
                      setSpeakingNoteId(null);
                    }}
                  >
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
  },
  input: {
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
  },
  notesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  notesText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notesContent: {
    fontSize: 14,
    color: "#333",
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
noteContentInput: {
  width: '100%',
  height: 250,
  borderWidth: 1,
  borderRadius: 8,
  borderColor: '#ccc',
  padding: 12,
  backgroundColor: '#f9f9f9',
  marginBottom: 10,
  textAlignVertical: 'top'
},
summaryBox: {
  width: '100%',
  padding: 10,
  borderRadius: 5,
  backgroundColor: '#eee',
  marginTop: 10,
  color: '#333',
},
conceptsScroll: {
  maxHeight: 100, // scrollable when content overflows
  width: '100%',
  marginTop: 10,
},
conceptsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8, // optional: requires React Native 0.71+
},
conceptPill: {
  backgroundColor: '#E0F7FA',
  borderRadius: 20,
  paddingVertical: 6,
  paddingHorizontal: 12,
  margin: 4,
},
conceptText: {
  color: '#00796B',
  fontWeight: '600',
  fontSize: 14,
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


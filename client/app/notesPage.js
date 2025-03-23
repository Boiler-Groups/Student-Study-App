import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Dimensions,
  ScrollView, Platform
  ActivityIndicator, Modal, TextInput, Dimensions,
  ScrollView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { useTheme } from '@react-navigation/native';
import { GoogleGenerativeAI, HarmCategory,
  HarmBlockThreshold } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { GoogleGenerativeAI, HarmCategory,
  HarmBlockThreshold } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';


export default function NotesPage() {
  const router = useRouter();
  const [notesName, setNotesName] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [token, setToken] = useState('');
  const [editModal, openEditModal] = useState(false);
  const [createModal, openCreateModal] = useState(false);
  const [flashModal, openFlashModal] = useState(false);
  const [flashModal, openFlashModal] = useState(false);
  const [objId, setObjId] = useState("");
  const screenHeight = Dimensions.get('window').height;
  const [card, setCard] = useState('');
  const [cards, setCards] = useState([]);
  const [cardNum, setCardNum] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  /* AI gemini portion */
  
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  
  async function run() {
    const chatSession = model.startChat({
      generationConfig,
      history: [
      ],
    });
  
    const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
    console.log(result.response.text());
  }
  
  //run();
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

  const handleFlashCards = async () => {
    if (!notesContent || !cardNum) {
      alert('Please enter notes and select number of flashcards');
      return;
    }
  
    try {
      const prompt = `Generate ${cardNum} flashcards from the following notes. Format:
  Flashcard 1:
  Front: [question]
  Back: [answer]
  
  Notes:
  ${notesContent}`;
  
      const result = await model.generateContent(prompt);
      const text = await result.response.text();
  
      if (Platform.OS === 'web') {
        // ✅ Web fallback: download file using Blob
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flashcards_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // ✅ Mobile (iOS/Android)
        const fileUri = FileSystem.documentDirectory + `flashcards_${Date.now()}.txt`;
        await FileSystem.writeAsStringAsync(fileUri, text, {
          encoding: FileSystem.EncodingType.UTF8,
        });
  
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri);
        } else {
          alert("Sharing is not available on this device.");
        }
      }
  
      // ✅ Reset state & close modal
      openFlashModal(false);
      setNotesContent('');
      setNotesName('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate or share flashcards.');
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Notes</Text>

      {/* Input Fields */}

      <View style={[styles.addNoteContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
        <Text style={[styles.addNoteText, isDarkTheme ? styles.darkInput : styles.lightInput]}>Add Note</Text>
        <TouchableOpacity testID="add-btn" style={styles.addButton} onPress={() => { openCreateModal(true) }}>
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
              <Text style={[styles.notesText, isDarkTheme ? styles.darkText : styles.lightText]}>
                {item.name}
              </Text>

            </View>
            <TouchableOpacity onPress={() => {
              setNotesName(item.name);
              setNotesContent(item.content); 
              setObjId(item._id);
              openEditModal(true);
            }}>
              <Icon name="edit" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeNote(item._id)}>
              <Icon name="delete" size={24} color="red" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setNotesName(item.name);
              setNotesContent(item.content); 
              setObjId(item._id);
              openFlashModal(true);
            }}>
              <Icon name="style" size={24} color="blue" />
            </TouchableOpacity>

          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.dismissTo('/home')}>
          <Text style={styles.buttonText}>Return to Classes</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Creating Note */}
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
                      style={[styles.modalInput, { height: screenHeight * 0.3}]}
                      placeholder="Write in your notes here...."
                      value={notesContent}
                      onChangeText={setNotesContent}
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical='top'
                      scrollEnabled={true}
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical='top'
                      scrollEnabled={true}
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
      {/* Modal for editing Notes */}
      {/* Modal for editing Notes */}
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
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical='top'
                      scrollEnabled={true}
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical='top'
                      scrollEnabled={true}
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
      {/* Modal for Creating Flashcards */}
      <Modal visible={flashModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Number of Flashcards</Text>
                  {/* Toggle Button for Dropdown */}
                  <TouchableOpacity
                    style={styles.dropdownToggle}
                    onPress={() => setShowDropdown(!showDropdown)}
                  >
                    <Text style={styles.cardItem}>
                      {cardNum ? `Cards: ${cardNum}` : 'Select number'}
                    </Text>
                  </TouchableOpacity>

                  {/* Dropdown List */}
                  {showDropdown && (
                    <ScrollView style={[styles.dropdownList, { maxHeight: screenHeight * 0.3 }]}>
                      {Array.from({ length: 50 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => {
                            setCardNum(i + 1);
                            setShowDropdown(false); // close dropdown after selection
                          }}
                        >
                          <Text style={styles.cardItem}>Cards: {i + 1}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  <TouchableOpacity style={styles.modalButton} onPress={handleFlashCards}>
                      <Text style={styles.buttonText}>Make Flash Cards</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { 
                    openFlashModal(false); 
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
  cardItem: {
    textAlign: "center",
    fontSize: 16,
    padding: 15,
    borderColor: '#ddd',
    borderBottomWidth: 1,
  },  
  },
  cardItem: {
    textAlign: "center",
    fontSize: 16,
    padding: 15,
    borderColor: '#ddd',
    borderBottomWidth: 1,
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
  dropdownToggle: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
  },
  dropdownToggle: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
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
    marginTop: 20, 
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
      justifyContent: 'space-between', 
      height: 'auto', 
      paddingBottom: 20, 
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
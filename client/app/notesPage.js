import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, ScrollView, Dimensions,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons'; 
import { API_URL } from '@env';
import { useTheme } from '@react-navigation/native';
import { GoogleGenerativeAI, HarmCategory,
  HarmBlockThreshold } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getCurrentUser } from './api/user';

export default function NotesPage() {
  const router = useRouter();
  const { isDarkTheme } = useTheme(); // Get dark mode state
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
  const [flashModal, openFlashModal] = useState(false);
  const [objId, setObjId] = useState("");
  const screenHeight = Dimensions.get('window').height;
  const [card, setCard] = useState('');
  const [cards, setCards] = useState([]);
  const [cardNum, setCardNum] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uid, setUserId] = useState('');
  const [sortMethod, setSortMethod] = useState('alphabetical');

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
  /* Fetch notes from backend when the component mounts */
  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await getCurrentUser({ token });
      const userID = userData.data._id;
      console.log(userID);
      setUserId(userID);
      const response = await fetch(`${API_URL}/notes/user/${userID}`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.log("Fetch notes failed!")
        throw new Error('Failed to fetch notes');

    }
      const data = await response.json();
      
      setNotes(data);
    } catch (error) {
      console.log("Error fetching notes:", error);
    }
  };

  useEffect(() => { fetchNotes() }, []);

  /* Add a new note */
  const handleAddNote = async () => {
    if (notesName.trim() && notesContent.trim()) {
      try {
        const newNote = { name: notesName, content: notesContent, userId: uid };

        const res = await fetch(`${API_URL}/notes/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newNote),
        });

        const data = await res.json();
        setNotes(prev => getSortedNotes([...prev, data]));
        setNotesName('');
        setNotesContent('');
        openCreateModal(false);
      } catch (error) {
        console.error("Error adding note:", error);
      }
    }
  };

  /* Delete a note */
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
        const newNote = { name: notesName, content: notesContent, userId: uid };

        const res = await fetch(`${API_URL}/notes/${objId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newNote),
        });

        const data = await res.json();
        if (res.ok) {
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

  /* Select Sorting Method */

  const getSortedNotes = (noteList = notes) => {
    const sorted = [...noteList];
    if (sortMethod === 'recent') {
      sorted.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
    } else if (sortMethod === 'oldest') {
      sorted.sort((a, b) => new Date(a.lastEdited) - new Date(b.lastEdited));
    } else if (sortMethod === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
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
  
      openFlashModal(false);
      setNotesContent('');
      setNotesName('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate or share flashcards.');
    }
  };
  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Your Notes</Text>

      {/* Input Fields */}

      <View style={[styles.addNoteContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
        <Text style={[styles.addNoteText, isDarkTheme ? styles.darkInput : styles.lightInput]}>Add Note</Text>
        <TouchableOpacity style={styles.addButton} testID ='add-btn' onPress={() => { openCreateModal(true) }}>
          <Icon name="add-circle" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <View style={{
        width: '60%',
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        backgroundColor: isDarkTheme ? '#1E1E1E' : '#F5F5F5',
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 5,
          color: isDarkTheme ? '#FFF' : '#000',
        }}>Sort Notes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ai', 'recent', 'oldest', 'alphabetical'].map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setSortMethod(option)}
              style={{
                backgroundColor: sortMethod === option ? '#007AFF' : '#ccc',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 16,
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {option === 'ai' ? 'AI Grouping' :
                option === 'recent' ? 'Most Recent' :
                option === 'oldest' ? 'Oldest' :
                'Alphabetical'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List of Notes */}
      <FlatList
        style={styles.listContainer}
        data={getSortedNotes()}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View key={item._id} style={[styles.notesItem, isDarkTheme ? styles.darkNoteItem : styles.lightNoteItem]}>
            <View>
              <Text style={[styles.notesText, isDarkTheme ? styles.darkText : styles.lightText]}>
                {item.name}
              </Text>
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
            <TouchableOpacity testID={`test-btn-${item.name}`} onPress={() => {
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
        <TouchableOpacity style={styles.button} onPress={() => router.push('/home')}>
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
                      testID='note-name'
                      value={notesName}
                      onChangeText={setNotesName}
                  />
                  <TextInput
                      placeholder="Write in your notes here...."
                      testID='write-note'
                      style={styles.noteContentInput}
                      value={notesContent}
                      onChangeText={setNotesContent}
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical='top'
                      scrollEnabled={true}
                  />
                  <TouchableOpacity 
                    style={styles.modalButton}
                    onPress={handleAddNote}>
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
      {/* Modal for editing Notes */}
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
                      multiline={true}
                      numberOfLines={6}
                      textAlignVertical='top'
                      scrollEnabled={true}
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
                      <ScrollView style={{ maxHeight: 150, width: '100%', }}>
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
                  <TouchableOpacity style={styles.modalButton} onPress={ () => {
                    handleFlashCards();
                    openFlashModal(false);
                    }}>
                      <Text style={styles.buttonText}>Download Flash Cards</Text>
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
  height: 150,
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
  maxHeight: 50,
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

import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, ScrollView, Dimensions,
  Platform, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import { API_URL } from '@env';
import { useTheme } from '../components/ThemeContext';
import {
  GoogleGenerativeAI, HarmCategory,
  HarmBlockThreshold
} from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getCurrentUser } from './api/user';
import { buttonPressSound } from '../sounds/soundUtils.js';


export default function NotesPage() {
  const router = useRouter();
  const isDarkTheme = useTheme();
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
  const [generationMode, setGenerationMode] = useState('flashcards');
  const [showDropdown, setShowDropdown] = useState(false);
  const [uid, setUserId] = useState('');
  const [sortMethod, setSortMethod] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModal, setShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [selectedNoteForShare, setSelectedNoteForShare] = useState(null);
  const [shareError, setShareError] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceSelectionModal, setVoiceSelectionModal] = useState(false);
  const [sortedAINotes, setSortedAINotes] = useState(null);


  useEffect(() => { // for resetting AI notes when a new sort is called while the method is ai
    if (sortMethod === 'ai' && notes.length > 1) {
      setSortedAINotes(null);
    }
  }, [notes, sortMethod]);


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

  /* boilerplate run code */
  async function run() {
    const chatSession = model.startChat({
      generationConfig,
      history: [
      ],
    });

    const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
    console.log(result.response.text());
  }

  /* AI SORTING !!! */
  const sortNotesByAISimilarity = async () => {
    try { //make prompt
      const prompt = `
  I have the following notes. Please sort them from most similar to most different, based on topic and content. Return only a numbered list of note titles in the desired order.
  
  ${notes.map((note, idx) => `
  Note ${idx + 1}:
  Title: ${note.name}
  Content: ${note.content}`).join('\n')}
  
  Respond with the list like:
  1. Note Title A
  2. Note Title B
  ...`;
      // get results of newly ordered notes
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      // turn text response into an ordered list of notes, use setSortedAiNotes function
      const titleOrder = text
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(title => title.length > 0);
  
      const reordered = titleOrder
        .map(title => notes.find(n => n.name === title))
        .filter(Boolean);
  
      setSortedAINotes(reordered);
    } catch (error) {
      console.error("AI sorting failed:", error);
      setSortedAINotes(null);
    }
  };
  
  //run();
  /* Fetch notes from backend when the component mounts */
  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await getCurrentUser({ token });
      const userID = userData.data._id;
      console.log(userID);
      setUserId(userID);

      const ownedResponse = await fetch(`${API_URL}/notes/user/${userID}`, {
        method: 'GET',
      });

      if (!ownedResponse.ok) {
        console.log("Fetch owned notes failed!")
        throw new Error('Failed to fetch owned notes');
      }

      const sharedResponse = await fetch(`${API_URL}/notes/shared/${userID}`, {
        method: 'GET',
      });

      if (!sharedResponse.ok) {
        console.log("Fetch shared notes failed!")
        throw new Error('Failed to fetch shared notes');
      }

      const ownedNotes = await ownedResponse.json();
      const sharedNotes = await sharedResponse.json();

      const combinedNotes = [
        ...ownedNotes.map(note => ({ ...note, isOwner: true })),
        ...sharedNotes.map(note => ({ ...note, isOwner: false, isShared: true }))
      ];

      setNotes(combinedNotes);
    } catch (error) {
      console.log("Error fetching notes:", error);
    }
  };

  const loadAvailableVoices = async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      setAvailableVoices(voices);

      const savedVoice = await AsyncStorage.getItem('selectedVoice');
      if (savedVoice && voices.some(voice => voice.identifier === savedVoice)) {
        setSelectedVoice(savedVoice);
      } else if (voices.length > 0) {
        setSelectedVoice(voices[0].identifier);
      }
    } catch (error) {
      console.error("Error loading available voices:", error);
    }
  };

  const speakNoteContent = async (content, noteId) => {
    await buttonPressSound();
    if (speakingNoteId === noteId) {
      Speech.stop();
      setSpeakingNoteId(null);
    } else {
      Speech.speak(content, {
        voice: selectedVoice,
        onDone: () => setSpeakingNoteId(null),
      });
      setSpeakingNoteId(noteId);
    }
  };

  useEffect(() => {
    fetchNotes();
    loadAvailableVoices();
  }, []);

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

  /* Select Sorting Method. 
  Adding stuff here for commit test */

  const getSortedNotes = (noteList = notes) => {
    const filtered = noteList.filter(note =>
      note.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    const sorted = [...filtered];
    if (sortMethod === 'recent') {
      sorted.sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));
    } else if (sortMethod === 'oldest') {
      sorted.sort((a, b) => new Date(a.lastEdited) - new Date(b.lastEdited));
    } else if (sortMethod === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMethod === 'ai') { //this is ai sort
      if (!sortedAINotes && notes.length > 1) {
        sortNotesByAISimilarity();
      }
      return sortedAINotes || sorted; // fallback to default if AI hasn’t responded yet
    }
    return sorted;
  };


  const fetchSharedUsers = async (noteId) => {
    try {
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch note details');
      }

      const data = await response.json();
      setSharedUsers(data.sharedWith || []);
    } catch (error) {
      console.error('Error fetching shared users:', error);
    }
  };

  const handleShareNote = async () => {
    if (!shareEmail.trim()) {
      setShareError('Please enter an email address');
      return;
    }

    setShareError('');

    try {
      const response = await fetch(`${API_URL}/notes/share/${selectedNoteForShare}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: shareEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setShareError(data.message || 'Failed to share note');
        return;
      }

      setSharedUsers(data.sharedWith);
      setShareEmail('');
      Alert.alert('Success', 'Note shared successfully');
    } catch (error) {
      console.error('Error sharing note:', error);
      setShareError('Network error: Could not connect to server');
    }
  };

  const handleUnshareNote = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/notes/share/${selectedNoteForShare}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', 'Failed to unshare note');
        return;
      }

      setSharedUsers(data.sharedWith);
      Alert.alert('Success', 'Note unshared successfully');
    } catch (error) {
      console.error('Error unsharing note:', error);
      Alert.alert('Error', 'Failed to unshare note');
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

  const handlePracticeQuestions = async () => {
    if (!notesContent || !cardNum) {
      alert('Please enter notes and select number of practice questions');
      return;
    }

    try {
      const prompt = `Generate ${cardNum} practice questions from the following notes. Format:
  Question 1:
  Q: [question]
  A: [answer]
  
  Notes:
  ${notesContent}`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      if (Platform.OS === 'web') {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `practice_questions_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.documentDirectory + `practice_questions_${Date.now()}.txt`;
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
      alert('Failed to generate or share practice questions.');
    }
  };

  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Your Notes</Text>

      {/* Input Fields */}

      <View style={[styles.addNoteContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
        <Text style={[styles.addNoteText, isDarkTheme ? styles.darkInput : styles.lightInput]}>Add Note</Text>
        <TouchableOpacity style={styles.addButton} testID='add-btn' onPress={async () => {
          await buttonPressSound();
          openCreateModal(true)
        }}>
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
          {['recent', 'oldest', 'alphabetical', 'ai'].map(option => (
            <TouchableOpacity
              key={option}
              onPress={async () => {
                await buttonPressSound
                setSortMethod(option)
              }}
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

      {/* Search Bar! */}
      <TextInput
        placeholder="Search notes..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
          width: '60%',
          backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFF',
          color: isDarkTheme ? '#FFF' : '#000',
        }}
        placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
      />

      {/* List of Notes */}
      <FlatList
        style={styles.listContainer}
        data={getSortedNotes()}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View key={item._id} style={[
            styles.notesItem,
            isDarkTheme ? styles.darkNoteItem : styles.lightNoteItem,
            item.isShared && styles.sharedNoteItem
          ]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                {item.isShared && (
                  <Icon name="people" size={16} color="green" style={{ marginRight: 5 }} />
                )}
                <Text style={[
                  styles.notesText,
                  { flexShrink: 1, overflow: 'hidden' },
                  isDarkTheme ? styles.darkText : styles.lightText
                ]}>
                  {item.name}
                </Text>
              </View>

              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 6
              }}>
              <Text style={{ fontSize: 12, color: isDarkTheme ? '#ccc' : '#555' }}>
                Last Modified: {new Date(item.lastEdited).toLocaleString()}
              </Text>

                <TouchableOpacity onPress={async () => {
                  await buttonPressSound();
                  setNotesName(item.name);
                  setNotesContent(item.content);
                  setObjId(item._id);
                  setSummary(item.summary || '');
                  setKeyConcepts(item.keyConcepts || []);
                  setCurrentNote(item);
                  openEditModal(true);
                }}>
                  <Icon name="edit" size={24} color="yellow" />
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  await buttonPressSound();
                  removeNote(item._id)
                }}>
                  <Icon name="delete" size={24} color="red" />
                </TouchableOpacity>
                <TouchableOpacity testID={`test-btn-${item.name}`} onPress={async () => {
                  await buttonPressSound();
                  setNotesName(item.name);
                  setNotesContent(item.content);
                  setObjId(item._id);
                  openFlashModal(true);
                }}>
                  <Icon name="style" size={24} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`share-btn-${item.name}`}
                  onPress={async () => {
                    await buttonPressSound();
                    setSelectedNoteForShare(item._id);
                    fetchSharedUsers(item._id);
                    setShareModal(true);
                  }}
                >
                  <Icon name="share" size={24} color="green" />
                </TouchableOpacity>
                </View>
          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={async () => {
          await buttonPressSound();
          router.push('/home')
        }}>
          <Text style={styles.buttonText}>Return to Classes</Text>
        </TouchableOpacity>
      </View>

      {/* Share Note Modal */}
      <Modal visible={shareModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Note</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter email to share with"
              value={shareEmail}
              onChangeText={(text) => {
                setShareEmail(text);
                setShareError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {shareError ? (
              <Text style={styles.errorText}>{shareError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={async () => {
                await buttonPressSound();
                handleShareNote()
              }}
            >
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>

            {/* List of users the note is shared with */}
            <Text style={styles.sharedWithTitle}>Shared with:</Text>
            <ScrollView style={styles.sharedUsersScroll}>
              {sharedUsers.length > 0 ? (
                sharedUsers.map((user, idx) => (
                  <View key={idx} style={styles.sharedUserItem}>
                    <Text style={styles.sharedUserEmail}>{user.email}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        await buttonPressSound();
                        handleUnshareNote(user.userId)
                      }}
                      style={styles.unshareButton}
                    >
                      <Icon name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noSharedUsersText}>Not shared with anyone yet</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={async () => {
                await buttonPressSound();
                setShareModal(false);
                setShareEmail('');
                setShareError('');
                setSelectedNoteForShare(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              onPress={async () => {
                await buttonPressSound();
                handleAddNote()
              }}>
              <Text style={styles.buttonText}>Create Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={async () => {
              await buttonPressSound();
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
              <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                <TouchableOpacity
                  style={{ padding: 0, marginTop: -5 }}
                  onPress={() => speakNoteContent(notesContent, objId)}
                >
                  <MaterialIcons
                    name={speakingNoteId === objId ? 'pause-circle-filled' : 'volume-up'}
                    size={28}
                    color="#007AFF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 0, marginTop: -5, marginLeft: 8 }}
                  onPress={async () => {
                    await buttonPressSound();
                    setVoiceSelectionModal(true);
                  }}
                >
                  <MaterialIcons
                    name="settings-voice"
                    size={24}
                    color="#007AFF"
                  />
                </TouchableOpacity>
              </View>

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
                await buttonPressSound();
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
                <Markdown style={{ body: { fontSize: 16, borderWidth: 1, width: '100%', padding: 10, borderWidth: 1, borderRadius: 5, marginBottom: 10, } }}>
                  {summary}
                </Markdown>
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#444' }]}
              onPress={async () => {
                await buttonPressSound();
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

            <TouchableOpacity style={styles.modalButton} onPress={async () => {
              await buttonPressSound();
              handleEditNote()
            }}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={async () => {
                await buttonPressSound();
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
            <Text style={styles.modalTitle}>Generate Study Materials</Text>

            {/* Mode Selection */}
            <View style={styles.generationTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.generationButton,
                  generationMode === 'flashcards' ? styles.activeGenerationButton : {}
                ]}
                onPress={async () => {
                  await buttonPressSound();
                  setGenerationMode('flashcards')
                }}
              >
                <Icon name="style" size={24} color={generationMode === 'flashcards' ? '#fff' : '#555'} />
                <Text style={[
                  styles.generationButtonText,
                  generationMode === 'flashcards' ? styles.activeGenerationText : {}
                ]}>Flashcards</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.generationButton,
                  generationMode === 'practice' ? styles.activeGenerationButton : {}
                ]}
                onPress={async () => {
                  await buttonPressSound();
                  setGenerationMode('practice')
                }}
              >
                <Icon name="help" size={24} color={generationMode === 'practice' ? '#fff' : '#555'} />
                <Text style={[
                  styles.generationButtonText,
                  generationMode === 'practice' ? styles.activeGenerationText : {}
                ]}>Practice Questions</Text>
              </TouchableOpacity>
            </View>

            {/* Number Selection */}
            <View style={styles.countSelectorContainer}>
              <Text style={styles.countLabel}>
                Number of {generationMode === 'flashcards' ? 'Flashcards' : 'Questions'}:
              </Text>

              <TouchableOpacity
                style={styles.countSelector}
                onPress={async () => {
                  await buttonPressSound();
                  setShowDropdown(!showDropdown)
                }}
              >
                <Text style={styles.countSelectorText}>
                  {cardNum || 'Select'}
                </Text>
                <Icon name={showDropdown ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Dropdown */}
            {showDropdown && (
              <ScrollView style={styles.dropdownContainer}>
                {Array.from({ length: 50 }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.dropdownItem}
                    onPress={async () => {
                      await buttonPressSound();
                      setCardNum(i + 1);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownText,
                      cardNum === (i + 1) ? styles.selectedDropdownText : {}
                    ]}>{i + 1}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActionContainer}>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={async () => {
                  await buttonPressSound();
                  if (generationMode === 'flashcards') {
                    handleFlashCards();
                  } else {
                    handlePracticeQuestions();
                  }
                }}
              >
                <Icon name="download" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.generateButtonText}>
                  Generate {generationMode === 'flashcards' ? 'Flashcards' : 'Practice Questions'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={async () => {
                  await buttonPressSound();
                  openFlashModal(false);
                  setNotesContent('');
                  setNotesName('');
                }}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>


            </View>

          </View>

        </View>
      </Modal>
      {/* Voice Selection Modal */}
      <Modal visible={voiceSelectionModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Voice</Text>

            <ScrollView style={styles.voiceListContainer}>
              {availableVoices.map((voice) => (
                <TouchableOpacity
                  key={voice.identifier}
                  style={[
                    styles.voiceItem,
                    selectedVoice === voice.identifier && styles.selectedVoiceItem
                  ]}
                  onPress={async () => {
                    await buttonPressSound();
                    setSelectedVoice(voice.identifier);
                    await AsyncStorage.setItem('selectedVoice', voice.identifier);
                  }}
                >
                  <MaterialIcons
                    name={selectedVoice === voice.identifier ? "radio-button-checked" : "radio-button-unchecked"}
                    size={24}
                    color={selectedVoice === voice.identifier ? "#007AFF" : "#666"}
                    style={{ marginRight: 10 }}
                  />
                  <View>
                    <Text style={styles.voiceName}>{voice.name}</Text>
                    <Text style={styles.voiceLanguage}>{voice.language}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={async () => {
                await buttonPressSound();
                setVoiceSelectionModal(false);
              }}
            >
              <Text style={styles.buttonText}>Done</Text>
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
    marginBottom: 10
  },
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
    marginBottom: 10
  },
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
  sharedWithTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    alignSelf: 'flex-start',
  },
  sharedUsersScroll: {
    width: '100%',
    maxHeight: 150,
    marginTop: 10,
  },
  sharedUserItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sharedUserEmail: {
    fontSize: 16,
  },
  unshareButton: {
    backgroundColor: '#ff6666',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSharedUsersText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  errorText: {
    color: '#ff3333',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 5,
    alignSelf: 'flex-start',
    fontWeight: '500',
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 5,
    borderRadius: 5,
  },
  selectedType: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontWeight: '500',
  },
  selectionText: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontSize: 16,
  },
  generationTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
    marginTop: 10,
  },
  generationButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 8,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activeGenerationButton: {
    backgroundColor: '#007AFF',
  },
  generationButtonText: {
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
    color: '#555',
  },
  activeGenerationText: {
    color: '#fff',
  },
  countSelectorContainer: {
    flexDirection: 'column',
    width: '100%',
    marginBottom: 20,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  countSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  countSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDropdownText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalActionContainer: {
    width: '100%',
    marginTop: 10,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
  cancelModalButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
  voiceListContainer: {
    width: '100%',
    maxHeight: 300,
    marginVertical: 10,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedVoiceItem: {
    backgroundColor: '#f0f7ff',
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  voiceLanguage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

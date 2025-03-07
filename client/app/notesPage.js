import React, { useEffect, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../components/ThemeContext'; // Import dark mode hook

export default function NotesPage() {
  const router = useRouter();
  const { isDarkTheme } = useTheme(); // Get dark mode state
  const [notesName, setNotesName] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [token, setToken] = useState('');

  /** 🔹 Fetch notes from backend when the component mounts */
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const userToken = await AsyncStorage.getItem('token');
        setToken(userToken);

        if (!userToken) return;

        const response = await fetch('https://your-api.com/api/notes', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${userToken}` },
        });

        const data = await response.json();
        setNotes(data); // Store fetched notes in state
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };

    fetchNotes();
  }, []);

  /** 🔹 Add a new note */
  const handleAddNotes = async () => {
    if (notesName.trim() && notesContent.trim()) {
      try {
        const newNote = { name: notesName, content: notesContent };

        const response = await fetch('https://your-api.com/api/notes', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newNote),
        });

        const data = await response.json();
        setNotes([...notes, data]); // Update state with new note
        setNotesName('');
        setNotesContent('');
      } catch (error) {
        console.error("Error adding note:", error);
      }
    }
  };

  /** 🔹 Delete a note */
  const removeNotes = async (id) => {
    try {
      await fetch(`https://your-api.com/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      setNotes(notes.filter((note) => note._id !== id)); // Remove note from state
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Your Notes</Text>

      {/* Input Fields */}
      <View style={[styles.inputContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
        <TextInput
          style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
          placeholder="Note Title"
          placeholderTextColor={isDarkTheme ? "#AAA" : "#666"}
          value={notesName}
          onChangeText={setNotesName}
        />
        <TextInput
          style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
          placeholder="Enter your note..."
          placeholderTextColor={isDarkTheme ? "#AAA" : "#666"}
          value={notesContent}
          onChangeText={setNotesContent}
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddNotes}>
          <Icon name="add-circle" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* List of Notes */}
      <FlatList
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
          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/home')}>
          <Text style={styles.buttonText}>Return to Classes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  addButton: {
    backgroundColor: '#1D3D47',
    padding: 10,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
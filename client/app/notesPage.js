import React, { useContext, useEffect, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";

export default function notesPage() {
  const router = useRouter();
  const [notesName, setNotesName] = useState('');
  const [notes, setNotes] = useState([]);

  const removeSelected = () => {
    setNotes(notes.filter((c) => (c.added === false)));
  }
  const handleAddNotes = () => {
    if (notesName.trim()) {
      setNotes([...notes, { id: Date.now().toString(), name: notesName, added: false }]);
      setNotesName('');
    }
  };

  const toggleNoteAdded = (id) => {
    setNotes(notes.map((c) => (c.id === id ? { ...c, added: !c.added } : c)));
  };

  const removeNotes = (id) => {
    setNotes(notes.filter((c) => c.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Notes</Text>

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter notes name..."
          placeholderTextColor="#999"
          value={notesName}
          onChangeText={setNotesName}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddNotes}>
          <Icon name="add-circle" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.notesItem}>
            <TouchableOpacity onPress={() => toggleNoteAdded(item.id)} style={styles.notesTextContainer}>
              <Icon
                name={item.added ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={item.added ? 'green' : 'gray'}
                style={styles.icon}
              />
              <Text style={[styles.notesText, item.added && styles.completedNotes]}>
                {item.name}
              </Text>
            </TouchableOpacity>
            <View style={styles.notesButtons}>
              <TouchableOpacity onPress={() => removeNotes(item.id)}>
                <Icon name="edit" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeNotes(item.id)}>
                <Icon name="delete" size={24} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => removeSelected()}>
          <Text style={styles.buttonText}>Delete Selected</Text>
        </TouchableOpacity>
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
    backgroundColor: "#f8f8f8"
  },
  buttonContainer: {
    flexDirection: 'row',  
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20, 
  },
  button: {
    marginLeft: '1%',
    marginRight: '1%',
    backgroundColor: '#007AFF',
    paddingVertical: 12, 
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#005BBB',
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  notesButtons: {
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#000',
  },
  addButton: {
    backgroundColor: '#1D3D47',
    padding: 10,
    borderRadius: 50,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  notesTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  completedNotes: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  icon: {
    marginRight: 8,
  },
});
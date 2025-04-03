import React, { useContext, useEffect, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import { API_URL } from '@env';
import { useTheme } from '../components/ThemeContext'; 

export default function AddClass() {
  const router = useRouter();
  const { isDarkTheme } = useTheme();
  const [className, setClassName] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [classes, setClasses] = useState([]);
  const [credits, setCredits] = useState('');

  const handleAddClass = () => {
    if (!className.trim()) {
      console.error("Class name cannot be empty.");
      setErrMsg('Class name cannot be empty');
      return;
    }
    const credNum = Number(credits);
    if (!Number.isInteger(credNum) || credits <= 0) {
      console.error("Credits must be a valid positive integer.");
      setErrMsg('Credits must be a valid positive integer');
      return;
    }
    setClasses([...classes, { 
      id: Date.now().toString(), 
      name: className, 
      credits,
      userId: `test Id + ${credits}`,
      added: false 
    }]);

    setClassName('');
    setCredits('');
    setErrMsg('');
  };

  const toggleClassAdded = (id) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, added: !c.added } : c)));
  };

  const removeClass = (id) => {
    setClasses(classes.filter((c) => c.id !== id));
  };

  const addAllClassesToDatabase = async () => {
    try {
      for (const classObj of classes) {
        const newClass = { 
          name: classObj.name,
          credits: classObj.credits,
          userId: classObj.userId,
        };

        const response = await fetch(`${API_URL}/classes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newClass),
        });

        if (!response.ok) {
          console.log("sumn happened with the fetch");
          throw new Error(`Failed to add class: ${classObj.name}`);
        }
        console.log(`Successfully added class: ${classObj.name}`);
      }

      setClasses([]);
    } catch (error) {
      console.error('Error adding classes:', error);
      setErrMsg("Error sending classes to database");
      setClasses([]);
    }
  };

  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Add Classes</Text>
      <Text style={[styles.errText, isDarkTheme ? styles.darkText : styles.lightText]}>{errMsg}</Text>

      {/* Input Fields */}
      <View style={[styles.inputContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
        <TextInput
          style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
          placeholder="Enter class name..."
          placeholderTextColor={isDarkTheme ? "#AAA" : "#666"}
          value={className}
          onChangeText={setClassName}
        />
        <TextInput
          style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
          placeholder="Enter class credits..."
          placeholderTextColor={isDarkTheme ? "#AAA" : "#666"}
          value={credits}
          onChangeText={setCredits}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddClass}>
          <Icon name="add-circle" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.classItem}>
            <TouchableOpacity onPress={() => toggleClassAdded(item.id)} style={styles.classTextContainer}>
              <Icon
                name={item.added ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={item.added ? 'green' : 'gray'}
                style={styles.icon}
              />
              <Text style={[styles.classText, item.added && styles.completedClass, isDarkTheme ? styles.darkText : styles.lightText]}>
                Name: {item.name} --- Credits: {item.credits}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeClass(item.id)}>
              <Icon name="delete" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={addAllClassesToDatabase}>
          <Text style={styles.buttonText}>Save Changes</Text>
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
  },
  buttonContainer: {
    flexDirection: 'row',  
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    marginHorizontal: 5,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#005BBB',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    borderRadius: 8,
  },
  addButton: {
    backgroundColor: '#1D3D47',
    padding: 10,
    borderRadius: 50,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  classTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classText: {
    fontSize: 16,
  },
  completedClass: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  icon: {
    marginRight: 8,
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
});
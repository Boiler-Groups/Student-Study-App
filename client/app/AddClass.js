import React, { useContext, useEffect, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import { API_URL } from '@env';

export default function AddClass() {
  const router = useRouter();
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
      setErrMsg('Credits must be a valid positive integer')
      return;
    }
      setClasses([...classes, { id: Date.now().toString(), name: className, 
        credits,
        userId: `test Id + ${credits}`,
        added: false }]);

      setClassName('');
      setCredits(0);
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
            // Make JSON format of Class Object for mongoDB
            const newClass = {
                name: classObj.name,
                credits: classObj.credits,
                userId: classObj.userId,
            };

            // Send a POST request to add the class to the database
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

        setClasses({});
    } catch (error) {
        console.error('Error adding classes:', error);
        setErrMsg("Error sending classes to database");
        setClasses({});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Classes</Text>
      <Text style={styles.errText}>{errMsg}</Text>
      {/* Input Field */}
      <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter class name..."
            placeholderTextColor="#999"
            value={className}
            onChangeText={setClassName}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter class credits..."
            placeholderTextColor="#999"
            value={credits}
            onChangeText={setCredits}
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
              <Text style={[styles.classText, item.added && styles.completedClass]}>
                Name:{item.name}   ---   Credits:{item.credits}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeClass(item.id)}>
              <Icon name="delete" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      /> 
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => addAllClassesToDatabase()}>
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
    backgroundColor: "#f8f8f8"
  },
  errText: {
    color: 'red',
    marginTop: 2,
    marginBottom: 2,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',  
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20, 
  },
  inputTexts: {
    flex: 0.95,
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
    width: "100%",
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: '#000',
    border: "2px solid black",
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
    borderBottomColor: '#ddd',
  },
  classTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  completedClass: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  icon: {
    marginRight: 8,
  },
});

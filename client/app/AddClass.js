import React, { useContext, useEffect, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from "expo-router";
import { API_URL } from '@env';
import { useTheme } from '../components/ThemeContext';
import ical from 'ical.js';

export default function AddClass() {
  const router = useRouter();
  const { isDarkTheme } = useTheme();
  const [className, setClassName] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [classes, setClasses] = useState([]);
  const [credits, setCredits] = useState('');
  const [calendarUrl, setCalendarUrl] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const handleAddClass = () => {
    if (!className.trim()) {
      console.error("Class name cannot be empty.");
      setErrMsg('Class name cannot be empty');
      return;
    }

    const credNum = Number(credits);
    if (!Number.isInteger(credNum) || credNum <= 0) {
      console.error("Credits must be a valid positive integer.");
      setErrMsg('Credits must be a valid positive integer');
      return;
    }

    setClasses([...classes, {
      id: Date.now().toString(),
      name: className.trim(),
      credits: credNum,
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
        if (!classObj.added) {
          continue;
        }
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
      setSuccessModalVisible(true);
      setClasses([]);
    } catch (error) {
      console.error('Error adding classes:', error);
      setErrMsg("Error sending classes to database");
      setClasses([]);
    }
  };

  const fetchICalendar = async () => {
    if (!calendarUrl.trim()) {
      setErrMsg('Please enter a valid iCalendar URL.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/classes/cal?url=${encodeURIComponent(calendarUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch iCalendar file.');

      const icalData = await response.text();
      const jcalData = ical.parse(icalData);
      const comp = new ical.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const newClasses = vevents
        .map(event => {
          const summary = event.getFirstPropertyValue('summary') || 'Unknown Class';
          const dtstart = event.getFirstPropertyValue('dtstart'); // Start date

          if (!dtstart) return null; // Skip if no start date

          const eventDate = new Date(dtstart.toJSDate());
          if (eventDate.getFullYear() !== currentYear) {
            return null; // Skip if not in the current month
          }

          // Extract only the first two words from the summary
          const className = summary.split(" ").slice(0, 2).join(" ");

          return { id: className, name: className, credits: 3, userId: "-" };
        })
        .filter(Boolean); // Remove null values

      setClasses(prevClasses => {
        const existingClassNames = new Set(prevClasses.map(cls => cls.name));

        // Filter out duplicates within newClasses and also against existing classes
        const uniqueNewClasses = [];
        const seenClassNames = new Set();

        for (const cls of newClasses) {
          if (!existingClassNames.has(cls.name) && !seenClassNames.has(cls.name)) {
            seenClassNames.add(cls.name);
            uniqueNewClasses.push(cls);
          }
        }

        return [...prevClasses, ...uniqueNewClasses];
      });

      setErrMsg('');
    } catch (error) {
      console.error('Error fetching iCalendar:', error);
      setErrMsg('Error fetching schedule. Please check the URL.');
    }
  };


  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Add Classes</Text>
      <Text style={[styles.errText, isDarkTheme ? styles.darkText : styles.lightText]}>{errMsg}</Text>

      <View style={[styles.inputContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
        <TextInput
          style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
          placeholder="Enter iCalendar URL..."
          placeholderTextColor={isDarkTheme ? "#AAA" : "#666"}
          value={calendarUrl}
          onChangeText={setCalendarUrl}
        />
        <TouchableOpacity style={styles.addButton} onPress={fetchICalendar}>
          <Icon name="cloud-download" size={30} color="white" />
        </TouchableOpacity>
      </View>

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
      {/*Success Modal*/}
      <Modal visible={successModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Classes Updated Successfully!</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setSuccessModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cancelButton: {
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    marginTop: 20, // Space between Create Group and Cancel button
    alignItems: 'center',
    width: '80%', // Ensure buttons have the same width
  },
});
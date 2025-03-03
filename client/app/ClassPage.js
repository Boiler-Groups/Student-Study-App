import React, { useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ClassPage({ navigation }) { // Accept navigation prop
  const [className, setClassName] = useState('');
  const [classes, setClasses] = useState([]);

  const addClass = () => {
    if (className.trim()) {
      setClasses([...classes, { id: Date.now().toString(), name: className, added: false }]);
      setClassName('');
    }
  };

  const toggleClassAdded = (id) => {
    setClasses(classes.map((c) => (c.id === id ? { ...c, added: !c.added } : c)));
  };

  const removeClass = (id) => {
    setClasses(classes.filter((c) => c.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Class List</Text>

      {/* Input Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter class name..."
          placeholderTextColor="#999"
          value={className}
          onChangeText={setClassName}
        />
        <TouchableOpacity style={styles.addButton} onPress={addClass}>
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
                {item.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeClass(item.id)}>
              <Icon name="delete" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f8f8"
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

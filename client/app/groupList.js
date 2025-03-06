import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../components/ThemeContext'; 
import Header from '../components/Header';

const grouplist = [
  { id: 1, name: 'Math Study Group' },
  { id: 2, name: 'Science Study Group' },
  { id: 3, name: 'History Study Group' },
  { id: 4, name: 'Test Study Group 4' }
];

export default function GroupList() {
  const { isDarkTheme } = useTheme(); 

  return (
    <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Header />
      <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Study Groups</Text>
      <FlatList
        data={grouplist}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.groupItem, isDarkTheme ? styles.darkItem : styles.lightItem]}>
            <Text style={[styles.groupText, isDarkTheme ? styles.darkText : styles.lightText]}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80, // Adjusted for header spacing
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  groupItem: {
    width: '100%',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
    transition: 'background-color 0.3s, color 0.3s',
  },
  groupText: {
    fontSize: 18,
    fontWeight: '500',
  },
  /* Light Mode Styles */
  lightBackground: {
    backgroundColor: '#f9f9f9',
  },
  lightText: {
    color: '#333',
  },
  lightItem: {
    backgroundColor: '#ffffff',
  },
  /* Dark Mode Styles */
  darkBackground: {
    backgroundColor: '#121212',
  },
  darkText: {
    color: '#f1f1f1',
  },
  darkItem: {
    backgroundColor: '#1e1e1e',
  },
});

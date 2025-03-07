import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import SettingsModal from './SettingsPopup';
import { useTheme } from './ThemeContext';

export default function Header() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const { isDarkTheme } = useTheme();

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <View style={[styles.header, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
      <Text style={[styles.headerText, isDarkTheme ? styles.darkText : styles.lightText]}>Boiler Groups</Text>
      <TouchableOpacity style={styles.settingsButton} onPress={openModal}>
        <Icon name="settings-outline" size={30} color={isDarkTheme ? "#F4E4B9" : "#CEB888"} />
      </TouchableOpacity>
      <SettingsModal visible={modalVisible} onClose={closeModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  darkBackground: {
    backgroundColor: '#121212',
  },
  lightBackground: {
    backgroundColor: 'black',
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#F4E4B9',
  },
  lightText: {
    color: '#CEB888',
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    top: 15,
  },
});

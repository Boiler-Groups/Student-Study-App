import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import SettingsModal from './SettingsPopup';

export default function Header() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>Boiler Groups</Text>
      <TouchableOpacity style={styles.settingsButton} onPress={openModal}>
        <Icon name="settings-outline" size={30} color="#CEB888" />
      </TouchableOpacity>
      <SettingsModal visible={modalVisible} onClose={closeModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 60,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  headerText: {
    color: '#CEB888',
    fontSize: 30,
    fontWeight: 'bold',
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    top: 15,
  },
});

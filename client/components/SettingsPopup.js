import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, Switch } from 'react-native';
import { useTheme } from './ThemeContext';

const { width } = Dimensions.get('window');

export default function SettingsModal({ visible, onClose }) {
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const { isDarkTheme, toggleTheme } = useTheme();

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: width * 0.8, 
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal animationType="none" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
          <Text style={[styles.modalTitle, isDarkTheme ? styles.darkText : styles.lightText]}>Settings</Text>
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, isDarkTheme ? styles.darkText : styles.lightText]}>Dark Theme</Text>
            <Switch value={isDarkTheme} onValueChange={toggleTheme} />
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '20%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  lightBackground: {
    backgroundColor: 'white',
  },
  darkBackground: {
    backgroundColor: '#121212',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  settingText: {
    fontSize: 18,
  },
  lightText: {
    color: 'black',
  },
  darkText: {
    color: 'white',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

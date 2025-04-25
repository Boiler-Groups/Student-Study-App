import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../components/ThemeContext';
import { buttonPressSound } from '../sounds/soundUtils.js';

export default function Landing() {
    const router = useRouter();
    const { isDarkTheme } = useTheme();

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/login');
    };

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <Header />
            <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>
                Welcome to Boiler Groups
            </Text>
            <TouchableOpacity 
                style={styles.button} 
                onPress={async() => {
                    await buttonPressSound();
                    router.push('/home')
                }}
            >
                <Text style={styles.buttonText}>My Classes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={styles.button} 
                onPress={async () => {
                    await buttonPressSound();
                    router.push('/profile')
                }}
            >
                <Text style={styles.buttonText}>Account Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.button, styles.logoutButton]} 
                onPress={async()=>{
                    await buttonPressSound();
                    handleLogout()
                }}
            >
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    title: { 
        fontSize: 28, 
        marginBottom: 20 
    },
    button: { 
        backgroundColor: '#007AFF',
        padding: 10, 
        borderRadius: 5,
        width: '25%',
        alignItems: 'center',
        marginBottom: 10
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        marginTop: 10
    },
    buttonText: { 
        color: '#FFF',
        fontSize: 16, 
    },

    /* Light Mode Styles */
    lightBackground: {
        backgroundColor: "#FFFFFF",
    },
    lightText: {
        color: "#333",
    },

    /* Dark Mode Styles */
    darkBackground: {
        backgroundColor: "#121212",
    },
    darkText: {
        color: "#F1F1F1",
    },
});


import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext'; 
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Register() {
    const router = useRouter();
    const { isDarkTheme } = useTheme(); 
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Email validation function
    const validateEmail = (email) => {
        return /(.+)@(.+){2,}\.(.+){2,}/.test(email);
    };

    const handleRegister = async () => {
        setLoading(true);
        setErrorMessage('');


        console.log(`URL: ${process.env.API_URL}`);

        if (!validateEmail(email)) {
            setErrorMessage('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('token', data.token);
                router.push('/landing');
            } else {
                setErrorMessage('Registration failed. User already exists.');
            }
        } catch (error) {
            setErrorMessage('Registration failed. User already exists.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View
            style={[
                styles.container,
                isDarkTheme ? styles.darkBackground : styles.lightBackground,
            ]}
        >
            <Header />
            <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>
                Register
            </Text>

            {errorMessage ? (
                <Text style={[styles.errorText, isDarkTheme ? styles.darkError : null]}>
                    {errorMessage}
                </Text>
            ) : null}

            <TextInput
                style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                placeholder="Display Name"
                placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                value={username}
                onChangeText={setUsername}
            />

            <TextInput
                style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                placeholder="Email"
                placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
            />

            <TextInput
                style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                placeholder="Password"
                placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            />

            <TouchableOpacity
                style={[styles.button, isDarkTheme ? styles.darkButton : styles.lightButton]}
                onPress={handleRegister}
                disabled={loading}
            >
                <Text style={[styles.buttonText, isDarkTheme ? styles.darkButtonText : null]}>
                    {loading ? 'Registering...' : 'Register'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={[styles.link, isDarkTheme ? styles.darkLink : null]}>
                    Already have an account? Login
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 15,
    },
    input: {
        width: "25%",
        height: 40,
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    button: {
        width: "25%",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginBottom: 10,
    },
    buttonText: {
        fontSize: 16,
    },
    link: {
        marginTop: 5,
        color: "#007AFF",
    },
    errorText: {
        marginBottom: 10,
        color: "red",
    },

    /* Light Mode Styles */
    lightBackground: {
        backgroundColor: "#FFFFFF",
    },
    lightText: {
        color: "#333",
    },
    lightInput: {
        backgroundColor: "#FFF",
        borderColor: "#CCC",
        color: "#333",
    },
    lightButtonText: {
        color: "#FFF",
    },
    lightButton: {
        backgroundColor: "#007AFF",
    },

    /* Dark Mode Styles */
    darkBackground: {
        backgroundColor: "#121212",
    },
    darkText: {
        color: "#F1F1F1",
    },
    darkInput: {
        backgroundColor: "#1E1E1E",
        borderColor: "#555",
        color: "#F1F1F1",
    },
    darkButton: {
        backgroundColor: "#007AFF",
    },
    darkButtonText: {
        color: "#FFF",
    },
    darkLink: {
        color: "#007AFF",
    },
    darkError: {
        color: "#FF7F7F",
    },
});


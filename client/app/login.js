import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "./AuthContext";
import Header from "../components/Header";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from "../components/ThemeContext";
import { buttonPressSound } from '../sounds/soundUtils.js';

export default function Login() {
    const router = useRouter();
    const { user, login } = useContext(AuthContext);
    const { isDarkTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [enteredPassword, setEnteredPassword] = useState('');
    const [requiresMFA, setRequiresMFA] = useState(false);
    const [tempEmail, setTempEmail] = useState('');
    const [modalErrorMessage, setModalErrorMessage] = useState("");

    const handleLogin = async () => {
        setErrorMessage("");
        try {
            console.log(`API_URL: ${process.env.API_URL}`)
            console.log(`Test: ${process.env.TEST}`)
            const response = await fetch(`${process.env.API_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok && data.token) { 
                await AsyncStorage.setItem('token', data.token);
                router.replace('/home');
            } else if(data.message === "MFA code sent to email") {
                setTempEmail(email);
                setModalVisible(true);
                setRequiresMFA(true);
            } else {
                setErrorMessage("Invalid credentials");
            }
        } catch (error) {
            console.log(error);
            setErrorMessage("Login failed. Please try again.");
        }
    };

    const handlePasswordVerification = async () => {
        setErrorMessage('');
        try {
          const res = await fetch(`${process.env.API_URL}/users/mfa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: tempEmail, code: enteredPassword }),
          });
      
          const data = await res.json();
      
          if (res.ok) {
            await AsyncStorage.setItem('token', data.token);
            setModalVisible(false);
            router.push('/home');
          } else {
            if (data.message === "Expired MFA code") {
                setModalErrorMessage('Your MFA code has expired. Please request a new one.');
              } else {
                setModalErrorMessage('Invalid MFA code. Please try again.');
              }
          }
        } catch (err) {
          console.error(err);
          setModalErrorMessage('Failed to verify code');
        }
      };

      resendMFAVerification  = async () => {
        setErrorMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.API_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: tempEmail, password }),
            });

            const data = await response.json();

            if (response.ok && data.message === "MFA code sent to email") {
                setModalErrorMessage("MFA code resent to email.");
            } else {
                setModalErrorMessage("Failed to resend MFA code.");
            }
        } catch (error) {
            console.error(error);
            setModalErrorMessage("Error resending MFA code.");
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
                Login
            </Text>

            {errorMessage ? (
                <Text style={[styles.errorText, isDarkTheme ? styles.darkError : null]}>
                    {errorMessage}
                </Text>
            ) : null}

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
                onPress={async ()=>{
                    await buttonPressSound();
                    handleLogin()
                }}
                disabled={loading}
            >
                <Text style={[styles.buttonText, isDarkTheme ? styles.darkButtonText : styles.lightButtonText]}>
                    {loading ? "Logging in..." : "Login"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={async() => {
                await buttonPressSound();
                router.push("/register")
            }}>
                <Text style={[styles.link, isDarkTheme ? styles.darkLink : null]}>
                    Don't have an account? Register
                </Text>
            </TouchableOpacity>

            {/* Modal for MFA Confirmation */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Multi-Factor Verification</Text>
                        <Text style={styles.modalMessage}>
                            Enter the password sent to your email.
                        </Text>

                        {modalErrorMessage ? (
                            <Text style={[styles.errorText, isDarkTheme ? styles.darkError : null]}>
                                {modalErrorMessage}
                            </Text>
                        ) : null}


                        {/* Input Field for Password */}
                        <TextInput
                            style={styles.input}
                            placeholder="Enter password"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={enteredPassword}
                            onChangeText={setEnteredPassword}
                        />

                        {/* Button Container */}
                        <View style={styles.buttonContainer}>
                            {/* Verify Button */}
                            <TouchableOpacity
                                style={styles.buttonModal}
                                onPress={async () => {
                                    await buttonPressSound()
                                    handlePasswordVerification()
                                }}
                            >
                                <Text style={styles.buttonTextModal}>Verify</Text>
                            </TouchableOpacity>

                            {/* Resend MFA Button */}
                            <TouchableOpacity
                                style={[styles.buttonModal, styles.resendButton]} // Green for Resend button
                                onPress={async ()=> {
                                    await buttonPressSound()
                                    resendMFAVerification()
                                }}
                            >
                                <Text style={styles.buttonTextModal}>Send Email Again</Text>
                            </TouchableOpacity>

                            {/* Close Button */}
                            <TouchableOpacity
                                style={[styles.buttonModal, styles.closeButton]} // Red for Close button
                                onPress={async () => {
                                    await buttonPressSound()
                                    setModalVisible(false)
                                    setModalErrorMessage("");
                                    setLoading(false);
                                }} // Close the modal
                            >
                                <Text style={styles.buttonTextModal}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker semi-transparent overlay
    },
    modalContent: {
        backgroundColor: '#ffffff',
        padding: 25,
        borderRadius: 15,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6, // Android shadow
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        color: '#555',
        marginBottom: 20,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'column', // Stack buttons vertically
        justifyContent: 'space-between', // Distribute buttons with space
        alignItems: 'center', // Center the buttons horizontally
        marginTop: 20, // Add space between modal content and buttons
    },
    buttonModal: {
        backgroundColor: '#007AFF', // A fresh blue for the confirmation button
        padding: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25, // Rounded button for a smoother UI
        alignItems: 'center',
        width: '80%',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5, // Android shadow
        marginBottom: 10, // Add space between buttons
    },
    buttonTextModal: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5, // Subtle spacing for elegance
    },

    closeButton: {
        backgroundColor: '#dc3545', // Red for close button
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
});


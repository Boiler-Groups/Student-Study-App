import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Modal} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext'; 
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import emailjs from '@emailjs/browser'
import { buttonPressSound } from '../sounds/soundUtils.js';

export default function Register() {
    const router = useRouter();
    const { isDarkTheme } = useTheme(); 
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [enteredPassword, setEnteredPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailConfirmationVisible, setEmailConfirmationVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');


    // Email validation function
    const validateEmail = (email) => {
        return /(.+)@(.+){2,}\.(.+){2,}/.test(email);
    };

    const generateRandomNumber = () => {
        //Generate a 6 Digit random number
        return Math.floor(100000 + Math.random() * 900000);
    }
    const handlePasswordVerification = () => {
        if (enteredPassword === generatedPassword) {
            alert("Verification Successful!");
            setEmailConfirmationVisible(false);
            handleRegister()
        } else {
            alert("Incorrect Password! Please try again.");
        }
    };
    const sendEmailVerification = async () => {
        setLoading(true);
        setErrorMessage('');

        if (!username.trim()) {
            setErrorMessage('Please enter a display name.');
            setLoading(false);
            return;
        }

        if (!email.trim()) {
            setErrorMessage('Please enter an email address.');
            setLoading(false);
            return;
        }

        if (!password.trim()) {
            setErrorMessage('Please enter a password.');
            setLoading(false);
            return;
        }

        console.log(`URL: ${process.env.API_URL}`);

        if (!validateEmail(email)) {
            setErrorMessage('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        //Generate the random number
        const verificationCode= generateRandomNumber() +"";
        setGeneratedPassword(verificationCode);
        const templateParams = {
            profile_picture: "https://i.postimg.cc/SxcCTLVw/Black-And-Gold-B.png",
            from_name: "The Boiler Groups Team",
            message: "I hope you are doing well! To complete your account creation" +
                     ` please verify your email by using the following code:`,
            user_email: email,// Assuming 'email' is correctly storing your address
            verification_code: verificationCode
        };
        console.log("Sending email to:", email);
        emailjs.send(
            'service_fz5wj75',         // EmailJS service ID
            'template_ve7d89h',       // EmailJS template ID
            templateParams,                     // Passing the email data
            'OreI37Gghlx1o2OXY'         // Your EmailJS user ID
        ).then((response) => {
            console.log("Email sent successfully!", response);
            setEmailConfirmationVisible(true);
        }).catch((error) => {
            console.error("Failed to send email:", error);
        });
    };

    const handleRegister = async () => {

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
                onPress={async ()=>{
                    await buttonPressSound()
                    sendEmailVerification()
                }}
                disabled={loading}
            >
                <Text style={[styles.buttonText, isDarkTheme ? styles.darkButtonText : null]}>
                    {loading ? 'Registering...' : 'Register'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={async () => {
                await buttonPressSound()
                router.push('/login')
            }}>
                <Text style={[styles.link, isDarkTheme ? styles.darkLink : null]}>
                    Already have an account? Login
                </Text>
            </TouchableOpacity>

            {/* Modal for Email Confirmation */}
            <Modal visible={emailConfirmationVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Email Verification</Text>
                        <Text style={styles.modalMessage}>
                            Enter the password sent to your email.
                        </Text>

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

                            {/* Resend Email Button */}
                            <TouchableOpacity
                                style={[styles.buttonModal, styles.resendButton]} // Green for Resend button
                                onPress={async ()=> {
                                    await buttonPressSound()
                                    sendEmailVerification()
                                }}// Resend the email verification code
                            >
                                <Text style={styles.buttonTextModal}>Send Email Again</Text>
                            </TouchableOpacity>

                            {/* Close Button */}
                            <TouchableOpacity
                                style={[styles.buttonModal, styles.closeButton]} // Red for Close button
                                onPress={async () => {
                                    await buttonPressSound()
                                    setEmailConfirmationVisible(false)
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


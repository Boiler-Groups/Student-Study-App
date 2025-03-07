import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '@env';
import { useTheme } from '../components/ThemeContext';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
    const router = useRouter();
    const { isDarkTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [usernameModalVisible, setUsernameModalVisible] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            // server fix console.log(`test: ${process.env.TEST}`);
            const response = await fetch(`${API_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log("User data received:", userData);
                setUser(userData);
                setNewUsername(userData.username);
            } else {
                console.log("Failed to get user data:", await response.text());
                await AsyncStorage.removeItem('token');
                router.push('/login');
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setMessage({ text: 'Failed to load user data', isError: true });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            setMessage({ text: 'Display name cannot be empty', isError: true });
            return;
        }

        await updateUser({ username: newUsername });
        setUsernameModalVisible(false);
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            setMessage({ text: 'Please fill in both password fields', isError: true });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ text: 'Passwords do not match', isError: true });
            return;
        }

        await updateUser({ password: newPassword });
        setNewPassword('');
        setConfirmPassword('');
        setPasswordModalVisible(false);
    };

    const updateUser = async (updateData) => {
        setUpdating(true);
        setMessage({ text: '', isError: false });

        try {
            const token = await AsyncStorage.getItem('token');

            console.log("Token available:", !!token);
            console.log("User ID:", user?._id);

            if (!token) {
                throw new Error('Authentication token missing');
            }

            if (!user?._id) {
                throw new Error('User ID not available');
            }

            const response = await fetch(`${API_URL}/users/${user?._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const responseData = await response.json();
            console.log("Update response:", responseData);

            if (response.ok) {
                setMessage({
                    text: updateData.username
                        ? 'Display name updated successfully'
                        : 'Password updated successfully',
                    isError: false
                });

                if (updateData.username) {
                    setUser(prev => ({ ...prev, username: updateData.username }));
                }
            } else {
                setMessage({ text: responseData.message || 'Update failed', isError: true });
            }
        } catch (error) {
            console.error("Update error:", error);
            setMessage({ text: 'Update failed: ' + error.message, isError: true });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
                <Header />
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={isDarkTheme ? styles.darkText : styles.lightText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <Header />
            <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>My Account Settings</Text>

            {message.text ? (
                <Text style={message.isError ? styles.errorText : styles.successText}>
                    {message.text}
                </Text>
            ) : null}

            <View style={styles.infoContainer}>
            <Text style={[styles.label, isDarkTheme ? styles.darkText : styles.lightText]}>Email:</Text>
                <Text style={[styles.value, isDarkTheme ? styles.darkText : styles.lightText]}>
                    {user?.email || 'Not available'}
                </Text>

                <Text style={[styles.label, isDarkTheme ? styles.darkText : styles.lightText]}>Display Name:</Text>
                <Text style={[styles.value, isDarkTheme ? styles.darkText : styles.lightText]}>
                    {user?.username || 'Not available'}
                </Text>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setUsernameModalVisible(true)}
                >
                    <Text style={styles.buttonText}>Change Display Name</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setPasswordModalVisible(true)}
                >
                    <Text style={styles.buttonText}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={() => router.push('/landing')}
                >
                    <Text style={styles.buttonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>

            <Modal transparent={true} visible={usernameModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkTheme ? styles.darkModal : styles.lightModal]}>
                        <Text style={[styles.modalTitle, isDarkTheme ? styles.darkText : styles.lightText]}>
                            Change Display Name
                        </Text>

                        <TextInput
                            style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                            placeholder="New Display Name"
                            placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                            value={newUsername}
                            onChangeText={setNewUsername}
                        />

                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setUsernameModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={() => {}}>
                                <Text style={styles.buttonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal transparent={true} visible={passwordModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkTheme ? styles.darkModal : styles.lightModal]}>
                        <Text style={[styles.modalTitle, isDarkTheme ? styles.darkText : styles.lightText]}>
                            Change Password
                        </Text>

                        <TextInput
                            style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                            placeholder="New Password"
                            placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                            value={newPassword}
                            secureTextEntry
                            onChangeText={setNewPassword}
                        />

                        <TextInput
                            style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                            placeholder="Confirm New Password"
                            placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                            value={confirmPassword}
                            secureTextEntry
                            onChangeText={setConfirmPassword}
                        />

                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setPasswordModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={() => {}}>
                                <Text style={styles.buttonText}>Update</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15
    },
    infoContainer: {
        width: '25%',
        marginBottom: 20,
        paddingVertical: 10,
    },
    actionsContainer: {
        width: '25%',
        marginBottom: 20,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
        width: '100%',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        flex: 1,
    },
    backButton: {
        backgroundColor: '#6c757d',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
    },
    successText: {
        color: 'green',
        marginBottom: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '30%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
        gap: 10,
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
    },
    /* Dark Mode */
    darkBackground: { backgroundColor: "#121212" },
    darkText: { color: "#F1F1F1" },
    darkModal: { backgroundColor: "#1E1E1E" },
    darkInput: { backgroundColor: "#333", borderColor: "#555", color: "#F1F1F1" },

    /* Light Mode */
    lightBackground: { backgroundColor: "#FFFFFF" },
    lightText: { color: "#333" },
    lightModal: { backgroundColor: "white" },
    lightInput: { backgroundColor: "#FFF", borderColor: "#CCC", color: "#333" },
});
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '@env';
import { useTheme } from '../components/ThemeContext';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { buttonPressSound } from '../sounds/soundUtils.js';
import {handleAddPointsToCurrentUser} from './global/incrementPoints';


export default function Profile() {
    const router = useRouter();
    const { isDarkTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [message, setMessage] = useState({ text: '', isError: false });
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [usernameModalVisible, setUsernameModalVisible] = useState(false);
    const [mfa, setMFA] = useState(false);

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
                setMFA(userData.mfaOn);
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

        if (updateData.username && (!updateData.username.trim())) {
            setMessage({ text: 'Display name cannot be empty', isError: true });
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');

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
                return true;
            } else {
                setMessage({ text: responseData.message || 'Update failed', isError: true });
                return false;
            }
        } catch (error) {
            console.error("Update error:", error);
            setMessage({ text: 'Update failed: ' + error.message, isError: true });
            return false;
        } finally {
            setUpdating(false);
        }
    };

    const toggleMFA = async () => {
       
        try {
          const newValue = !mfa;
          setMFA(newValue);
          console.log("new Mfa value is: " + newValue);
          const token = await AsyncStorage.getItem('token');

            if (!token) {
                throw new Error('Authentication token missing');
            }

            if (!user?._id) {
                throw new Error('User ID not available');
            }
            
          const res = await fetch(`${API_URL}/users/mfa/${user._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ mfaOn: newValue }),
          });
      
          const data = await res.json();
      
          if (!res.ok) {
            console.error('Failed to update MFA setting:', data.message);
            return;
          }
      
          
          console.log('MFA setting updated:', data.message);
        } catch (error) {
          console.error('Error toggling MFA:', error);
        }
      };
      
    const handleImageUpload = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                setMessage({ text: 'Permission to access images required', isError: true });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                await uploadProfileImage(result.assets[0]);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            setMessage({ text: 'Failed to pick image', isError: true });
        }
    };

    const uploadProfileImage = async (imageAsset) => {
        setUploadingImage(true);
        setMessage({ text: '', isError: false });
        
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token || !user?._id) {
            throw new Error('Authentication failed');
          }
      
          let mimeType = 'image/png';
          let fileName = 'profile-image.png';
          
          const response = await fetch(imageAsset.uri);
          const blob = await response.blob();
          
          const file = new File([blob], fileName, { type: mimeType });
          
          const formData = new FormData();
          formData.append('profileImage', file);
          
          console.log('Uploading image with type:', mimeType);
          
          const responseUpload = await fetch(`${API_URL}/users/${user._id}/profile-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: formData
          });
          
          const responseData = await responseUpload.json();
          
          if (responseUpload.ok) {
            setMessage({ text: 'Profile image updated successfully', isError: false });
            setUser(prev => ({ ...prev, profileImage: responseData.profileImageUrl }));
          } else {
            setMessage({ text: responseData.message || 'Failed to upload image', isError: true });
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          setMessage({ text: 'Failed to upload image: ' + error.message, isError: true });
        } finally {
          setUploadingImage(false);
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

            <View style={styles.profileImageContainer}>
                {user?.profileImage ? (
                    <Image 
                        source={{ uri: user.profileImage }} 
                        style={styles.profileImage} 
                    />
                ) : (
                    <View style={[styles.profileImagePlaceholder, isDarkTheme ? styles.darkPlaceholder : styles.lightPlaceholder]}>
                        <Text style={[styles.profileImagePlaceholderText, isDarkTheme ? styles.darkText : styles.lightText]}>
                            {user?.username?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                    </View>
                )}
                <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={async ()=>{
                        await buttonPressSound();
                        handleAddPointsToCurrentUser(5);
                        handleImageUpload()
                    }}
                    disabled={uploadingImage}
                >
                    <Text style={styles.buttonText}>
                        {uploadingImage ? 'Uploading...' : 'Change Profile Picture'}
                    </Text>
                </TouchableOpacity>
            </View>

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
                <View style={styles.settingItem}>
                    <Text style={[styles.settingText, isDarkTheme ? styles.darkText : styles.lightText]}>Multi-factor Authentication</Text>
                    <Switch value={mfa} onValueChange={toggleMFA} />
                </View>
                <TouchableOpacity
                    style={styles.button}
                    onPress={async() => {
                        await buttonPressSound();
                        handleAddPointsToCurrentUser(5);
                        setUsernameModalVisible(true)
                    }}
                >
                    <Text style={styles.buttonText}>Change Display Name</Text>
                </TouchableOpacity>


                <TouchableOpacity
                    style={styles.button}
                    onPress={async() => {
                        await buttonPressSound();
                        setPasswordModalVisible(true)
                    }}
                >
                    <Text style={styles.buttonText}>Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={async() => {
                        await buttonPressSound();
                        router.push('/landing')
                    }}
                >
                    <Text style={styles.buttonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={usernameModalVisible}
                onRequestClose={() => setUsernameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkTheme ? styles.darkModal : styles.lightModal]}>
                        <Text style={[styles.modalTitle, isDarkTheme ? styles.darkText : styles.lightText]}>Change Display Name</Text>

                        <TextInput
                            style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                            placeholder="New Display Name"
                            placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                            value={newUsername}
                            onChangeText={setNewUsername}
                        />

                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={async() => {
                                    await buttonPressSound();
                                    setUsernameModalVisible(false);
                                    setNewUsername(user?.username || '');
                                }}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={async()=> {
                                    await buttonPressSound();
                                    handleUpdateUsername()
                                }}
                                disabled={updating}
                            >
                                <Text style={styles.buttonText}>
                                    {updating ? 'Updating...' : 'Update'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={passwordModalVisible}
                onRequestClose={() => setPasswordModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkTheme ? styles.darkModal : styles.lightModal]}>
                        <Text style={[styles.modalTitle, isDarkTheme ? styles.darkText : styles.lightText]}>Change Password</Text>

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
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={async() => {
                                    await buttonPressSound();
                                    setPasswordModalVisible(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={async()=> {
                                    await buttonPressSound();
                                    handleUpdatePassword()
                                }}
                                disabled={updating}
                            >
                                <Text style={styles.buttonText}>
                                    {updating ? 'Updating...' : 'Update'}
                                </Text>
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
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 10,
    },
    profileImagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#E1E1E1',
    },
    darkPlaceholder: {
        backgroundColor: '#444',
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
    lightPlaceholder: {
        backgroundColor: '#E1E1E1',
    },
    profileImagePlaceholderText: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    uploadButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 5,
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
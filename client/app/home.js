import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import Header from '../components/Header';
import { AuthContext } from './AuthContext';
import { useTheme } from '../components/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { getCurrentUser } from './api/user';
import { buttonPressSound } from '../sounds/soundUtils.js';
import {handleAddPointsToCurrentUser} from "@/app/global/incrementPoints";
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';
import { Image } from 'react-native';
import { fetchOnlineAvatars } from './api/user';

export default function Home() {
    const router = useRouter();
    const { isDarkTheme } = useTheme();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout, authLoading, token, markUserOnline, markUserOffline } = useContext(AuthContext);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const navigation = useNavigation();

    // Simulated API call to fetch groups
    useEffect(() => {
        let cleanupCalled = false;
      
        const initOnline = async () => {
          if (token) await markUserOnline();
        };
      
        const handleUnload = async () => {
          if (!cleanupCalled) {
            cleanupCalled = true;
            const token = await AsyncStorage.getItem("token");
            if (token) await markUserOffline(token);
          }
        };
      
        const sendHeartbeat = async () => {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            await fetch(`${API_URL}/users/heartbeat`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          }
        };
      
        initOnline();
        setLoading(false);
      
        const fetchClasses = async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const userData = await getCurrentUser({ token });
            const response = await fetch(`${API_URL}/classes/`);
            if (!response.ok) throw new Error('Failed to fetch classes');
            const data = await response.json();
            setGroups(data);
          } catch (error) {
            console.error('Error fetching classes:', error);
          }
        };
        fetchClasses();
      
        const fetchOnlineUsers = async () => {
          try {
            const avatars = await fetchOnlineAvatars();
            setOnlineUsers(avatars);
          } catch (err) {
            console.error("Error fetching online avatars:", err);
          }
        };
        fetchOnlineUsers();
      
        const heartbeatInterval = setInterval(sendHeartbeat, 60000); // every 60s
        const onlineUsersInterval = setInterval(fetchOnlineUsers, 30000); // every 30s
        window.addEventListener("beforeunload", handleUnload);
      
        return () => {
          handleUnload();
          clearInterval(heartbeatInterval);
          clearInterval(onlineUsersInterval);
          window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    if (authLoading) {``
        return <ActivityIndicator size="large" color="#007AFF" />;
    }

    const handleLogout = async () => {
        await markUserOffline(token);
        await AsyncStorage.removeItem('token');
        router.replace('/login');
    };

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            {/* Header with its own styles */}
            <Header />

            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={async () => {
                await buttonPressSound();
                handleAddPointsToCurrentUser(5);
                handleLogout();
            }}>
                <Text style={[styles.darkText, isDarkTheme ? styles.darkText : styles.darkText]}>Logout</Text>
            </TouchableOpacity>

            <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Online Users</Text>
            <FlatList
            horizontal
            data={onlineUsers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
                let avatarSvg = '';
                try {
                avatarSvg = createAvatar(micah, {
                    seed: item.avatarConfig.seed || item.username,
                    eyes: [item.avatarConfig.eyes],
                    mouth: [item.avatarConfig.mouth],
                    glasses: [item.avatarConfig.glasses],
                    hair: [item.avatarConfig.hair],
                    hairColor: [item.avatarConfig.hairColor],
                    baseColor: [item.avatarConfig.skinColor],
                    shirtColor: [item.avatarConfig.shirtColor],
                    backgroundColor: [item.avatarConfig.backgroundColor],
                }).toString();
                } catch (e) {
                console.error('Error rendering avatar:', e);
                }

                return (
                    <View style={{ alignItems: 'center', marginHorizontal: 10, paddingBottom: 20 }}>
                    <Image
                    source={{ uri: `data:image/svg+xml;utf8,${avatarSvg}` }}
                    style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' }}
                    />
                    <Text style={{ fontSize: 12 }}>{item.username}</Text>
                </View>
                );
            }}
            style={{ marginVertical: 10 }}
            />

            {/* Title for the page */}
            <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Classes</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.classItem}
                            onPress={async () => {
                                await buttonPressSound();
                                handleAddPointsToCurrentUser(5);
                                //console.log("ID: ", item._id)
                                //navigation.navigate('group', { groupId: '67ef5a6330893347ba1b9c0c' });
                                
                                console.log("Navigating to group with ID:", item._id);
                                navigation.navigate('group', { groupId: item._id });
                                //Does nothing
                            }}
                        >
                            <Text style={styles.groupText}>{item.name}</Text>
                            <Text style={styles.creditsText}>Credits: {item.credits}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            <View style={styles.bottomButtonsContainer}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.bottomButton}
                        onPress={async () => {
                            await buttonPressSound();
                            handleAddPointsToCurrentUser(5);
                            router.push('/notesPage');
                        }}
                    >
                        <Text style={styles.buttonText}>Notes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeBottomButton}
                        onPress={async () => {
                            await buttonPressSound();
                            handleAddPointsToCurrentUser(5);
                            router.push('/profile');
                        }}
                    >
                        <Text style={styles.buttonText}>Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bottomButton}
                        onPress={async () => {
                            await buttonPressSound();
                            handleAddPointsToCurrentUser(5);
                            router.push('/AddClass');
                        }}
                    >
                        <Text style={styles.buttonText}>Add Class</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.bottomButton}
                        onPress={async () => {
                            await buttonPressSound();
                            handleAddPointsToCurrentUser(5);
                            router.push('/leaderboard');
                        }}
                    >
                        <Text style={styles.buttonText}>Leaderboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.bottomButton}
                        onPress={async () => {
                            await buttonPressSound();
                            handleAddPointsToCurrentUser(5);
                            router.push('/messages');
                        }}
                    >
                        <Text style={styles.buttonText}>Messages</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 70,
        paddingBottom: 100, // Space for bottom buttons
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginVertical: 10,
        alignSelf: 'center',
    },
    classItem: {
        width: '100%',
        padding: 20,
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'flex-start',
    },
    groupText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    creditsText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'flex-end',
        marginBottom: 15,
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
    },
    bottomButtonsContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ddd',
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    bottomButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 6,
        alignItems: 'center',
    },
    homeBottomButton: {
        flex: 1,
        backgroundColor: '#6c757d',
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 6,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 120, // Extra space for bottom buttons
    },
    darkBackground: {
        backgroundColor: "#121212",
    },
    lightBackground: {
        backgroundColor: "#FFFFFF",
    },
    darkText: {
        color: "#F1F1F1",
    },
    lightText: {
        color: "#333",
    },
    // /* Dark Mode */
    darkModal: { backgroundColor: "#1E1E1E" },
    darkInput: { backgroundColor: "#333", borderColor: "#555", color: "#F1F1F1" },

    // /* Light Mode */
    lightModal: { backgroundColor: "white" },
    lightInput: { backgroundColor: "#FFF", borderColor: "#CCC", color: "#333" },
});
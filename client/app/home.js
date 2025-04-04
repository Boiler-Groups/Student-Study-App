import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import { AuthContext } from './AuthContext';
import { useTheme } from '../components/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { getCurrentUser } from './api/user';

export default function Home() {
    const router = useRouter();
    const { isDarkTheme } = useTheme();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout, authLoading} = useContext(AuthContext);

    
    // Simulated API call to fetch groups
    useEffect(() => {
        setLoading(false); // Set loading to false immediately
        const fetchClasses = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userData = await getCurrentUser({ token });
                const userID = userData.data._id;

                const response = await fetch(`${API_URL}/classes/${userID}`);
                if (!response.ok) {
                    console.log("Fetch classes failed!")
                    throw new Error('Failed to fetch classes');

                }
                const data = await response.json();
                setGroups(data);
            } catch (error) {
                console.error('Error fetching classes:', error);
            } 
        };
    
        fetchClasses();
    }, []);

    if (authLoading) {
        return <ActivityIndicator size="large" color="#007AFF" />;
      }

      const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.replace('/login');
    };

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            {/* Header with its own styles */}
            <Header />

            <TouchableOpacity style={[styles.button, styles.logoutButton]}  onPress={handleLogout}>
                <Text style={[styles.darkText, isDarkTheme ? styles.darkText : styles.darkText]}>Logout</Text>
            </TouchableOpacity>

            {/* Title for the page */}
            <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Classes</Text>

            {/* Display a loading indicator or the FlatList */}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item._id} // MongoDB uses _id
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                        style={styles.classItem}
                        onPress={() => {}}
                        >
                        <Text style={styles.groupText}>{item.name}</Text>
                        <Text style={styles.creditsText}>Credits: {item.credits}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Bottom buttons container */}
            <View style={styles.bottomButtonsContainer}>
                <TouchableOpacity style={[styles.bottomButton, { backgroundColor: '#6c757d' }]} onPress={() => router.push('/landing')}>
                    <Text style={styles.buttonText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomButton} onPress={() => router.push('/notesPage')}>
                    <Text style={styles.buttonText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomButton} onPress={() => router.push('/AddClass')}>
                    <Text style={styles.buttonText}>Add Class</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomButton} onPress={() => router.push('/leaderboard')}>
                    <Text style={styles.buttonText}>Leaderboard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomButton} onPress={() => router.push('/messages')}>
                    <Text style={styles.buttonText}>Messages</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 15, paddingTop: 100 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    classItem: {
        width: '100%',
        padding: 30,
        backgroundColor: '#D3D3D3',
        borderRadius: 8,
        marginVertical: 5,
        alignItems: 'center',
        borderWidth: 2,
    },
    groupText: { fontSize: 18, fontWeight: 'bold' },
    creditsText: { fontSize: 16, color: '#555', marginTop: 5 }, // New style for credits
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
    buttonText: { color: '#fff', fontSize: 16 },
    bottomButtonsContainer: {
        position: 'absolute',
        bottom: 30,
        width: '100%',
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bottomButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        height: 70,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    listContainer: {
        paddingLeft: 20,
        marginBottom: 80,
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
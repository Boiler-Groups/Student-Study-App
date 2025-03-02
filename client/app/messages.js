import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import { getStudyGroups } from './api/studygroup'; // Ensure the correct import path

export default function Messages() {
    const router = useRouter();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const email = "student1@example.com"; // Replace with dynamic user email
                const response = await getStudyGroups({ email }); // Call API
                console.log(response.data); // Log the data to inspect its structure
                if (Array.isArray(response.data)) {
                    setGroups(response.data);
                } else {
                    console.error("Data is not an array:", response.data);
                }
            } catch (error) {
                console.error("Failed to fetch study groups:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    return (
        <View style={styles.container}>
            <Header />
            <Text style={styles.title}>Study Groups</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item._id} // Use _id as keyExtractor
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.groupItem}
                            onPress={() => router.push(`/group/${item._id}`)} // Use _id for navigation
                        >
                            <Text style={styles.groupText}>{item.name}</Text> {/* Display group name */}
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 15, paddingTop: 100 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    groupItem: {
        width: '80%',
        padding: 15,
        backgroundColor: '#D3D3D3',
        borderRadius: 8,
        marginVertical: 5,
        alignItems: 'center',
        borderWidth: 2,
    },
    groupText: { fontSize: 18 },
    listContainer: { paddingLeft: 50 },
});


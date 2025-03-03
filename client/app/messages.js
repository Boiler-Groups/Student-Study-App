import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import { getStudyGroups, createStudyGroup } from './api/studygroup'; // Ensure correct path

export default function Messages() {
    const router = useRouter();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState('');

    // Fetch groups function
    const fetchGroups = async () => {
        try {
            const email = "ryan@gmail.com"; // Replace with dynamic user email
            const response = await getStudyGroups({ email });
            console.log(response.data);
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

    useEffect(() => {
        fetchGroups();
    }, []);

    // Create Study Group Function
    const handleCreateGroup = async () => {
        if (!groupName || !members) {
            Alert.alert('Error', 'Please enter a group name and at least one member.');
            return;
        }

        try {
            const memberArray = members.split(',').map(m => m.trim());
            await createStudyGroup({ name: groupName, members: memberArray });
            Alert.alert('Success', 'Study group created successfully!');
            setModalVisible(false);
            setGroupName('');
            setMembers('');
            fetchGroups(); // Refresh the study groups list
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create group');
        }
    };

    return (
        <View style={styles.container}>
            <Header />
            <Text style={styles.title}>Study Groups</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.groupItem}
                            onPress={() => router.push(`/group/${item._id}`)}
                        >
                            <Text style={styles.groupText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Button to Open Modal */}
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
                <Text style={styles.buttonText}>Create New Group</Text>
            </TouchableOpacity>

            {/* Modal for Creating Group */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create a Study Group</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Group Name"
                            value={groupName}
                            onChangeText={setGroupName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Members (comma-separated emails)"
                            value={members}
                            onChangeText={setMembers}
                        />
                        <TouchableOpacity style={styles.button} onPress={handleCreateGroup}>
                            <Text style={styles.buttonText}>Create Group</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 100 },
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
    button: {
        width: '80%',
        padding: 15,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20, // Space above the button
    },
    buttonText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold'
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 5,
        justifyContent: 'space-between', // Ensure spacing between the buttons
        height: 'auto', // Allow height to adjust based on content
        paddingBottom: 20, // Add padding at the bottom to give space for the buttons
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10 },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
    },
    cancelButton: {
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        marginTop: 20, // Space between Create Group and Cancel button
        alignItems: 'center',
        width: '80%', // Ensure buttons have the same width
    },
    cancelButtonText: { color: '#fff', fontWeight: 'bold' },
});


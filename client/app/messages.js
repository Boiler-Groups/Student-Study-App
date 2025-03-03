import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import {getStudyGroups, createStudyGroup, deleteStudyGroup} from './api/studygroup'; // Ensure correct path

export default function Messages() {
    const router = useRouter();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    // Fetch groups function
    const fetchGroups = async () => {
        try {
            const email = "foobar@gmail.com"; // Replace with dynamic user email
            const response = await getStudyGroups({ email });
            console.log(response.data);
            if (Array.isArray(response.data)) {
                setGroups(response.data);
            } else {
                console.error("Data is not an array:", response.data);
            }
        } catch (error) {
            console.log("Failed to fetch study groups:", error);
            console.log("Returning Empty List");
            setGroups([]); // Clear groups if the fetch fails
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
            setCreateModalVisible(false);
            setGroupName('');
            setMembers('');
            fetchGroups(); // Refresh the study groups list
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create group');
        }
    };
    const handleDeleteGroup = async (groupId) => {
        console.log("Deleting:", groupId);
        try {
            // Call the delete function with the groupId
            await deleteStudyGroup(groupId);

            // Show success message
            Alert.alert('Success', 'Study group deleted successfully!');

            // Refresh the list of study groups
            await fetchGroups(); // Assuming this fetches the updated list of groups
        } catch (error) {
            // Show error message if deletion fails
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete group');
        }
    };

    return (
        <View style={styles.container}>
            <Header />
            <Text style={styles.title}>Study Groups and Messaging</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    style={{ flex: 1 }} // Make FlatList fill available space
                    renderItem={({ item }) => (
                        <View style={styles.groupItem}>
                            {/* Group Item (Touchable for navigation) */}
                            <TouchableOpacity
                                style={styles.groupItemTouchable}
                                onPress={() => router.push(`/group/${item._id}`)} // Navigate on touch
                            >
                                <Text style={styles.groupText}>{item.name}</Text>
                            </TouchableOpacity>

                            {/* Delete Button */}
                            <TouchableOpacity onPress={() => handleDeleteGroup(item._id)}>
                                <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {/* Button to Open Modal */}
            <TouchableOpacity style={styles.button} onPress={() => setCreateModalVisible(true)}>
                <Text style={styles.buttonText}>Create New Group</Text>
            </TouchableOpacity>

            {/* Modal for Creating Group */}
            <Modal visible={createModalVisible} animationType="slide" transparent={true}>
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
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setCreateModalVisible(false)}>
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
    container: {
        flex: 1,
        justifyContent: 'flex-start', // Allow list to expand downward
        alignItems: 'stretch', // Let FlatList expand horizontally
        //padding: 15,
        paddingTop: 75, // Reduce top padding for more space
    },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15, padding: 15 },
    groupItem: {
        width: '100%', // Make items full width
        padding: 15,
        backgroundColor: '#D3D3D3',
        borderRadius: 8,
        marginVertical: 1,
        alignItems: 'LEFT',
        borderWidth: 2,
    },
    groupText: { fontSize: 18, padding:15},
    listContainer: { paddingLeft: 0 },
    button: {
        width: '100%',
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
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    deleteText: {
        color: 'red',
        fontSize: 18,
    }
});


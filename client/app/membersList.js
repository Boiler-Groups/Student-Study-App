import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getGroupMembers, removeMember } from './api/studygroup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './api/user';

const MembersList = ({ route }) => {
    //const { groupMembers } = route.params; // Get group members from the navigation parameters
    const { groupId } = useLocalSearchParams(); // Get groupId from the URL
    const [groupMembers, setGroupMembers] = useState();
    const [editMode, setEditMode] = useState(false);

    console.log(`GroupID: ${groupId}`)

    const router = useRouter();

    const handleRemoveMember = async (email) => {
        const token = await AsyncStorage.getItem('token');
        const removed = await removeMember(token, groupId, email);

        if (removed) {
            loadGroupMembers();
        }
    };

    const handleLeaveGroup = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const user = await getCurrentUser({ token });
            const email = user.data.email;
            const removed = await removeMember(token, groupId, email);

            if (removed) {
                Alert.alert('Success', 'You have left the group');
                router.replace('messages');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to leave group.');
        }
    }

    const loadGroupMembers = async () => {
        const token = await AsyncStorage.getItem('token');
        const members = await getGroupMembers(token, groupId);
        setGroupMembers(members); // Store members in state
        console.log(groupMembers)
    };

    useEffect(() => {
        loadGroupMembers(); // Fetch group members when component mounts
    }, [groupId]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Group Members</Text>

            {/* Edit button to toggle remove buttons */}
            <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.editButton}>
                <Text style={styles.editButtonText}>{editMode ? 'Done Editing' : 'Edit Members'}</Text>
            </TouchableOpacity>

            {/* Leave group button */}
            <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveButton}>
                <Text style={styles.leaveButtonText}>Leave Group</Text>
            </TouchableOpacity>

            <FlatList
                data={groupMembers}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <View style={styles.memberItem}>
                        <Text style={styles.memberName}>{item}</Text>

                        {/* Show Remove button if in edit mode */}
                        {editMode && (
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemoveMember(item)}
                            >
                                <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    editButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    leaveButton: {
        backgroundColor: '#f44336',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginTop: 5,
        alignSelf: 'flex-start',
    },
    leaveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    memberItem: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberName: {
        fontSize: 16,
    },
    removeButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    removeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default MembersList;

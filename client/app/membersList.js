import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { getGroupMembers, removeMember, addStudyGroupMembers, getStudyGroupName } from './api/studygroup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, searchUser } from './api/user';
import { buttonPressSound } from '../sounds/soundUtils.js';

const MembersList = () => {
    const { groupId } = useLocalSearchParams();
    const [groupMembers, setGroupMembers] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [groupTitle, setGroupTitle] = useState('');
    

    console.log(`GroupID: ${groupId}`);
    console.log(`search Results: ${searchResults}`);

    const router = useRouter();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            title: "Group Info",

        });
    }, [navigation]);

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
                //navigation.navigate('messages');
                //navigation.reset()
                //router.dismiss(2)
                router.dismissTo('messages');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to leave group.');
        }
    };

    const handleSearchUsers = async (query) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            //const token = await AsyncStorage.getItem('token');
            const results = await searchUser(query);
            setSearchResults(results.data);
            //console.log("res", results)
        } catch (e) {
            console.error('Error searching users:', e);
        }
    };

    const handleInviteMember = async (email) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const added = await addStudyGroupMembers(groupId, email);

            if (added) {
                Alert.alert('Success', `${email} has been added to the group!`);
                setSearchQuery('');
                setSearchResults([]);
                setModalVisible(false);
                loadGroupMembers();
            } else {
                Alert.alert('Error', 'Failed to add member.');
            }
        } catch (e) {
            console.error('Error adding member:', e);
        }
    };

    const loadGroupMembers = async () => {
        const token = await AsyncStorage.getItem('token');
        const members = await getGroupMembers(token, groupId);
        setGroupMembers(members);
    };

    useFocusEffect(
        useCallback(() => {
            const fetchGroupName = async () => {
                try {
                    const name = await getStudyGroupName(groupId);
                    setGroupTitle(name.data);
                } catch (e) {
                    console.error("Failed to fetch group name:", e);
                }
            };

            fetchGroupName();
            loadGroupMembers(groupId);
        }, [groupId])
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Study Group: {groupTitle}</Text>
            <Text style={styles.title}>Members</Text>


            {/* Action buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={async () => {
                    await buttonPressSound()
                    setEditMode(!editMode)
                }} style={styles.editButton}>
                    <Text style={styles.buttonText}>{editMode ? 'Done Editing' : 'Edit Members'}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={async() => {
                    await buttonPressSound()
                    setModalVisible(true)
                }} style={styles.inviteButton}>
                    <Text style={styles.buttonText}>Invite New Member</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={async()=>{
                    await buttonPressSound()
                    handleLeaveGroup()
                }}style={styles.leaveButton}>
                    <Text style={styles.buttonText}>Leave Group</Text>
                </TouchableOpacity>
            </View>

            {/* Member list */}
            <FlatList
                data={groupMembers}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <View style={styles.memberItem}>
                        <Text style={styles.memberName}>{item}</Text>

                        {editMode && (
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={async() => {
                                    await buttonPressSound()
                                    handleRemoveMember(item)
                                }}
                            >
                                <Text style={styles.removeButtonText}>Remove</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />

            {/* Invite Member Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Invite New Member</Text>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for a user..."
                            value={searchQuery}
                            onChangeText={handleSearchUsers}
                        />

                        {/* Show dropdown only when results exist */}
                        {searchResults.length != 0 ? (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item) => item.email}
                                style={styles.resultsContainer}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.searchResultItem}
                                        onPress={async() => {
                                            await buttonPressSound()
                                            handleInviteMember(item.email)
                                        }}
                                    >
                                        <Text>{item.email}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            searchQuery.length > 1 && <Text style={styles.noResults}>No results found.</Text>
                        )}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={async() => {
                                await buttonPressSound()
                                setModalVisible(false)
                            }}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    },
    inviteButton: {
        backgroundColor: '#28a745',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    leaveButton: {
        backgroundColor: '#f44336',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    buttonText: {
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    resultsContainer: {
        maxHeight: 150, // Limits dropdown height
    },
    searchResultItem: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        marginBottom: 5,
        borderRadius: 5,
    },
    closeButton: {
        marginTop: 10,
        alignSelf: 'center',
    },
    closeButtonText: {
        color: '#007bff',
        fontWeight: 'bold',
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

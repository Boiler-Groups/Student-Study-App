import React, { useCallback, useEffect, useState } from 'react';
import { throttle } from 'lodash';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import Header from '../components/Header';
import { useTheme } from '../components/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, searchUser } from './api/user';
import { MaterialIcons } from '@expo/vector-icons'; // Import icon library


import {
    getStudyGroups,
    createStudyGroup,
    deleteStudyGroup,
    editStudyGroupName,
    getStudyGroupsAll,
    addStudyGroupMembers,
    setNewMessageFlagForGroup,
    addAllMembersToUnopenedMessageGroup,
    removeMemberFromUnopenedMessageGroup,
    getMembersWithUnopenedMessages,
    getTaggedOrRepliedUsers,
    removeTaggedOrRepliedUser
} from './api/studygroup';
import group from "@/app/group"; // Server function calls, Ensure correct path


export default function Messages() {

    const router = useRouter();
    const { isDarkTheme } = useTheme();
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [groupsAll, setGroupsAll] = useState([]);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState('');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [groupToEdit, setGroupToEdit] = useState(null);
    const [newMessage, setNewMessage] = useState(false);
    const [dmModalVisible, setDmModalVisible] = useState(false);
    const navigation = useNavigation();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [currToken, setToken] = useState(null); // State to store AsyncStorage data
    const [currUser, setUser] = useState(null); // State to store AsyncStorage data
    const [currEmail, setEmail] = useState(null); // State to store AsyncStorage data
    const [newGroupMessages, setNewGroupMessages] = useState({});
    const [groups, setGroups] = useState([]);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [groupsWithTaggedMessages, setGroupsWithTaggedMessages] = useState({});

    const handler_removeMemberFromUnopenedMessageGroup = async (groupId) => {
        await removeMemberFromUnopenedMessageGroup(groupId, currEmail);

        await removeTaggedOrRepliedUser(groupId, currEmail);
    };

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
    };

    // Fetch groups function
    const fetchGroups = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const user = await getCurrentUser({ token });
            const email = user.data.email;

            const response = await getStudyGroups({ email });
            if (Array.isArray(response.data)) {
                setGroups(response.data);

                const messages = {};
                const taggedMessages = {};

                for (const group of response.data) {
                    const membersWithUnopenedMessages = await getMembersWithUnopenedMessages(group._id);
                    if (Array.isArray(membersWithUnopenedMessages.data.members) && !notificationsEnabled) {
                        const hasNewMessage = membersWithUnopenedMessages.data.members.includes(email);
                        messages[group._id] = hasNewMessage;
                    } else {
                        messages[group._id] = false;
                    }

                    try {
                        const taggedUsers = await getTaggedOrRepliedUsers(group._id);
                        if (Array.isArray(taggedUsers.data.users)) {
                            const isTagged = taggedUsers.data.users.includes(email);
                            taggedMessages[group._id] = !notificationsEnabled && isTagged;
                        } else {
                            taggedMessages[group._id] = false;
                        }
                    } catch (err) {
                        console.warn(`Error fetching tagged users for group ${group._id}`, err);
                        taggedMessages[group._id] = false;
                    }
                }

                setNewGroupMessages(messages);
                setGroupsWithTaggedMessages(taggedMessages);
            } else {
                console.error("Data is not an array:", response.data);
            }

            if (token !== null) {
                setToken(token);
            } else {
                setToken('No data found');
            }
            if (user !== null) {
                setUser(user);
            } else {
                setUser('No data found');
            }
            if (email !== null) {
                setEmail(email);
            } else {
                setEmail('No data found');
            }
        } catch (error) {
            console.log("Failed to fetch study groups:", error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchGroups();
        }, 1000); // 1000 milliseconds = 1 second

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [fetchGroups]);

    const fetchGroupsAll = async () => {
        try {
            const response = await getStudyGroupsAll();
            console.log(response.data);
            if (Array.isArray(response.data)) {
                setGroupsAll(response.data);
            } else {
                console.error("Data is not an array:", response.data);
            }
        } catch (error) {
            console.log("Failed to fetch All study groups:", error);
            //setErrorModalVisible(true);
            console.log("Returning Empty List");
            setGroupsAll([]); // Clear groups if the fetch fails
        } finally {
            setLoading(false);
        }
    };

    const clearAllNotifications = async (groupId, email) => {
        try {
            await removeMemberFromUnopenedMessageGroup(groupId, email);
            await removeTaggedOrRepliedUser(groupId, email);

            setNewGroupMessages(prev => ({
                ...prev,
                [groupId]: false
            }));

            setGroupsWithTaggedMessages(prev => ({
                ...prev,
                [groupId]: false
            }));
        } catch (error) {
            console.error("Failed to clear notifications:", error);
        }
    };

    // Create Study Group Function
    const handleCreateGroup = async () => {
        if (!groupName || !members) {
            Alert.alert('Error', 'Please enter a group name and at least one member.');
            return;
        }

        try {
            const memberArray = members.split(',').map(m => m.trim());
            const token = await AsyncStorage.getItem('token');
            const user = await getCurrentUser({ token });
            const email = user.data.email;
            memberArray.push(email);
            await createStudyGroup({ name: groupName, members: memberArray });
            Alert.alert('Success', 'Study group created successfully!');
            setCreateModalVisible(false);
            setSuccessModalVisible(true);
            setGroupName('');
            setMembers('');
            await fetchGroups(); // Refresh the study groups list
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create group');
            setErrorModalVisible(true);
        }
    };

    const handleCreateDm = async (member) => {
        if (!member) {
            Alert.alert('Error', 'Please select a user');
            return;
        }

        try {
            const memberArray = [];
            memberArray.push(member);
            const token = await AsyncStorage.getItem('token');
            const user = await getCurrentUser({ token });
            const email = user.data.email;
            memberArray.push(email);
            await createStudyGroup({ name: member, members: memberArray, isDM: true });
            Alert.alert('Success', 'Direct message created successfully!');
            setCreateModalVisible(false);
            setSuccessModalVisible(true);
            setGroupName('');
            setMembers('');
            await fetchGroups(); // Refresh the study groups list
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create group');
            setErrorModalVisible(true);
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
            setErrorModalVisible(true);
        }
    };

    const setNewMessageFlag = async (groupId, flag) => {
        // try {
        //     console.log("groupID was", groupId);
        //
        //     if(groupId === -1){
        //         for (let group of groups) {
        //             const response = await setNewMessageFlagForGroup(group._id, false);
        //             if (response.status === 200) {
        //                 console.log(`New message flag for group ${group._id} set to false.`);
        //             } else {
        //                 console.error(`Failed to reset new message flag for group ${group._id}.`);
        //             }
        //         }
        //         setNewMessage(false);
        //     } else {
        //         const response = await setNewMessageFlagForGroup(groupId, flag);
        //         console.log("Setting New Message for Group");
        //         setNewMessage(false);
        //     }
        // } catch (error) {
        //     console.log("Could not Set new Message for Group");
        //}
    };

    const updateStudyGroupName = async (groupId, newName) => {
        if (!groupId || !newName) {
            Alert.alert('Error', 'Please enter a new group name .');
            return;
        }
        console.log("Editing Study Group Name");
        console.log("New name:", newName);
        try {
            // Create the payload for the edit request
            const requestBody = { name: newName };

            // Send the PATCH request to update the study group name
            const response = await editStudyGroupName(groupId, requestBody);

            console.log("Response:", response.data);

            // Check if the response contains the updated group information
            if (response.data && response.data.group) {
                console.log("Study group name updated successfully:", response.data.group);
                // Optionally, update local state here with the updated group
                // Example: setGroups(updatedGroups); or update the specific group in your state
            } else {
                console.error("Failed to update group name:", response.data);
                setErrorModalVisible(true);
            }
            // Refresh the list of study groups
            await fetchGroups(); // Assuming this fetches the updated list of groups
            setSuccessModalVisible(true);
        } catch (error) {
            console.log("Error occurred while updating study group:", error);
            //setErrorModalVisible(true);
        } finally {
            // Perform any cleanup or loading state reset if necessary
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

    return (
        <View style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
            <Header />

            <View style={styles.headerContainer}>
                <Text style={[styles.title, isDarkTheme ? styles.darkText : styles.lightText]}>Study Groups and Messaging</Text>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => {
                            fetchGroupsAll();
                            setDmModalVisible(true);
                        }}
                    >
                        <Text style={styles.joinButtonText}>New Direct Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => {
                            fetchGroupsAll();
                            setJoinModalVisible(true);
                        }}
                    >
                        <Text style={styles.joinButtonText}>Join Group</Text>
                    </TouchableOpacity>

                    {/* Notification toggle button */}
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={toggleNotifications}
                    >
                        <MaterialIcons
                            name={notificationsEnabled ? 'notifications-off' : 'notifications'}
                            size={20}
                            color="white"
                        />
                    </TouchableOpacity>
                </View>

                {newMessage && (
                    <TouchableOpacity style={styles.notificationIcon} onPress={() => setNewMessageFlag(-1, false)}>
                        <MaterialIcons name="notifications" size={30} color="red" />
                    </TouchableOpacity>
                )}
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => {
                        const isDM = item.isDM;
                        const name = item.name;

                        return (
                            <View style={styles.groupItem}>
                                <TouchableOpacity
                                    style={
                                        groupsWithTaggedMessages[item._id]
                                            ? styles.groupItemTaggedMessage
                                            : newGroupMessages[item._id]
                                                ? styles.groupItemMessage
                                                : styles.groupItemNoMessage
                                    }
                                    onPress={() => {
                                        clearAllNotifications(item._id, currEmail);
                                        navigation.navigate('group', { groupId: item._id });
                                    }}
                                >
                                    <View style={styles.groupTextContainer}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {/* DM Profile Circle */}
                                            {isDM && name && (
                                                <View style={styles.profileCircle}>
                                                    <Text style={styles.profileInitial}>
                                                        {name[0]?.toUpperCase() || '?'}
                                                    </Text>
                                                </View>
                                            )}

                                            <Text style={styles.groupText}>{item.name}</Text>
                                        </View>

                                        {groupsWithTaggedMessages[item._id] && (
                                            <Text style={styles.taggedText}>You were mentioned</Text>
                                        )}
                                        {!groupsWithTaggedMessages[item._id] && newGroupMessages[item._id] && (
                                            <Text style={styles.newMessageText}>New messages</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {!item.isDM && (
                                    <TouchableOpacity onPress={() => {
                                        setGroupToEdit(item);
                                        setEditModalVisible(true);
                                    }}>
                                        <Text style={styles.editText}>Edit Name</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity onPress={() => handleDeleteGroup(item._id)}>
                                    <Text style={styles.deleteText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                />
            )}

            {/* Button to Open Create Modal */}
            <TouchableOpacity style={styles.button} onPress={() => setCreateModalVisible(true)}>
                <Text style={styles.buttonText}>Create New Group</Text>
            </TouchableOpacity>

            {/* Button to navigate to Landing */}
            <TouchableOpacity
                style={[styles.button, { marginTop: 10, backgroundColor: '#6c757d' }]}
                onPress={() => router.push('/landing')}>
                <Text style={styles.buttonText}>Home</Text>
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

            {/* Modal for Changing Group Name */}
            <Modal visible={editModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Study Group Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="New Group Name"
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                if (groupToEdit) {
                                    updateStudyGroupName(groupToEdit._id, newGroupName);
                                }
                            }}
                        >
                            <Text style={styles.buttonText}>Save Changes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Invite Member Modal */}
            <Modal visible={dmModalVisible} animationType="slide" transparent={true}>
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
                                        onPress={() => {
                                            //setMembers(item.email);
                                            setGroupName(item.email);
                                            handleCreateDm(item.email);
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
                            onPress={() => setDmModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal for Joining Group  */}
            <Modal visible={joinModalVisible} animationType="slide" transparent={true}>
                <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                    <View style={[{ width: '80%', backgroundColor: '#fff', borderRadius: 10, padding: 20 }, isDarkTheme ? styles.darkBackground : styles.lightBackground]}>
                        <Text style={[{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }, isDarkTheme ? styles.darkText : styles.lightText]}>Select a Study Group</Text>
                        {loading ? (
                            <ActivityIndicator size="large" color="#007AFF" />
                        ) : (
                            <FlatList
                                data={groupsAll}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }, isDarkTheme ? styles.darkText : styles.lightText]}
                                        onPress={async () => {
                                            // Handle group selection
                                            setGroupToEdit(item); // Set the group being edited
                                            console.log('Selected group:', item);
                                            const token = await AsyncStorage.getItem('token');
                                            const user = await getCurrentUser({ token });
                                            const email = user.data.email;
                                            await addStudyGroupMembers(item._id, email);
                                            fetchGroups();
                                            setJoinModalVisible(false);
                                        }}
                                    >
                                        <Text style={[{ fontSize: 16 }, isDarkTheme ? styles.darkText : styles.lightText]}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                        <TouchableOpacity onPress={() => setJoinModalVisible(false)} style={{ marginTop: 10, padding: 10, backgroundColor: '#ccc', borderRadius: 5 }}>
                            <Text>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/*Error Modal*/}
            <Modal visible={errorModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>There Was An Error Completing the Task</Text>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setErrorModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/*Success Modal*/}
            <Modal visible={successModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Task Completed Successfully!</Text>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setSuccessModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Close</Text>
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
    groupText: { fontSize: 18, padding: 15 },
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
        marginBottom: 10
    },
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
        backgroundColor: 'grey',
        fontSize: 18,
        borderRadius: 5,
        borderWidth: 2,
        width: '10%',
    },
    editText: {
        fontSize: 18,
        borderRadius: 5,
        backgroundColor: 'grey',
        marginVertical: 1,
        borderWidth: 2,
        width: '10%',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Ensures spacing between the title and button
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    joinButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginHorizontal: 7
    },
    joinButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    /* Dark Mode */
    darkBackground: { backgroundColor: "#121212" },
    darkText: { color: "#F1F1F1" },
    darkModal: { backgroundColor: "#1E1E1E" },
    darkInput: {
        backgroundColor: "#333", borderColor: "#555", color: "#F1F1F1"
    },
    /* Light Mode */
    lightBackground: { backgroundColor: "#FFFFFF" },
    lightText: { color: "#333" },
    lightModal: { backgroundColor: "white" },
    lightInput: {
        backgroundColor: "#FFF", borderColor: "#CCC", color: "#333"
    },
    notificationIcon: {
        position: 'absolute',
        right: -40,
        top: 10,
        padding: 50
    },
    groupItemNoMessage: {
        backgroundColor: '#f8f8f8',  // Light background color for the group item
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,  // Rounded corners for a button-like appearance
        marginBottom: 8,  // Spacing between items
        elevation: 2,  // Shadow for Android
        shadowColor: '#000',  // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },  // Vertical shadow offset
        shadowOpacity: 0.1,  // Shadow opacity
        shadowRadius: 4,  // Shadow blur radius
    },
    groupItemMessage: {
        backgroundColor: '#e0f7fa',  // Light blue background color for the group item with a new message
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,  // Rounded corners for a button-like appearance
        marginBottom: 8,  // Spacing between items
        elevation: 2,  // Shadow for Android
        shadowColor: '#000',  // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },  // Vertical shadow offset
        shadowOpacity: 0.1,  // Shadow opacity
        shadowRadius: 4,  // Shadow blur radius
    },
    toggleButton: {
        backgroundColor: '#f1c40f', // Change the color as per your design
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginLeft: 10, // Add space between buttons
    },
    buttonsContainer: {
        flexDirection: 'row',     // Aligns buttons horizontally (side by side)
        alignItems: 'center',     // Ensures buttons are vertically centered
        justifyContent: 'center', // Aligns buttons in the center, or use 'flex-start' if you want them aligned to the left
        marginTop: 10,            // Adds space between title and buttons
    },
    groupItemTaggedMessage: {
        backgroundColor: '#fce4ec',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff4081',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    groupTextContainer: {
        flexDirection: 'column',
    },
    taggedText: {
        fontSize: 12,
        color: '#d81b60',
        fontWeight: 'bold',
        marginTop: 4,
    },
    newMessageText: {
        fontSize: 12,
        color: '#0066cc',
        fontWeight: 'bold',
        marginTop: 4,
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
    profileCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    profileInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});


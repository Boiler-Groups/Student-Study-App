import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { getGroupMessages, sendMessage, deleteMessage, getGroupMembers } from './api/studygroup.js'; // Import API functions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from './api/user.js';
import { useNavigation } from 'expo-router';
import { useRouter } from 'expo-router';

const GroupChatPage = ({  }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const flatListRef = useRef(null);
    const [username, setUsername] = useState("");
    const [groupTitle, setGroupTitle] = useState('');
    const [selectedMessageId, setSelectedMessageId] = useState(null); // State to track selected message
    const [groupMembers, setGroupMembers] = useState([]); // Store group members

    const { groupId } = useLocalSearchParams();
    const navigation = useNavigation();
    const router = useRouter();

    const getUsername = async () => {
        const token = await AsyncStorage.getItem('token');
        const user = await getCurrentUser({ token });
        return user.data.username;
    };

    useEffect(() => {
        const fetchUsername = async () => {
            const user = await getUsername();
            setUsername(user);
        };

        fetchUsername();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            title: groupTitle || "Group Chat", // Default title if groupTitle is not set
            headerRight: () => (
                <TouchableOpacity onPress={handleNavigateToMembers}>
                    <Text style={{ marginRight: 20, color: '#007bff', fontWeight: 'bold' }}>Members</Text>
                </TouchableOpacity>
            ), // Add Members button to top bar
        });
    }, [groupTitle, navigation]);

    const loadMessages = async () => {
        const token = await AsyncStorage.getItem('token');
        const fetchedMessages = await getGroupMessages(token, groupId);
        setMessages(fetchedMessages); // Reverse to show oldest first
    };

    const loadGroupMembers = async () => {
        const token = await AsyncStorage.getItem('token');
        const members = await getGroupMembers(token, groupId);
        setGroupMembers(members); // Store members in state
    };

    useEffect(() => {
        loadMessages();
        loadGroupMembers(); // Fetch group members when component mounts
    }, [groupId]);

    const handleSendMessage = async () => {
        if (text.trim() === '') return;

        const token = await AsyncStorage.getItem('token');
        const newMessage = await sendMessage(token, groupId, text);
        if (newMessage) {
            loadMessages();
            setText('');
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    };

    const handleDeleteMessage = async (messageId) => {
        const token = await AsyncStorage.getItem('token');
        const response = await deleteMessage(token, groupId, messageId); // API call to delete message
        if (response.success) {
            setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
            setSelectedMessageId(null); // Reset selected message
            Alert.alert('Message Deleted', 'Your message has been deleted successfully.');
        } else {
            Alert.alert('Error', 'Failed to delete the message.');
        }
    };

    const handleSelectMessage = (messageId) => {
        if (username === messages.find(msg => msg._id === messageId)?.sender) {
            setSelectedMessageId(prevSelected => prevSelected === messageId ? null : messageId); // Toggle selection
        }
    };

    // Navigate to the Members List page
    const handleNavigateToMembers = () => {
        navigation.navigate('membersList', { groupId });

    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.messageContainer,
                            item.sender === username ? styles.myMessage : styles.otherMessage
                        ]}
                        onPress={() => handleSelectMessage(item._id)} // Click to select message
                    >
                        <Text style={styles.sender}>{item.sender}</Text>
                        <Text style={styles.messageText}>{item.text}</Text>
                        {item._id === selectedMessageId && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteMessage(item._id)}
                            >
                                <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
                extraData={selectedMessageId} // This ensures the UI updates when the selection changes
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    messageContainer: {
        padding: 10,
        margin: 5,
        borderRadius: 10,
        maxWidth: '80%',
        flexDirection: 'column',
        position: 'relative',
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007bff',
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e0e0e0',
    },
    sender: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    messageText: {
        fontSize: 16,
        color: '#fff',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#ccc',
    },
    input: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    sendText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginTop: 5,
        alignSelf: 'flex-start',
    },
    deleteText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default GroupChatPage;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { getGroupMessages, sendMessage, deleteMessage, getStudyGroupName, likeMessage } from './api/studygroup.js'; // Import API functions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../components/ThemeContext';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from './api/user.js';
import { useNavigation } from 'expo-router';
import { useRouter } from 'expo-router';

const GroupChatPage = ({ }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const flatListRef = useRef(null);
    const { isDarkTheme } = useTheme();
    const [username, setUsername] = useState("");
    const [groupTitle, setGroupTitle] = useState('');
    const [selectedMessageId, setSelectedMessageId] = useState(null); // State to track selected message

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
        setMessages(fetchedMessages);
    };

    // useEffect(() => {
    //     loadMessages();
    // }, [groupId]);

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

            loadMessages();
            fetchGroupName();
        }, [groupId])
    );

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
        const response = await deleteMessage(token, groupId, messageId);
        if (response.status == 200) {
            loadMessages();
            setSelectedMessageId(null); // Reset selected message
            Alert.alert('Message Deleted', 'Your message has been deleted successfully.');
        } else {
            Alert.alert('Error', 'Failed to delete the message.');
        }
    };

    const handleSelectMessage = (messageId) => {
        const message = messages.find(msg => msg._id === messageId);
        console.log(message)
        console.log(messageId)
        if (message && message.sender === username) {
            setSelectedMessageId(prevSelected => (prevSelected === messageId ? null : messageId)); // Toggle selection
        }
    };

    const handleReactToMessage = async (messageId, reaction) => {
        const token = await AsyncStorage.getItem('token');
        if (reaction === 'like') {
            const response = likeMessage(token, groupId, messageId);
        } else {
            const response = likeMessage(token, groupId, messageId);
        }
        loadMessages();

        setSelectedMessageId(null);
    }

    const handleToggleReaction = async (messageId) => {
        const token = await AsyncStorage.getItem('token');

        // setMessages(prevMessages =>
        //     prevMessages.map(msg => {
        //         if (msg._id === messageId) {
        //             const hasReacted = msg.reactions?.includes(username);
        //             return {
        //                 ...msg,
        //                 reactions: hasReacted
        //                     ? msg.reactions.filter(user => user !== username) // Remove reaction
        //                     : [...(msg.reactions || []), username] // Add reaction
        //             };
        //         }
        //         return msg;
        //     })
        // );

        //await toggleMessageReaction(token, groupId, messageId);
    };

    // Navigate to the Members List page
    const handleNavigateToMembers = () => {
        navigation.navigate('membersList', { groupId });

    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}
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
                        onPress={() => handleSelectMessage(item._id)}
                    >
                        <Text style={styles.sender}>{item.sender}</Text>
                        <Text style={[styles.messageText, { color: item.sender === username ? '#FFFFFF' : '#000000' }]}>
                            {item.text}
                        </Text>

                        {/* Display reactions */}
                        {item.reactions && item.reactions.length > 0 && (
                            <Text style={styles.reactionText}>
                                {item.reactions.join(' ')}
                            </Text>
                        )}

                        {/* Show reaction options if the message is selected */}
                        {item._id === selectedMessageId && (
                            <View style={styles.reactionContainer}>
                                <TouchableOpacity onPress={() => handleToggleReaction(item._id)} style={styles.reactionButton}>
                                    <Text style={styles.reactionIcon}>{item.reactions?.includes(username) ? '👍' : '👍🏻'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleReactToMessage(item._id, 'dislike')}>
                                    <Text style={styles.reactionButton}>👎</Text>
                                </TouchableOpacity>
                                {item.sender === username && (
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteMessage(item._id)}>
                                        <Text style={styles.deleteText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                extraData={selectedMessageId}
            />
            <View style={[styles.inputContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
                <TextInput
                    style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                    onSubmitEditing={handleSendMessage}
                    blurOnSubmit={false}
                    returnKeyType="send"
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
    },
    statusMessageContainer: {
        alignSelf: 'center',
        marginVertical: 5,
    },
    statusMessage: {
        fontSize: 14,
        color: 'gray',
        textAlign: 'center',
        userSelect: 'none',
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
    /* Light Mode Styles */
    lightBackground: {
        backgroundColor: "#FFFFFF",
    },
    lightChatWrapper: {
        backgroundColor: "#F5F5F5",
        borderColor: "#CCC",
        borderWidth: 1,
    },
    lightText: {
        color: "#333",
    },
    lightInputContainer: {
        backgroundColor: "#F5F5F5",
        borderTopColor: "#CCC",
    },
    lightInput: {
        backgroundColor: "#FFF",
        borderColor: "#CCC",
        color: "#333",
    },
    lightButton: {
        backgroundColor: "#007AFF",
    },

    /* Dark Mode Styles */
    darkBackground: {
        backgroundColor: "#121212",
    },
    darkChatWrapper: {
        backgroundColor: "#1E1E1E",
        borderColor: "#555",
        borderWidth: 1,
    },
    darkInputContainer: {
        backgroundColor: "#1E1E1E",
        borderTopColor: "#555",
    },
    darkInput: {
        backgroundColor: "#333",
        borderColor: "#555",
        color: "#F1F1F1",
    },
    darkButton: {
        backgroundColor: "#007AFF",
    },
    darkButtonText: {
        color: "#FFF",
    },
    darkText: {
        color: "#F1F1F1",
    },
    reactionIcon: {
        marginTop: 5,
        alignSelf: 'flex-start',
    },
    reactionButton: {
        marginTop: 5,
        alignSelf: 'flex-start',
    },
});

export default GroupChatPage;

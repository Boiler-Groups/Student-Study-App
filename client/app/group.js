import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import {
    getGroupMessages,
    sendMessage,
    deleteMessage,
    getStudyGroupName,
    addAllMembersToUnopenedMessageGroup,
    removeMemberFromUnopenedMessageGroup,
    getMembersWithUnopenedMessages } from './api/studygroup.js'; // Import API functions
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
    const [userEmail, setUserEmail] = useState("");
    const [groupTitle, setGroupTitle] = useState('');
    const [selectedMessageId, setSelectedMessageId] = useState(null); // State to track selected message
    const [replyingTo, setReplyingTo] = useState(null);

    const { groupId } = useLocalSearchParams();
    const navigation = useNavigation();
    const router = useRouter();

    const getUsername = async () => {
        const token = await AsyncStorage.getItem('token');
        const user = await getCurrentUser({ token });
        return user.data.username;
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const token = await AsyncStorage.getItem('token');
            const user = await getCurrentUser({ token });
            setUsername(user.data.username);
            setUserEmail(user.data.email);
        };

        fetchUserData();
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

    const renderMessageWithTags = (text) => {
        if (!text) return null;

        const emailRegex = /(@[\w.-]+@[\w.-]+\.\w+)/g;
        const parts = text.split(emailRegex);

        return parts.map((part, index) => {
            if (part.match(emailRegex)) {
                return (
                    <Text
                        key={index}
                        style={[
                            styles.taggedEmail,
                            { color: isDarkTheme ? '#FFD700' : '#0066CC' }
                        ]}
                    >
                        {part}
                    </Text>
                );
            }
            return <Text key={index}>{part}</Text>;
        });
    };

    const isUserTagged = (messageText) => {
        if (!messageText || !userEmail) return false;

        const userTag = `@${userEmail}`;
        return messageText.includes(userTag);
    };

    const handleSendMessage = async () => {
        if (text.trim() === '') return;

        const token = await AsyncStorage.getItem('token');

        // Check if this is a reply
        let newMessage;
        if (replyingTo) {
            const replyData = {
                replyToId: replyingTo._id,
                replyToSender: replyingTo.sender,
                replyToText: replyingTo.text
            };
            newMessage = await sendMessage(token, groupId, text, replyData);
            setReplyingTo(null);
        } else {
            newMessage = await sendMessage(token, groupId, text);
        }
        let addAll = await addAllMembersToUnopenedMessageGroup(groupId);
        console.log("User email was:",userEmail);
        let removed = await removeMemberFromUnopenedMessageGroup(groupId,userEmail);
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

        if (message) {
            setSelectedMessageId(prevSelected => (prevSelected === messageId ? null : messageId));
        }
    };

    const handleReply = (message) => {
        setReplyingTo(message);
        setSelectedMessageId(null);
        if (inputRef && inputRef.current) {
            inputRef.current.focus();
        }
    };

    const inputRef = useRef(null);

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const isReplyToCurrentUser = (message) => {
        if (!message || !message.replyToSender || !username) return false;
        return message.replyToSender === username;
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
                    item.sender === '_status_' ? (
                        <View style={styles.statusMessageContainer}>
                            <Text style={styles.statusMessage}>{item.text}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.messageContainer,
                                item.sender === username ? styles.myMessage : styles.otherMessage,
                                // Highlight tagged messages
                                isUserTagged(item.text) && {
                                    borderWidth: 2,
                                    borderColor: '#FFD700',
                                    backgroundColor: isDarkTheme ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 224, 0.5)'
                                },
                                // Highlight replies to current user
                                isReplyToCurrentUser(item) && {
                                    borderWidth: 2,
                                    borderColor: '#FFD700',
                                    backgroundColor: isDarkTheme ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 255, 224, 0.5)'
                                }
                            ]}
                            onPress={() => handleSelectMessage(item._id)}
                        >
                            <Text style={styles.sender}>{item.sender}</Text>

                            {/* Display reply information if this message is a reply */}
                            {item.replyToId && (
                                <View style={[
                                    styles.replyPreview,
                                    isDarkTheme ? styles.darkReplyPreview : styles.lightReplyPreview,
                                    isReplyToCurrentUser(item) && styles.highlightedReply
                                ]}>
                                    <Text style={styles.replyToSender}>
                                        Reply to {isReplyToCurrentUser(item) ? "you" : `@${item.replyToSender}`}
                                    </Text>
                                    <View style={styles.replyToContent}>
                                        <Text
                                            style={[
                                                styles.replyToText,
                                                isDarkTheme ? styles.darkReplyToText : styles.lightReplyToText
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {item.replyToText}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.messageTextContainer}>
                                {renderMessageWithTags(item.text)}
                            </View>

                            {item._id === selectedMessageId && (
                                <View style={styles.messageActions}>
                                    {/* Only show delete for user's own messages */}
                                    {item.sender === username && (
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDeleteMessage(item._id)}
                                        >
                                            <Text style={styles.deleteText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                    {/* Show reply for all messages */}
                                    <TouchableOpacity
                                        style={styles.replyButton}
                                        onPress={() => handleReply(item)}
                                    >
                                        <Text style={styles.replyText}>Reply</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                )}
                extraData={[selectedMessageId, userEmail, replyingTo, username, isDarkTheme]}
            />

            {/* Reply Preview */}
            {replyingTo && (
                <View style={[styles.replyingToContainer, isDarkTheme ? styles.darkReplyContainer : styles.lightReplyContainer]}>
                    <View style={styles.replyingToContent}>
                        <Text style={[styles.replyingToHeader, isDarkTheme ? styles.darkText : styles.lightText]}>
                            Replying to <Text style={styles.replyingToName}>@{replyingTo.sender}</Text>
                        </Text>
                        <Text
                            style={[
                                styles.replyingToText,
                                isDarkTheme ? styles.darkReplyToText : styles.lightReplyToText
                            ]}
                            numberOfLines={1}
                        >
                            {replyingTo.text}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.cancelReplyButton} onPress={cancelReply}>
                        <Text style={styles.cancelReplyText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.inputContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
                <TextInput
                    ref={inputRef}
                    style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                    value={text}
                    onChangeText={setText}
                    placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                    onSubmitEditing={handleSendMessage}
                    blurOnSubmit={false}
                    returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Text style={styles.sendText}>{replyingTo ? "Reply" : "Send"}</Text>
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
    messageTextContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    taggedEmail: {
        fontWeight: 'bold',
        backgroundColor: 'rgb(200, 255, 0)',
        borderRadius: 3,
        paddingHorizontal: 2,
        marginHorizontal: 1,
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
    messageActions: {
        flexDirection: 'row',
        marginTop: 5,
    },
    deleteButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    deleteText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    replyButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    replyText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    replyPreview: {
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    lightReplyPreview: {
        backgroundColor: '#e6e6e6',
        borderWidth: 1,
        borderColor: '#d0d0d0',
    },
    darkReplyPreview: {
        backgroundColor: '#2c2c2c',
        borderWidth: 1,
        borderColor: '#444',
    },
    replyToSender: {
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 3,
        color: '#2196F3',
    },
    replyToContent: {
        opacity: 1,
    },
    replyToText: {
        fontSize: 13,
    },
    lightReplyToText: {
        color: '#666',
    },
    darkReplyToText: {
        color: '#aaa',
    },
    highlightedReply: {
        borderLeftColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
    },
    replyingToContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    lightReplyContainer: {
        backgroundColor: '#f0f0f0',
        borderTopColor: '#ddd',
    },
    darkReplyContainer: {
        backgroundColor: '#2A2A2A',
        borderTopColor: '#444',
    },
    replyingToContent: {
        flex: 1,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
        paddingLeft: 8,
    },
    replyingToHeader: {
        fontSize: 12,
        marginBottom: 2,
    },
    replyingToName: {
        fontWeight: 'bold',
        color: '#2196F3',
    },
    replyingToText: {
        fontSize: 13,
        opacity: 0.7,
    },
    cancelReplyButton: {
        padding: 8,
    },
    cancelReplyText: {
        fontSize: 16,
        color: '#888',
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
});

export default GroupChatPage;
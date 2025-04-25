import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useTheme } from '../components/ThemeContext';
import Header from '../components/Header';
import { buttonPressSound } from '../sounds/soundUtils.js';


export default function Chat() {
    const { isDarkTheme } = useTheme();
    const [messages, setMessages] = useState([
        { id: '1', text: 'Hey hows it going!', sender: 'user2' },
        { id: '2', text: 'Did you finish the homework?', sender: 'user2' }
    ]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    const handleSend = () => {
        if (inputText.trim() === '') return;

        const newMessage = {
            id: String(messages.length + 1),
            text: inputText,
            sender: 'user'
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // Simulate a response after a delay
        setTimeout(() => {
            setMessages(prevMessages => [
                ...prevMessages,
                { id: String(prevMessages.length + 1), text: "Yeah this class sucks.", sender: 'user2' }
            ]);
        }, 1000);

        // Auto-scroll to the bottom
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, isDarkTheme ? styles.darkBackground : styles.lightBackground]}
        >
            <Header />
            <Text style={[styles.otherUserText, isDarkTheme ? styles.darkText : styles.lightText]}>Chat with user2</Text>
            <View style={[styles.chatWrapper, isDarkTheme ? styles.darkChatWrapper : styles.lightChatWrapper]}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.receiverBubble]}>
                            <Text style={[
                                styles.messageText,
                                item.sender === 'user' ? styles.userText : styles.receiverText
                            ]}>
                                {item.text}
                            </Text>
                        </View>
                    )}
                    contentContainerStyle={styles.chatContainer}
                />
                <View style={[styles.inputContainer, isDarkTheme ? styles.darkInputContainer : styles.lightInputContainer]}>
                    <TextInput
                        style={[styles.input, isDarkTheme ? styles.darkInput : styles.lightInput]}
                        placeholder="Type a message..."
                        placeholderTextColor={isDarkTheme ? "#BBB" : "#555"}
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <TouchableOpacity style={[styles.sendButton, isDarkTheme ? styles.darkButton : styles.lightButton]} onPress={async()=>{
                        await buttonPressSound();
                        handleSend();
                    }}>
                        <Text style={[styles.buttonText, isDarkTheme ? styles.darkButtonText : styles.darkButtonText]}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    otherUserText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    chatWrapper: {
        width: '20%',
        height: '80%',
        borderRadius: 15,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatContainer: {
        flexGrow: 1,
        paddingHorizontal: 10,
        justifyContent: 'flex-end',
    },
    messageBubble: {
        maxWidth: '100%',
        padding: 10,
        borderRadius: 10,
        marginBottom: 8,
        marginHorizontal: 0,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    receiverBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#E0E0E0',
    },
    messageText: {
        fontSize: 16,
    },
    userText: {
        color: "#F1F1F1", 
    },
    receiverText: {
        color: "#333", 
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        width: '100%',
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    sendButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
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
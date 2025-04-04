import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
    Modal,
    ScrollView,
    Image
} from 'react-native'; // Import react Native
import {
    getGroupMessages,
    sendMessage,
    deleteMessage,
    getStudyGroupName,
    addAllMembersToUnopenedMessageGroup,
    removeMemberFromUnopenedMessageGroup,
    removeTaggedOrRepliedUser,
    likeMessage,
    toggleMessageLike,
    toggleMessageDislike,
    checkIsDM
} from './api/studygroup.js'; // Import API functions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../components/ThemeContext';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getCurrentUser, getUserFromId } from './api/user.js';
import { useNavigation } from 'expo-router';
import { useRouter } from 'expo-router';

const GroupChatPage = ({ }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [targetTime, setTargetTime] = useState(0);
    const flatListRef = useRef(null);
    const { isDarkTheme } = useTheme();
    const [user, setUser] = useState("");
    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const [selectedReactions, setSelectedReactions] = useState([]); // list of reaction strings
    const [username, setUsername] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [groupTitle, setGroupTitle] = useState('');
    const [selectedMessageId, setSelectedMessageId] = useState(null); // State to track selected message
    const [replyingTo, setReplyingTo] = useState(null);
    const [imageUploadModule, setImageUploadModule] = useState(false);
    const [automateMessageModule, setAutomateMessageModule] = useState(false);
    const [isDM, setDM] = useState(false);
    const [usernamesById, setUsernamesById] = useState({});

    const [image, setImage] = useState('');
    const { groupId } = useLocalSearchParams();
    const navigation = useNavigation();
    const intervalRef = useRef(null);  // Store the interval ID

    const scheduleMinuteRef = useRef(0);
    const scheduleHourRef = useRef(0);
    const [scheduleMinute, setScheduleMinute] = useState('');
    const [scheduleHour, setScheduleHour] = useState('');

    const router = useRouter();

    const getUser = async () => {
        const token = await AsyncStorage.getItem('token');
        const user = await getCurrentUser({ token });
        return user;
    };

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getUser();
            setUser(user);
        };

        fetchUser();

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
            title: groupTitle || "Group Chat",
            headerRight: () => (
                <TouchableOpacity
                    onPress={isDM ? handleNavigateToDmInfo : handleNavigateToMembers}
                >
                    <Text style={{ marginRight: 20, color: '#007bff', fontWeight: 'bold' }}>
                        {isDM ? "Info" : "Members"}
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [groupTitle, navigation, isDM]);

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
                    const dm = await checkIsDM(groupId);
                    console.log(dm)
                    setDM(dm.data);
                    setGroupTitle(name.data);
                } catch (e) {
                    console.error("Failed to fetch group name:", e);
                }
            };

            const clearNotifications = async () => {
                try {
                    await removeMemberFromUnopenedMessageGroup(groupId, userEmail);
                    await removeTaggedOrRepliedUser(groupId, userEmail);
                } catch (e) {
                    console.error("Failed to clear notifications:", e);
                }
            };

            loadMessages();
            fetchGroupName();
            if (userEmail) {
                clearNotifications();
            }
        }, [groupId, userEmail])
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
        if (text.trim() === '') {
            console.log("Returned early text was trim")
            stopScheduler();
            return;
        }
        stopScheduler();

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
        console.log("User email was:", userEmail);
        let removed = await removeMemberFromUnopenedMessageGroup(groupId, userEmail);
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
        setSelectedMessageId(prevSelected => (prevSelected === messageId ? null : messageId));
    };

    const handleReactToMessage = async (messageId, reaction) => {
        const token = await AsyncStorage.getItem('token');
        if (reaction === 'like') {
            const response = likeMessage(token, groupId, messageId);
        } else {
            const response = likeMessage(token, groupId, messageId);
        }
        const message = messages.find(msg => msg._id === messageId);

        if (message) {
            setSelectedMessageId(prevSelected => (prevSelected === messageId ? null : messageId));
        }
        loadMessages();

        setSelectedMessageId(null);
    }

    const handleToggleReaction = async (messageId) => {
        const token = await AsyncStorage.getItem('token');

        setMessages(prevMessages =>
            prevMessages.map(msg => {
                if (msg._id === messageId) {
                    const hasReacted = msg.reactions?.includes(`${user.data._id}-like`);
                    return {
                        ...msg,
                        reactions: hasReacted
                            ? msg.reactions.filter(curUser => curUser !== `${user.data._id}-like`) // Remove reaction
                            : [...(msg.reactions || []), user.data._id] // Add reaction
                    };
                }
                return msg;
            })
        );

        await toggleMessageLike(token, groupId, messageId);
        loadMessages();
    };

    const handleToggleDislike = async (messageId) => {
        const token = await AsyncStorage.getItem('token');

        setMessages(prevMessages =>
            prevMessages.map(msg => {
                if (msg._id === messageId) {
                    const hasReacted = msg.reactions?.includes(`${user.data._id}-dislike`);
                    return {
                        ...msg,
                        reactions: hasReacted
                            ? msg.reactions.filter(curUser => curUser !== user.data._id) // Remove reaction
                            : [...(msg.reactions || []), user.data._id] // Add reaction
                    };
                }
                return msg;
            })
        );

        await toggleMessageDislike(token, groupId, messageId);
        loadMessages();
        console.log(messages)
    };

    const countReactions = (reactions) => {
        let likes = 0;
        let dislikes = 0;

        (reactions || []).forEach(reaction => {
            if (reaction.endsWith('-like')) likes++;
            if (reaction.endsWith('-dislike')) dislikes++;
        });

        return { likes, dislikes };
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
    const handleNavigateToDmInfo = () => {
        navigation.navigate('dmInfo', { groupId });
    }
    const convertToBase64 = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setImage(reader.result);
        };
        reader.onerror = (error) => {
            console.error('Error:', error);
        };

    };
    const handleImageUpload = () => {
        //Can be adjusted to send automatically if needed
        setText(image)
        //Reset the current image value
        setImage(null)
    };
    const isBase64Image = (encodedBase64ImageStr) => {
        //Create a regex expression to deter Users from accidentally writing something that would be considered an image.
        const base64ImageRegex = /^data:image\/(png|jpeg|jpg|gif|bmp|webp);base64,[A-Za-z0-9+/=]+$/;

        //Check if the encoded string is indeed an image.
        return base64ImageRegex.test(encodedBase64ImageStr);
    };

    const startMessageScheduler = () => {
        //calculateDelayUntilTargetTime()

        clearInterval(intervalRef.current);  // Clear existing interval
        intervalRef.current = null;  // Reset the ref

        const delay = calculateDelayUntilTargetTime();
        // Wait until the target time
        intervalRef.current = setTimeout(() => {
            console.log("Reached target time, sending message...");
            handleSendMessage();
        }, delay);
    };

    const stopScheduler = () => {
        console.log("Stopping Scheduler");
        if (intervalRef.current) {
            clearInterval(intervalRef.current);  // Clear existing interval
            intervalRef.current = null;  // Reset the ref
            //setText("");
            setScheduleMinute("");
            setScheduleHour("");
            scheduleMinuteRef.current = 0;
            scheduleHourRef.current = 0;
            setTargetTime(0);
        }
    };

    const calculateDelayUntilTargetTime = () => {
        // Target time (24-hour format) → Ex. 15 = 3:00 PM
        const curr = new Date();
        const defaultHour = curr.getHours();   // Get current hour
        const defaultMinute = curr.getMinutes(); // Get Current minute
        const defaultSecond = curr.getSeconds();  // Get current second

        if (!scheduleMinuteRef.current || scheduleMinuteRef.current === 0 || scheduleMinuteRef.current < 0 || scheduleMinuteRef.current > 59) {
            scheduleMinuteRef.current = defaultMinute + 1;
        }
        if (!scheduleHourRef.current || scheduleHourRef.current === 0 || scheduleHourRef.current < 0 || scheduleHourRef.current > 23) {
            scheduleHourRef.current = defaultHour;
        }


        const now = new Date();
        const target = new Date();

        // Set target time based on refs
        target.setHours(scheduleHourRef.current, scheduleMinuteRef.current, 0, 0);

        // Format Time Properly (HH:MM)
        const formattedTime = `${String(scheduleHourRef.current).padStart(2, "0")}:${String(scheduleMinuteRef.current).padStart(2, "0")}`;

        if (target <= now) {
            // If target time has passed for today, schedule it for tomorrow
            console.log("Time passed adding one day")
            target.setDate(target.getDate() + 1);

        }

        const delay = target.getTime() - now.getTime();
        setTargetTime(delay);
        console.log(`Delay until target time: ${delay / 1000} seconds`);
        return delay;
    };

    // useEffect(() => {
    //     console.log("Target time updated:", targetTime / 1000, "seconds"); // Log targetTime in seconds
    // }, [targetTime]);  // Only runs when targetTime changes

    const handleHourChange = (text) => {
        setScheduleHour(text);
        scheduleHourRef.current = text;  // Update the ref
    };

    const handleMinuteChange = (text) => {
        setScheduleMinute(text);
        scheduleMinuteRef.current = text;  // Update the ref
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTargetTime(prevTime => Math.max(prevTime - 1000, 0)); // Decrease by 1 second, prevent negatives
        }, 1000);

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    useEffect(() => {
        if (text === "Hey Everyone Lets Schedule a Meeting!!!") {
            startMessageScheduler();
            setAutomateMessageModule(false);
        }
    }, [text]);

    const openReactionsModal = async (reactions) => {
        const userIds = reactions.map(r => r.split('-')[0]);
        const uniqueIds = [...new Set(userIds)];

        const newUsernames = {};
        await Promise.all(uniqueIds.map(async (id) => {
            if (!usernamesById[id]) {
                try {
                    const user = await getUserFromId(id);
                    const username = user.data.username;
                    newUsernames[id] = username;
                } catch (err) {
                    newUsernames[id] = "Unknown";
                }
            }
        }));

        setUsernamesById(prev => ({ ...prev, ...newUsernames }));
        setSelectedReactions(reactions);
        setShowReactionsModal(true);
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
                                        {isBase64Image(item.replyToText) ? (
                                            // Display image if it's a base64 image
                                            <Image source={{ uri: item.replyToText }} style={styles.messageImage} />
                                        ) : (
                                            <Text
                                                style={[
                                                    styles.replyToText,
                                                    isDarkTheme ? styles.darkReplyToText : styles.lightReplyToText
                                                ]}
                                                numberOfLines={2}
                                            >
                                                {item.replyToText}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            )}

                            <View style={styles.messageTextContainer}>
                                {isBase64Image(item.text) ? (
                                    <View>
                                        <Image source={{ uri: item.text }} style={styles.messageImage} />
                                    </View>
                                ) : (
                                    <>
                                        {renderMessageWithTags(item.text)} {/* Return your message here */}
                                    </>
                                )}
                            </View>

                            {/* Display reactions */}
                            {item.reactions && item.reactions.length > 0 && (() => {
                                const { likes, dislikes } = countReactions(item.reactions);
                                return (
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                                        {likes > 0 && (
                                            <TouchableOpacity
                                                onPress={() => openReactionsModal(item.reactions.filter(r => r.endsWith('-like')))}
                                            >
                                                <Text style={styles.reactionIcon}>👍 {likes}</Text>
                                            </TouchableOpacity>
                                        )}
                                        {dislikes > 0 && (
                                            <TouchableOpacity
                                            onPress={() => openReactionsModal(item.reactions.filter(r => r.endsWith('-dislike')))}
                                            >
                                                <Text style={styles.reactionIcon}>👎 {dislikes}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })()}

                            {/* Show action buttons if the message is selected */}
                            {item._id === selectedMessageId && (
                                <View style={styles.reactionContainer}>
                                    <TouchableOpacity
                                        onPress={() => handleToggleReaction(item._id)}
                                        style={[
                                            styles.reactionButton,
                                            item.reactions?.includes(`${user.data._id}-like`) && styles.selectedReactionButton
                                        ]}
                                    >
                                        <Text style={[
                                            styles.reactionIcon,
                                            item.reactions?.includes(`${user.data._id}-like`) && styles.selectedReactionIcon
                                        ]}>
                                            👍
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => handleToggleDislike(item._id)}
                                        style={[
                                            styles.reactionButton,
                                            item.reactions?.includes(`${user.data._id}-dislike`) && styles.selectedReactionButton
                                        ]}
                                    >
                                        <Text style={[
                                            styles.reactionIcon,
                                            item.reactions?.includes(`${user.data._id}-dislike`) && styles.selectedReactionIcon
                                        ]}>
                                            👎
                                        </Text>
                                    </TouchableOpacity>

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
                        {/* Check if the reply is an image */}
                        {isBase64Image(replyingTo.text) ? (
                            <Image source={{ uri: replyingTo.text }} style={styles.messageImage} />
                        ) : (
                            <Text
                                style={[styles.replyingToText, isDarkTheme ? styles.darkReplyToText : styles.lightReplyToText]}
                                numberOfLines={1}
                            >
                                {replyingTo.text}
                            </Text>
                        )}
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
                <TouchableOpacity style={styles.moreOptionsButton} onPress={() => setImageUploadModule(true)}>
                    <Text style={styles.sendText}>{"+"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.automateButton} onPress={() => { setAutomateMessageModule(true) }}>
                    <Text style={styles.sendText}>{"Automate Message"}</Text>
                </TouchableOpacity>
                <Text style={styles.modalSubTitle}> Sending in {Math.floor(targetTime / 1000)}s</Text>
            </View>
            {showReactionsModal && (
                <View style={styles.reactModalOverlay}>
                    <View style={styles.reactModalContent}>
                        <Text style={styles.reactModalTitle}>Reactions</Text>
                        {selectedReactions.map((reaction, index) => {
                            const [userId, type] = reaction.split('-');
                            const emoji = type === 'like' ? '👍' : '👎';
                            return (
                                <Text key={index} style={styles.reactionListItem}>
                                    {emoji} {usernamesById[userId] || userId}
                                </Text>
                            );
                        })}
                        <TouchableOpacity onPress={() => setShowReactionsModal(false)} style={styles.reactModalCloseButton}>
                            <Text style={styles.reactModalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Modal for Uploading Images*/}
            <Modal visible={imageUploadModule} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Upload an Image</Text>

                        {/* Display Selected Image */}
                        {image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <Text>No image selected</Text>
                        )}

                        {/* Image Selection Button */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => convertToBase64(e.target.files[0]);
                                input.click();
                            }}
                        >
                            <Text style={styles.buttonText}>Select Image</Text>
                        </TouchableOpacity>

                        {/* Upload Button */}
                        <TouchableOpacity style={styles.button} onPress={() => {
                            handleImageUpload()
                            setImageUploadModule(false)
                        }}>
                            <Text style={styles.buttonText}>Upload</Text>
                        </TouchableOpacity>

                        {/* Close Button */}
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setImageUploadModule(false)}>
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal for Automating Message Send Time*/}
            <Modal visible={automateMessageModule} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Schedule a Send</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter the Hour in Military Time (Ex. 1 PM = 13)"
                            value={scheduleHour}
                            onChangeText={handleHourChange}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter the Minute Of this Hour (Ex. 3)"
                            value={scheduleMinute}
                            onChangeText={handleMinuteChange}
                        />
                        <TouchableOpacity style={styles.button} onPress={() => {
                            if (!text) {
                                setText("Hey Everyone Lets Schedule a Meeting!!!");
                            } else {
                                startMessageScheduler();
                                setAutomateMessageModule(false);
                            }
                        }}>
                            <Text style={styles.buttonText}>Schedule Send</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => {
                            stopScheduler()
                            setAutomateMessageModule(false)
                        }}>
                            <Text style={styles.cancelButtonText}>Cancel Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    moreOptionsButton: {
        backgroundColor: '#f1c40f',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    automateButton: {
        backgroundColor: 'red',
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

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalSubTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputModal: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#FF5733',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    previewImage: {
        width: 350,
        height: 350,
        marginVertical: 10,
    },
    uploadedImage: {
        width: 350,
        height: 350,
        marginHorizontal: 5,
        borderRadius: 5,
    },
    messageImage: {
        width: 350,       // Set the width of the image
        height: 350,      // Set the height of the image
        borderRadius: 8,  // Optional: to give rounded corners to the image
        marginBottom: 10, // Optional: adds space below the image
    },
    reactionListItem: {
        fontSize: 16,
        marginVertical: 4,
    },
    reactionIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    reactionButton: {
        marginTop: 5,
        alignSelf: 'flex-start',
    },
    selectedReactionButton: {
        backgroundColor: '#d0eaff',  // light blue highlight
        borderRadius: 8,
        padding: 4,
    },
    selectedReactionIcon: {
        color: '#007bff',
        fontWeight: 'bold',
    },
    reactModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    reactModalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxHeight: '60%',
    },
    reactModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    reactModalCloseButton: {
        marginTop: 15,
        backgroundColor: '#007bff',
        paddingVertical: 8,
        borderRadius: 5,
    },
    reactModalCloseText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

export default GroupChatPage;
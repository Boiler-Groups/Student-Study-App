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

const DmInfo = () => {
    const { groupId } = useLocalSearchParams();
    const [groupMembers, setGroupMembers] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [groupTitle, setGroupTitle] = useState('');
    

    console.log(`GroupID: ${groupId}`);


    const router = useRouter();
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            title: "DM Info",

        });
    }, [navigation]);


    const handleLeaveGroup = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const user = await getCurrentUser({ token });
            const email = user.data.email;
            const removed = await removeMember(token, groupId, email);

            if (removed) {
                Alert.alert('Success', 'You have left the DM');
                //navigation.navigate('messages');
                //navigation.reset()
                //router.dismiss(2)
                router.dismissTo('messages');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to leave DM.');
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
            <Text style={styles.title}>Direct Message: {groupTitle}</Text>
            <Text style={styles.title}>Members</Text>


            {/* Action buttons */}
            <View style={styles.actionsContainer}>

                <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveButton}>
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
    closeButton: {
        marginTop: 10,
        alignSelf: 'center',
    },
    closeButtonText: {
        color: '#007bff',
        fontWeight: 'bold',
    },
});

export default DmInfo;

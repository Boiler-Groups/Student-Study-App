import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getGroupMembers } from './api/studygroup';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MembersList = ({ route }) => {
    //const { groupMembers } = route.params; // Get group members from the navigation parameters
    const { groupId } = useLocalSearchParams(); // Get groupId from the URL
    const [ groupMembers, setGroupMembers ] = useState();

    

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
            <FlatList
                data={groupMembers}
                keyExtractor={item => item._id}
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
    memberItem: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
    },
    memberName: {
        fontSize: 16,
    },
});

export default MembersList;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Landing() {
    const router = useRouter();

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <View style={styles.container}>
            <Header />
            <Text style={styles.title}>Welcome to Boiler Groups</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/home')}>
                <Text style={styles.buttonText}>My Classes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/profile')}>
                <Text style={styles.buttonText}>Account Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, marginBottom: 20 },
    button: { 
        backgroundColor: '#007AFF', 
        padding: 10, 
        borderRadius: 5,
        width: '25%',
        alignItems: 'center',
        marginBottom: 10
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        marginTop: 10
    },
    buttonText: { color: '#fff', fontSize: 16 },
});
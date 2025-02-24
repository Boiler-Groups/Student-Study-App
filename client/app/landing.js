import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';

export default function Landing() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Header />
            <Text style={styles.title}>Welcome to Boiler Groups</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, marginBottom: 20 },
    button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 5 },
    buttonText: { color: '#fff', fontSize: 16 },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '@env';
import Header from '../components/Header';

export default function Register() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    /**
     * A valid email has:
     * - One or more characters before the @ symbol
     * - An @ symbol
     * - At least 2 characters after the @ symbol
     * - A dot
     * - At least 2 characters after the dot
     */
    const validateEmail = (email) => {
        return /(.+)@(.+){2,}\.(.+){2,}/.test(email);
    }

    const handleRegister = async () => {
        setLoading(true);
        setErrorMessage('');

        if (!validateEmail(email)) {
            setErrorMessage('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                router.push('/landing');
            } else {
                setErrorMessage('Registration failed. Please try again.');
            }
        } catch (error) {
            setErrorMessage('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header />
            <Text style={styles.title}>Register</Text>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Display Name"
                value={username}
                onChangeText={setUsername}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    input: {
        width: '25%',
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    button: {
        width: '25%',
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: { color: '#fff', fontSize: 16 },
    link: { color: '#007AFF', marginTop: 5 },
    errorText: { color: 'red', marginBottom: 10 },
});

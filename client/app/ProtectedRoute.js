import { useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { AuthContext } from './AuthContext';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProtectedRoute({ children }) {
    const { token, loading } = useContext(AuthContext);
    const router = useRouter();
    const segments = useSegments(); // Get current route

    // Check if user is authenticated
    useEffect(() => {
        if (!loading) {
            const checkToken = AsyncStorage.getItem('token');
            if (!checkToken && segments[0] !== 'login' && segments[0] !== 'register') {
                router.replace('/login');
            }
        }
    }, [loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return children;
}

import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { useRouter, useRootNavigationState } from "expo-router";
import { API_URL } from "@env";
import { AuthContext } from "./AuthContext";
import Header from "../components/Header";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const { user, login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async () => {
        setErrorMessage("");
        try {
            console.log(`API_URL: ${process.env.API_URL}`)
            console.log(`Test: ${process.env.TEST}`)
            const response = await fetch(`${process.env.API_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                await AsyncStorage.setItem('token', data.token);
                router.replace('/landing');
            } else {
                setErrorMessage("Invalid credentials");
            }
        } catch (error) {
            console.log(error);
            setErrorMessage("Login failed. Please try again.");
        }
    };


    return (
        <View style={styles.container}>
            <Header />
            <Text style={styles.title}>Login</Text>

            {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

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

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? "Logging in..." : "Login"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.link}>Don't have an account? Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 15 },
    input: {
        width: "25%",
        height: 40,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    button: {
        width: "25%",
        backgroundColor: "#007AFF",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginBottom: 10,
    },
    buttonText: { color: "#fff", fontSize: 16 },
    link: { color: "#007AFF", marginTop: 5 },
    errorText: { color: "red", marginBottom: 10 },
});

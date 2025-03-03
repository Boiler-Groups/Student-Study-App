import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState();

    // Load user from AsyncStorage when the app starts
    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await AsyncStorage.getItem("userInfo");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            setLoading(false);
        };
        loadUser();
        const loadToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            if (storedToken) {
                setToken(storedToken);
            }
            setLoading(false);
        };
        loadToken();
    }, []);

    const login = async (data) => {
        setLoading(true);

        await AsyncStorage.setItem("userToken", data.token); // Save token
        await AsyncStorage.setItem("userInfo", JSON.stringify(data.userInfo)); // Save user data
        setToken(data.token);
        setUser(data.userInfo);
        setLoading(false);
        return;
    };

    const logout = async () => {
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("userInfo");
        setToken(null);
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

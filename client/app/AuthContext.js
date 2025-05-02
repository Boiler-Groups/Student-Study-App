import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { setOnlineStatus, getCurrentUser } from './api/user';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState();

  // Load token when app starts
  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
      }
      setLoading(false);
    };
    loadToken();
  }, []);

  // These functions are still useful elsewhere in your app
  const markUserOnline = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const userRes = await getCurrentUser({ token });
    await setOnlineStatus(userRes.data._id, true, token);
  };

  const markUserOffline = async (token) => {
    try {
      const userRes = await getCurrentUser({ token });
      await setOnlineStatus(userRes.data._id, false, token);
    } catch (err) {
      console.error("Failed to mark user offline:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ loading, token, markUserOnline, markUserOffline }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

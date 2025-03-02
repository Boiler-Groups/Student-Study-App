import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { usePathname } from "expo-router";
import { AuthProvider } from "./AuthContext";
import { useSegments } from "expo-router";
import ProtectedRoute from "./ProtectedRoute";

export default function RootLayout() {
  const pathname = usePathname();

  const segments = useSegments();
  const isAuthPage = segments[0] === "login" || segments[0] === "register";

  useEffect(() => {
    document.title = "Boiler Groups";
  });

  return (
    <AuthProvider>
      <SafeAreaProvider>
        {isAuthPage ? (
          <Stack>
            {/* Non-logged-in routes go here */}
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
          </Stack>
        ) : (
          <ProtectedRoute>
            <Stack>
              {/* Protected routes go here (anything you need to be logged in to access) */}
              <Stack.Screen name="landing" options={{ headerShown: false }} />
              <Stack.Screen name="home" options={{ headerShown: false }} />
              <Stack.Screen name="messages" options={{ headerShown: true }} />
            </Stack>
          </ProtectedRoute>
        )}
      </SafeAreaProvider>
    </AuthProvider>
  );
}

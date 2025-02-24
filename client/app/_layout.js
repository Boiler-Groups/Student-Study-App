import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = 'Boiler Groups';
  });

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

/**
 * app/_layout.js — Root layout with auth gate
 *
 * - Loads fonts
 * - Watches auth state from AsyncStorage via useAuth()
 * - If not logged in → redirect to /auth
 * - If logged in and on /auth → redirect to /(tabs)
 */

import { useEffect } from 'react';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { useAuth } from '../hooks/useAuth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSerifDisplay_400Regular,
  });

  const { user, loading: authLoading } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!fontsLoaded || authLoading) return;
    SplashScreen.hideAsync();

    const onAuthScreen = segments[0] === 'auth';

    if (!user && !onAuthScreen) {
      router.replace('/auth');
    } else if (user && onAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [fontsLoaded, authLoading, user, segments]);

  if (!fontsLoaded || authLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
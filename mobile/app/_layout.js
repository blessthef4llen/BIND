/**
 * app/_layout.js — Root layout with auth gate
 */

import { useEffect, useCallback } from 'react';
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
    // Wait for both fonts AND auth state to be ready
    if (!fontsLoaded || authLoading) return;

    SplashScreen.hideAsync();

    const currentRoute = segments[0];

    // Routes that don't require login
    const publicRoutes = ['', undefined, 'index', 'auth'];
    const isPublic = publicRoutes.includes(currentRoute);

    if (!user && !isPublic) {
      // No token + trying to access a protected screen → send to auth
      router.replace('/auth');
    } else if (user && currentRoute === 'auth') {
      // Has token + on auth screen → skip to app
      router.replace('/(tabs)');
    }
    // Otherwise: let the current route render as-is
    // (splash stays as splash, tabs stay as tabs)

  }, [fontsLoaded, authLoading, user, segments]);

  // Keep splash screen up until both fonts and auth are resolved
  if (!fontsLoaded || authLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
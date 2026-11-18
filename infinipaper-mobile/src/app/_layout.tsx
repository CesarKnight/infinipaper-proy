import { useEffect, useState } from "react";
import { useSegments, useRouter, Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplash } from "../components/animated-splash";
import { AuthProvider, useAuth } from "../lib/auth";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require("../../assets/fonts/Inter-Regular.ttf"),
    InterMedium: require("../../assets/fonts/Inter-Medium.ttf"),
    InterSemiBold: require("../../assets/fonts/Inter-SemiBold.ttf"),
    Fraunces: require("../../assets/fonts/Fraunces-SemiBold.ttf"),
  });
  const [showSplash, setShowSplash] = useState(true);
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="auto" />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
          {showSplash ? <AnimatedSplash onFinish={() => setShowSplash(false)} /> : null}
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    if (user && inAuth) router.replace("/(tabs)");
  }, [loading, router, segments, user]);

  if (loading) return null;
  return null;
}

export function RootRedirect() {
  return <Redirect href="/(tabs)" />;
}

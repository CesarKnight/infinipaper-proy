import { useEffect, useState } from "react";
import { useSegments, useRouter, Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AnimatedSplash } from "../components/animated-splash";
import { AuthProvider, useAuth } from "../lib/auth";
import { ThemeProvider, useAppTheme } from "../theme";

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
  const ready = fontsLoaded || Boolean(fontError);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppBootstrap fontsReady={ready} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppBootstrap({ fontsReady }: { fontsReady: boolean }) {
  const { ready: themeReady, colors, isDark } = useAppTheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!fontsReady || !themeReady) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, themeReady]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  if (!fontsReady || !themeReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <AuthGate />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        {showSplash ? (
          <AnimatedSplash onFinish={() => setShowSplash(false)} />
        ) : null}
      </AuthProvider>
    </QueryClientProvider>
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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, Platform, useColorScheme } from "react-native";
import {
  getThemePreference,
  setThemePreference,
} from "../lib/theme-storage";
import {
  colors,
  gradients,
  type ResolvedTheme,
  type ThemeColors,
  type ThemePreference,
} from "./tokens";

export * from "./tokens";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  ready: boolean;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: ThemeColors;
  gradients: (typeof gradients)[ResolvedTheme];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] =
    useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getThemePreference().then((stored) => {
      if (!active) return;
      setPreferenceState(stored);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    Appearance.setColorScheme(preference === "system" ? "auto" : preference);
  }, [preference]);

  const resolved: ResolvedTheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;
  const isDark = resolved === "dark";

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await setThemePreference(next);
    } catch {
      // La preferencia se aplica en memoria aunque no se pueda persistir.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      ready,
      resolved,
      isDark,
      colors: colors[resolved],
      gradients: gradients[resolved],
    }),
    [isDark, preference, ready, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme debe usarse dentro de ThemeProvider");
  }
  return context;
}

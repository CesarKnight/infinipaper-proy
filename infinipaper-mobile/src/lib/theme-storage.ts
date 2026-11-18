import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ThemePreference } from "../theme/tokens";

const KEY = "infinipaper.theme";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export async function getThemePreference(): Promise<ThemePreference> {
  try {
    const value =
      Platform.OS === "web"
        ? globalThis.localStorage?.getItem(KEY) ?? null
        : await SecureStore.getItemAsync(KEY);
    return isThemePreference(value) ? value : "system";
  } catch {
    return "system";
  }
}

export async function setThemePreference(
  preference: ThemePreference,
): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(KEY, preference);
    return;
  }
  await SecureStore.setItemAsync(KEY, preference);
}

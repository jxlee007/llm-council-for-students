import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      }
      return SecureStore.getItemAsync(key);
    } catch (err) {
      console.error("TokenCache getToken error:", err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(key, value);
        return;
      }
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("TokenCache saveToken error:", err);
      return;
    }
  },
  async clearToken(key: string) {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(key);
        return;
      }
      return SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error("TokenCache clearToken error:", err);
      return;
    }
  }
};

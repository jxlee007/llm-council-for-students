import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AlertCircle } from "lucide-react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AlertCircle size={48} color="#20c997" />
          </View>
          <Text style={styles.title}>Lost in Space</Text>
          <Text style={styles.description}>
            This route doesn't exist. Let's get you back to the LLM Council chamber safely.
          </Text>
          <Link href="/(tabs)" replace style={styles.link}>
            <Text style={styles.linkText}>Return to Safety</Text>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1419",
    padding: 24,
  },
  content: {
    alignItems: "center",
    backgroundColor: "#15202b",
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#38444d",
    width: "100%",
    maxWidth: 380,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(32, 201, 151, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#8899a6",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  link: {
    backgroundColor: "#20c997",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 9999,
    width: "100%",
    textAlign: "center",
  },
  linkText: {
    color: "#0f1419",
    fontSize: 16,
    fontWeight: "bold",
  },
});

import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ImageBackground,
  StyleSheet,
  StatusBar
} from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Chrome, Apple, Cpu } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Warm up browser for Android (crucial for smooth auth)
const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: "oauth_apple" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignInWithOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Starting OAuth flow for ${strategy}...`);
      
      const startFlow = strategy === "oauth_google" ? startGoogleFlow : startAppleFlow;
      
      // CRITICAL: Use native scheme for Expo Go in development
      // In production builds, the custom scheme will be used instead
      const redirectUrl = AuthSession.makeRedirectUri({
        native: "llm-council://",
      });
      console.log("Using redirect URL:", redirectUrl);
      
      const { createdSessionId, signIn, signUp, setActive } = await startFlow({ redirectUrl });
      
      console.log("OAuth result:", { 
        createdSessionId, 
        signInStatus: signIn?.status,
        signUpStatus: signUp?.status 
      });

      // Case 1: Session was created immediately
      if (createdSessionId && setActive) {
        console.log("Session created, setting active...");
        await setActive({ session: createdSessionId });
        console.log("Session set active!");
        // Navigation will happen automatically via auth guard in _layout.tsx
        return;
      }

      // Case 2: SignUp flow completed
      if (signUp?.status === "complete" && signUp.createdSessionId && setActive) {
        console.log("SignUp complete, setting session...");
        await setActive({ session: signUp.createdSessionId });
        return;
      }

      // Case 3: SignIn flow completed
      if (signIn?.status === "complete" && signIn.createdSessionId && setActive) {
        console.log("SignIn complete, setting session...");
        await setActive({ session: signIn.createdSessionId });
        return;
      }

      // Case 4: Flow incomplete
      console.log("OAuth flow incomplete:", { signIn, signUp });
      setError("Sign-in incomplete. Please try again.");
      
    } catch (err: any) {
      console.error("OAuth error:", JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2000&auto=format&fit=crop' }}
        style={styles.background}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {/* Spacer for top */}
            <View style={styles.header} />

            {/* Logo & Title */}
            <View style={styles.logoContainer}>
              <View style={styles.iconCircle}>
                <Cpu size={40} color="white" />
              </View>
              <Text style={styles.brandTitle}>LLM Council</Text>
            </View>

            {/* Auth Buttons */}
            <View style={styles.buttonContainer}>
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity 
                onPress={() => onSignInWithOAuth("oauth_apple")}
                style={styles.appleButton}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Apple size={20} color="black" />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => onSignInWithOAuth("oauth_google")}
                style={styles.googleButton}
                activeOpacity={0.8}
                disabled={loading}
              >
                <View style={styles.googleIconContainer}>
                  <Chrome size={20} color="#4285F4" />
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              {loading && (
                <ActivityIndicator color="white" style={{ marginTop: 20 }} />
              )}
            </View>

            {/* Footnote */}
            <View style={styles.footer}>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Privacy policy</Text>
              </TouchableOpacity>
              <View style={styles.dot} />
              <TouchableOpacity>
                <Text style={styles.footerLink}>Terms of service</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  appleButton: {
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appleButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  googleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
  },
  googleIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  errorBanner: {
    backgroundColor: 'rgba(220,38,38,0.8)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerLink: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  }
});

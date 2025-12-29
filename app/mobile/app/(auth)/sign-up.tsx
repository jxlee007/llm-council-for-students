import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, User, ChevronRight, ArrowLeft } from "lucide-react-native";

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle account creation
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError(null);

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Handle email verification
  const onPressVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-white p-6">
        <View className="flex-1 justify-center">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Verify email</Text>
          <Text className="text-gray-500 mb-8">Enter the verification code sent to {emailAddress}</Text>
          
          <View className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 mb-6">
            <TextInput
              value={code}
              placeholder="Verification Code"
              placeholderTextColor="#9ca3af"
              onChangeText={setCode}
              className="text-gray-900 text-lg py-1 text-center"
              keyboardType="number-pad"
            />
          </View>

          {error && <Text className="text-red-600 mb-4 text-center">{error}</Text>}

          <TouchableOpacity 
            onPress={onPressVerify}
            disabled={loading}
            className={`h-14 rounded-2xl items-center justify-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Verify Email</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-8">
            <ArrowLeft size={24} color="#4f46e5" />
          </TouchableOpacity>

          <View className="mb-10">
            <Text className="text-4xl font-extrabold text-indigo-600 mb-2">Create Account</Text>
            <Text className="text-lg text-gray-500">Join the council and start chatting.</Text>
          </View>

          {error && (
            <View className="bg-red-50 p-4 rounded-xl mb-6">
              <Text className="text-red-600 text-sm font-medium">{error}</Text>
            </View>
          )}

          <View className="space-y-4 mb-8">
            <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 border border-gray-100">
              <User size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                placeholder="First Name"
                placeholderTextColor="#9ca3af"
                value={firstName}
                onChangeText={setFirstName}
                className="flex-1 text-gray-900 text-base py-1"
              />
            </View>

            <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 border border-gray-100 mt-4">
              <User size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                placeholder="Last Name"
                placeholderTextColor="#9ca3af"
                value={lastName}
                onChangeText={setLastName}
                className="flex-1 text-gray-900 text-base py-1"
              />
            </View>

            <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 border border-gray-100 mt-4">
              <Mail size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                autoCapitalize="none"
                placeholder="Email address"
                placeholderTextColor="#9ca3af"
                value={emailAddress}
                onChangeText={setEmailAddress}
                className="flex-1 text-gray-900 text-base py-1"
              />
            </View>

            <View className="bg-gray-50 rounded-2xl flex-row items-center px-4 py-3 border border-gray-100 mt-4">
              <Lock size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="flex-1 text-gray-900 text-base py-1"
              />
            </View>
          </View>

          <TouchableOpacity 
            onPress={onSignUpPress}
            disabled={loading}
            activeOpacity={0.8}
            className={`h-14 rounded-2xl flex-row items-center justify-center ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Text className="text-white font-bold text-lg mr-2">Sign Up</Text>
                <ChevronRight size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <View className="mt-10 items-center pb-10">
            <Text className="text-gray-500">
              Already have an account?{" "}
              <Text 
                onPress={() => router.push("/(auth)/login")} 
                className="text-indigo-600 font-bold"
              >
                Log In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { Redirect } from "expo-router";

/**
 * Sign-up redirects to sign-in since OAuth handles both flows.
 */
export default function SignUp() {
  return <Redirect href="/(auth)/sign-in" />;
}

// Mocking useAuth for the web playground
export const useCouncilAuth = () => ({
  isLoaded: true,
  isSignedIn: true, // We pretend the web guest is signed in so the UI renders
  userId: 'guest_web_user',
  sessionId: 'guest_web_session',
  getToken: async () => null,
  signOut: async () => {
    console.log("Guest user signed out");
  },
});

// Mocking useUser for UI elements (like profile pictures in the settings sidebar)
export const useCouncilUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: 'guest_web_user',
    fullName: 'Web Guest',
    firstName: 'Guest',
    primaryEmailAddress: { emailAddress: 'guest@council.local' },
    emailAddresses: [{ emailAddress: 'guest@council.local' }],
    imageUrl: 'https://www.gravatar.com/avatar/0?d=mp&f=y', // Default avatar
  }
});

// Mocking useClerk for settings page or other areas
export const useCouncilClerk = () => ({
  signOut: async () => {
    console.log("Guest user signed out");
    return Promise.resolve();
  }
});

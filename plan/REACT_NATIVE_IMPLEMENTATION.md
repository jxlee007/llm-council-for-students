# React Native Implementation Guide - LLM Council App

## 💱 Converting Tailwind Web to React Native (NativeWind)

### Architecture: Same Tailwind, Two Platforms

```
Design System (Tailwind Classes)
        ↑
        ↑
    ⮕ NativeWind Bridge ⮕
   /                      \
  /                        \
React Native               Web React
(Expo)                     (Next.js/Bolt)
  │                         │
  └─ iPhone              └─ Desktop
  └─ Android             └─ Tablet
```

### File Structure
```
llm-council-mobile/
├─ app/
│  ├─ (auth)/
│  │  ├─ onboarding.tsx      # Slides, colors, animations same as web
│  │  ├─ sign-in.tsx         # Phone OTP, OAuth buttons
│  │  └─ api-key-setup.tsx  # BYOK configuration
│  ├─ (tabs)/
│  │  ├─ _layout.tsx        # Bottom tab navigation
│  │  ├─ index.tsx          # Conversations list
│  │  ├─ chat/
│  │  │  ├─ [id].tsx        # Chat interface with 3-stage process
│  │  │  └─ components/     # Stage1Tabs, Stage2Rankings, Stage3Final
│  │  ├─ configure.tsx      # Council model picker
│  │  └─ settings.tsx       # Account, subscription, preferences
│  ├─ _layout.tsx        # Root layout, auth state
│  └─ paywall.tsx        # RevenueCat + Razorpay billing
├─ components/
│  ├─ ui/
│  │  ├─ Button.tsx        # NativeWind pressable
│  │  ├─ Input.tsx         # TextInput with validation
│  │  ├─ Card.tsx          # Responsive card component
│  │  ├─ StageIndicator.tsx
│  │  └─ LoadingSpinner.tsx
│  ├─ council/
│  │  ├─ MessageBubble.tsx  # User/assistant messages
│  │  ├─ Stage1Tabs.tsx    # Swipeable model responses
│  │  ├─ Stage2Rankings.tsx # Peer ranking visualization
│  │  ├─ Stage3Final.tsx   # Chairman synthesis
│  └─ payment/
│     ├─ PaywallCard.tsx
│     ├─ PricingTable.tsx
│     └─ PaymentMethodPicker.tsx
├─ lib/
│  ├─ api.ts           # Backend API client
│  ├─ convex.ts        # Convex realtime queries
│  ├─ hooks.ts         # Custom hooks (useAuth, useCouncil, etc.)
│  ├─ theme.ts         # NativeWind theme config
│  ├─ constants.ts     # Global constants, API endpoints
│  └─ types.ts         # TypeScript interfaces
├─ assets/
│  ├─ icons/           # .png exports from design system
│  ├─ animations/      # Lottie JSONs for 3-stage process
│  └─ fonts/           # Custom fonts if needed
├─ tailwind.config.js # NativeWind configuration
├─ app.json           # Expo config
└─ package.json       # Dependencies
```

---

## 🚀 Step-by-Step Implementation

### Phase 1: Project Setup (Day 1)

#### 1. Initialize Expo with TypeScript
```bash
npx create-expo-app llm-council-mobile -t tabs
cd llm-council-mobile

# Install key dependencies
npm install nativewind tailwindcss
npx tailwindcss init

# Add Tailwind to app.json
npm install @react-native-async-storage/async-storage
npm install expo-router expo-font expo-splash-screen
npm install @clerk/clerk-expo
npm install convex react-convex
npm install expo-secure-store
npm install expo-image-picker expo-document-picker
npm install react-native-purchases  # RevenueCat
npm install react-native-razorpay
npm install react-native-flash-list
npm install react-native-markdown-display
npm install zustand  # State management
```

#### 2. Configure Tailwind for NativeWind

**tailwind.config.js:**
```javascript
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};
```

**app.json (Tailwind config):**
```json
{
  "expo": {
    "plugins": [
      [
        "nativewind/babel",
        {
          "input": "./tailwind.config.js"
        }
      ]
    ]
  }
}
```

#### 3. Global Styles

**app/_layout.tsx:**
```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import '../global.css'; // NativeWind CSS import

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk: require('../assets/fonts/SpaceGrotesk.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return null; // Splash screen still showing
  }

  SplashScreen.hideAsync();

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**global.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom animations for React Native */
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes slide-up {
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### Phase 2: Core Components (Days 2-3)

#### 1. Reusable Button Component

**components/ui/Button.tsx:**
```typescript
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useClassName } from 'nativewind';

const buttonStyles = cva('px-4 py-3 rounded-xl flex items-center justify-center', {
  variants: {
    variant: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-100',
      outline: 'border-2 border-gray-300',
      ghost: 'bg-transparent',
      danger: 'bg-red-500',
    },
    size: {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4',
    },
    disabled: {
      true: 'opacity-50',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

const textStyles = cva('font-semibold text-center', {
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-gray-900',
      outline: 'text-gray-900',
      ghost: 'text-gray-900',
      danger: 'text-white',
    },
  },
});

interface ButtonProps extends VariantProps<typeof buttonStyles> {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ...props
}: ButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        buttonStyles({ variant, size, disabled: disabled || loading }),
        'active:scale-95' // Bouncy press effect
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={textStyles({ variant })}>{label}</Text>
      )}
    </Pressable>
  );
};
```

#### 2. Message Bubble Component (Responsive)

**components/council/MessageBubble.tsx:**
```typescript
import { View, Text } from 'react-native';
import { useWindowDimensions } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export const MessageBubble = ({ role, content, timestamp }: MessageBubbleProps) => {
  const { width } = useWindowDimensions();
  
  // Responsive max width
  const maxWidth = width > 768 ? width * 0.6 : width * 0.8;
  const isUser = role === 'user';

  return (
    <View
      className={cn(
        'mb-4 flex',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <View
        className={cn(
          'rounded-2xl px-4 py-3',
          isUser
            ? 'bg-blue-500 rounded-tr-none'
            : 'bg-gray-200 rounded-tl-none'
        )}
        style={{ maxWidth }}
      >
        <Markdown
          style={{
            text: {
              color: isUser ? 'white' : '#111827',
              fontSize: 14,
              lineHeight: 20,
            },
          }}
        >
          {content}
        </Markdown>
        {timestamp && (
          <Text
            className={cn(
              'text-xs mt-1',
              isUser ? 'text-blue-100' : 'text-gray-600'
            )}
          >
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
};
```

#### 3. Stage Progress Indicator

**components/council/StageIndicator.tsx:**
```typescript
import { View, Text, Dimensions } from 'react-native';
import { Animated } from 'react-native';

interface StageIndicatorProps {
  currentStage: 1 | 2 | 3;
}

export const StageIndicator = ({ currentStage }: StageIndicatorProps) => {
  const { width } = Dimensions.get('window');
  const isHorizontal = width > 768;

  if (isHorizontal) {
    // Desktop: Horizontal layout
    return (
      <View className="flex-row items-center justify-between px-6 py-4 bg-white mb-4 rounded-xl">
        {[1, 2, 3].map((stage, idx) => (
          <View key={stage} className="flex-1 items-center">
            <View
              className={cn(
                'w-3 h-3 rounded-full mb-2',
                currentStage > stage
                  ? 'bg-green-500'
                  : currentStage === stage
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-gray-300'
              )}
            />
            <Text className="text-xs font-semibold text-gray-700">
              Stage {stage}
            </Text>
            <Text className="text-xs text-gray-500">
              {stage === 1
                ? 'Council'
                : stage === 2
                ? 'Rankings'
                : 'Synthesis'}
            </Text>
            {idx < 2 && (
              <View className="flex-1 h-0.5 bg-gray-300 mx-2 absolute -right-1/2" />
            )}
          </View>
        ))}
      </View>
    );
  } else {
    // Mobile: Vertical layout (centered)
    return (
      <View className="items-center mb-6">
        {[1, 2, 3].map((stage, idx) => (
          <View key={stage} className="items-center mb-4">
            <View
              className={cn(
                'w-3 h-3 rounded-full mb-2',
                currentStage > stage
                  ? 'bg-green-500'
                  : currentStage === stage
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              )}
            />
            <Text className="text-xs font-semibold text-gray-700">Stage {stage}</Text>
            {idx < 2 && <View className="w-0.5 h-6 bg-gray-300 mt-2" />}
          </View>
        ))}
      </View>
    );
  }
};
```

---

### Phase 3: Auth Flows (Days 3-4)

#### Clerk Integration with Phone OTP

**app/(auth)/sign-in.tsx:**
```typescript
import { useSignIn } from '@clerk/clerk-expo';
import { useCallback, useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button';

export default function SignIn() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [loading, setLoading] = useState(false);

  const handlePhoneSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      // Send OTP
      const firstFactor = await signIn.create({
        strategy: 'phone_code',
        phoneNumber,
      });

      setActive({ session: firstFactor.createdSessionId });
    } catch (err: any) {
      console.error('Sign-in error:', err.errors[0].message);
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, signIn, isLoaded, setActive]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-4 py-8 justify-center">
        <Text className="text-3xl font-bold mb-2">Welcome</Text>
        <Text className="text-gray-600 mb-8">Enter your phone number</Text>

        <View className="flex-row mb-4 gap-2">
          <TextInput
            value="+91"
            editable={false}
            className="w-16 px-3 py-3 border border-gray-300 rounded-lg text-center font-semibold"
          />
          <TextInput
            placeholder="9876543210"
            value={phoneNumber.replace('+91', '')}
            onChangeText={(text) => setPhoneNumber(`+91${text}`)}
            keyboardType="phone-pad"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
          />
        </View>

        <Button
          label={loading ? 'Sending...' : 'Send OTP'}
          onPress={handlePhoneSignIn}
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}
```

---

### Phase 4: Council Chat Interface (Days 5-7)

#### Main Chat Screen

**app/(tabs)/chat/[id].tsx:**
```typescript
import { View, ScrollView, FlatList } from 'react-native';
import { useConvex } from 'react-convex';
import { useLocalSearchParams } from 'expo-router';
import { StageIndicator } from '@/components/council/StageIndicator';
import { MessageBubble } from '@/components/council/MessageBubble';
import { Stage1Tabs } from '@/components/council/Stage1Tabs';
import { Stage2Rankings } from '@/components/council/Stage2Rankings';
import { Stage3Final } from '@/components/council/Stage3Final';
import { ChatInput } from '@/components/council/ChatInput';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const convex = useConvex();
  const [messages, setMessages] = useState([]);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [councilResults, setCouncilResults] = useState(null);

  // Fetch messages from Convex
  useEffect(() => {
    const unsubscribe = convex.watchQuery('messages', {
      conversationId: id,
    }).onUpdate((data) => {
      setMessages(data);
    });

    return () => unsubscribe();
  }, [id]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    // 1. Add user message
    const userMessage = await convex.mutation('addMessage', {
      conversationId: id,
      role: 'user',
      content,
      fileIds: [],
    });

    // 2. Call backend API for council query
    const response = await fetch('YOUR_API/api/council/query', {
      method: 'POST',
      body: JSON.stringify({
        query: content,
        council_models: ['model1', 'model2', 'model3', 'model4'],
        chairman_model: 'model1',
      }),
    });

    const results = await response.json();
    setCouncilResults(results);
    setCurrentStage(3); // All stages complete
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Stage Progress */}
      <StageIndicator currentStage={currentStage} />

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View className="px-4 py-2">
            <MessageBubble
              role={item.role}
              content={item.content}
              timestamp={new Date(item.createdAt).toLocaleTimeString()}
            />

            {/* Stage Results */}
            {item.stage1 && (
              <Stage1Tabs responses={item.stage1} />
            )}
            {item.stage2 && (
              <Stage2Rankings rankings={item.stage2} />
            )}
            {item.stage3 && (
              <Stage3Final synthesis={item.stage3} />
            )}
          </View>
        )}
        keyExtractor={(item) => item._id}
        inverted // Show latest at bottom
        ListFooterComponent={<View className="h-4" />}
      />

      {/* Input Area */}
      <ChatInput onSend={handleSendMessage} />
    </View>
  );
}
```

---

## 💰 Payment Integration

### RevenueCat Setup

**app/paywall.tsx:**
```typescript
import { useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';

export default function PaywallScreen() {
  const [offerings, setOfferings] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    // Initialize RevenueCat
    Purchases.setDebugLogsEnabled(true);
    Purchases.configure({
      apiKey: 'YOUR_REVENUECAT_API_KEY',
    });

    // Fetch offerings
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        setOfferings(offerings);
      } catch (error) {
        console.error('Error fetching offerings:', error);
      }
    };

    fetchOfferings();
  }, []);

  const handlePurchase = async (packageItem: any) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageItem);
      console.log('Purchase successful:', customerInfo);
      // Update user subscription status
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold mb-2">Upgrade to Premium</Text>

        {offerings?.current?.availablePackages.map((pkg) => (
          <PricingCard
            key={pkg.identifier}
            package={pkg}
            onPress={() => handlePurchase(pkg)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
```

### Razorpay UPI AutoPay

**app/razorpay-payment.tsx:**
```typescript
import RazorpayCheckout from 'react-native-razorpay';

const handleUPIPayment = async () => {
  try {
    const options = {
      description: 'LLM Council Premium',
      currency: 'INR',
      key: 'rzp_test_YOUR_KEY',
      amount: 14900, // ₹149 in paise
      name: 'LLM Council',
      prefill: {
        email: userEmail,
        contact: userPhone,
      },
      subscription_id: 'sub_id_from_backend', // For recurring
      theme: { color: '#3b82f6' },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        // Success: mandate created
        console.log(`Success: ${data.razorpay_payment_id}`);
        updateUserPremium(true);
      })
      .catch((error) => {
        console.error(`Error: ${error.code} ${error.description}`);
      });
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

---

## ✨ Deployment Checklist

### Build for iOS (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for TestFlight
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios
```

### Build for Android
```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android
```

---

## 🎓 Why NativeWind Works for LLM Council?

1. **Same Design System**: Tailwind classes work identically on mobile and web
2. **Responsive by Default**: `md:` and `lg:` breakpoints automatically adapt UI
3. **Performance**: Only the CSS you use gets bundled (tree-shaking)
4. **Team Efficiency**: One person can maintain both iOS/Android and web versions
5. **Fast Iteration**: Changes to Tailwind apply instantly via hot reload
6. **Accessibility**: NativeWind enforces semantic HTML equivalent on mobile

---

## 🚀 Quick Start Commands

```bash
# Clone prototype
git clone https://github.com/jxlee007/llm-council-ui-prototype

# Create mobile app from web prototype
npx create-expo-app llm-council-mobile
cd llm-council-mobile
npm install nativewind tailwindcss
npx tailwindcss init

# Run in Expo Go
npx expo start

# Build for production
eas build --platform ios
eas build --platform android
```


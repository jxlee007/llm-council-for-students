# Environment Variables Setup Guide

This guide explains how to manage environment variables for different build environments (development, preview, production) using EAS Build.

## 🔐 EAS Environment Variables vs GitHub Secrets

**Important:** For Expo/EAS builds, you use **EAS Environment Variables**, NOT GitHub Secrets.

- **EAS Environment Variables**: Used during EAS Build (cloud builds)
- **GitHub Secrets**: Used for GitHub Actions (if you set up CI/CD)
- **Local `.env` files**: Used for local development only

## 📋 Required Environment Variables

### **All Environments**

These should be set for development, preview, and production:

```bash
# Convex Backend
CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx  # or pk_live_xxxxx for production

# Sentry (for error tracking and source maps)
SENTRY_AUTH_TOKEN=sntrys_xxxxx
SENTRY_ORG=test-4ek
SENTRY_PROJECT=llm-council
```

### **Production-Specific**

Additional variables you might need for production:

```bash
# API URLs
EXPO_PUBLIC_API_URL=https://api.yourapp.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true

# Any other production-specific configs
```

## 🛠️ Method 1: Using EAS CLI (Recommended)

### **List Current Variables**

```bash
# List all variables for a specific environment
npx eas-cli env:list

# Then select the environment (development/preview/production)
```

### **Create New Variables**

#### **Interactive Mode (Easiest)**

```bash
# Create a new variable (will prompt for details)
npx eas-cli env:create
```

You'll be prompted for:

1. Variable name (e.g., `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`)
2. Variable value
3. Environment (development/preview/production/all)
4. Visibility (plain text or sensitive)

#### **Command-Line Mode (Faster)**

```bash
# Add a variable for production only
npx eas-cli env:create \
  --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --value "pk_live_xxxxx" \
  --environment production \
  --visibility sensitive

# Add a variable for all environments
npx eas-cli env:create \
  --name CONVEX_URL \
  --value "https://your-deployment.convex.cloud" \
  --environment development,preview,production \
  --visibility plain

# Add Sentry token (sensitive)
npx eas-cli env:create \
  --name SENTRY_AUTH_TOKEN \
  --value "sntrys_xxxxx" \
  --environment production \
  --visibility secret
```

### **Update Existing Variables**

```bash
# Update a variable
npx eas-cli env:update

# Delete a variable
npx eas-cli env:delete
```

## 🌐 Method 2: Using Expo Dashboard

1. **Go to Expo Dashboard**
   - Visit: https://expo.dev
   - Navigate to your project: `llm-council-consensus`

2. **Access Environment Variables**
   - Go to **Settings** → **Environment Variables**

3. **Create New Variable**
   - Click **Create**
   - Enter variable name (e.g., `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - Enter value
   - Select environment(s): development, preview, production
   - Choose visibility:
     - **Plain text**: Visible in build logs (for non-sensitive data)
     - **Sensitive**: Hidden from logs (for API keys, tokens)

4. **Save**

## 📝 Variable Visibility Levels

### **Plain Text**

- Visible in build logs
- Use for: URLs, feature flags, non-sensitive configuration

### **Sensitive**

- Hidden from build logs
- Use for: API keys, authentication tokens, secrets

### **Secret** (CLI only)

- Most secure option
- Never shown in any logs
- Use for: Critical secrets like `SENTRY_AUTH_TOKEN`

## 🔄 How EAS Loads Environment Variables

During a build, EAS loads variables in this order:

1. **EAS Environment Variables** (from dashboard/CLI)
   - Specific to the selected environment (development/preview/production)

2. **`eas.json` env section**
   - Hardcoded values in your config (like `EXPO_PUBLIC_APP_VARIANT`)

3. **Local `.env` files** (local builds only)
   - `.env.local`, `.env.development`, etc.

**Priority:** EAS Environment Variables > eas.json > .env files

## 📦 Current `eas.json` Configuration

Your current setup in `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_APP_VARIANT": "development"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_APP_VARIANT": "preview"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_APP_VARIANT": "production"
      }
    }
  }
}
```

## 🚀 Example: Setting Up Production Build

### **Step 1: Add Production Variables**

```bash
# Clerk Production Key
npx eas-cli env:create \
  --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --value "pk_live_your_production_key" \
  --environment production \
  --visibility sensitive

# Convex Production URL
npx eas-cli env:create \
  --name CONVEX_URL \
  --value "https://your-production.convex.cloud" \
  --environment production \
  --visibility plain

# Sentry Auth Token
npx eas-cli env:create \
  --name SENTRY_AUTH_TOKEN \
  --value "sntrys_your_token" \
  --environment production \
  --visibility secret
```

### **Step 2: Build with Production Profile**

```bash
npx eas-cli build --platform android --profile production
```

EAS will automatically load all production environment variables during the build.

## 🔍 Verifying Variables

### **Check What's Set**

```bash
# List variables for production
npx eas-cli env:list
# Then select "production"
```

### **During Build**

Check the build logs on https://expo.dev to see which variables were loaded (plain text ones will be visible).

## ⚠️ Important Notes

1. **Never commit secrets to Git**
   - `.env.local` is in `.gitignore`
   - Use EAS secrets for production

2. **`EXPO_PUBLIC_` prefix**
   - Variables with this prefix are embedded in the app bundle
   - Accessible via `process.env.EXPO_PUBLIC_*` in your code
   - Don't use this prefix for server-side secrets

3. **Build-time vs Runtime**
   - EAS variables are loaded at **build time**
   - To change them, you need to rebuild the app
   - For runtime config, use Expo Updates or remote config

4. **Local Development**
   - Use `.env.local` for local development
   - EAS variables are only used during EAS builds

## 🔗 Useful Links

- **EAS Environment Variables Docs**: https://docs.expo.dev/build-reference/variables/
- **Your Project Dashboard**: https://expo.dev/accounts/jxlee/projects/llm-council-consensus
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/

## 📞 Quick Reference Commands

```bash
# List variables
npx eas-cli env:list

# Create variable (interactive)
npx eas-cli env:create

# Create variable (command-line)
npx eas-cli env:create --name VAR_NAME --value "value" --environment production --visibility sensitive

# Update variable
npx eas-cli env:update

# Delete variable
npx eas-cli env:delete

# Build with specific profile
npx eas-cli build --platform android --profile production
```

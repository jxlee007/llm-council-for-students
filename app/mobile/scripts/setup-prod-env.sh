#!/bin/bash

# Quick setup script for EAS environment variables
# This script helps you add common environment variables for production

echo "🔐 EAS Environment Variables Setup"
echo "=================================="
echo ""
echo "This script will help you add environment variables for PRODUCTION builds."
echo ""

# Function to add a variable
add_variable() {
    local name=$1
    local prompt=$2
    local visibility=$3
    
    echo ""
    echo "📝 Setting up: $name"
    read -p "$prompt: " value
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipped (no value provided)"
        return
    fi
    
    echo "Adding $name to production environment..."
    npx eas-cli env:create \
        --name "$name" \
        --value "$value" \
        --environment production \
        --visibility "$visibility" \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully added $name"
    else
        echo "❌ Failed to add $name"
    fi
}

echo "Let's add your production environment variables:"
echo ""

# Clerk
add_variable "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" \
    "Enter your Clerk PRODUCTION publishable key (pk_live_...)" \
    "sensitive"

# Convex
add_variable "CONVEX_URL" \
    "Enter your Convex PRODUCTION URL (https://...convex.cloud)" \
    "plain"

# Sentry (if you want to override the one in .env.local)
read -p "Do you want to add a production-specific Sentry auth token? (y/N): " add_sentry
if [[ $add_sentry =~ ^[Yy]$ ]]; then
    add_variable "SENTRY_AUTH_TOKEN" \
        "Enter your Sentry auth token" \
        "secret"
fi

# API URL (if you have one)
read -p "Do you have a production API URL? (y/N): " has_api
if [[ $has_api =~ ^[Yy]$ ]]; then
    add_variable "EXPO_PUBLIC_API_URL" \
        "Enter your production API URL" \
        "plain"
fi

echo ""
echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "To view all production variables:"
echo "  npx eas-cli env:list"
echo ""
echo "To build with production profile:"
echo "  npx eas-cli build --platform android --profile production"
echo ""

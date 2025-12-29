/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./App.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: '#0f1419',
                foreground: '#ffffff',
                card: '#1a1f26',
                'card-foreground': '#ffffff',
                popover: '#242b33',
                'popover-foreground': '#ffffff',
                primary: {
                    DEFAULT: '#20c997', // accent-cyan
                    foreground: '#0f1419',
                    // Keep shades if needed, but DEFAULT is key
                    50: '#e0fcf4',
                    100: '#bef8e6',
                    200: '#8df0d3',
                    300: '#54e2bd',
                    400: '#20c997',
                    500: '#12a17b',
                    600: '#0a7d61',
                    700: '#086450',
                    800: '#0a5041',
                    900: '#0d4237',
                },
                secondary: {
                    DEFAULT: '#242b33', // bg-elevated
                    foreground: '#9aa0a6', // text-secondary
                },
                muted: {
                    DEFAULT: '#2a3139', // bg-input
                    foreground: '#6b7280', // text-muted
                },
                accent: {
                    DEFAULT: '#242b33',
                    foreground: '#20c997',
                    cyan: '#20c997',
                    blue: '#3b82f6',
                    purple: '#8b5cf6',
                    pink: '#ec4899',
                    orange: '#f59e0b',
                },
                destructive: {
                    DEFAULT: '#ef4444',
                    foreground: '#ffffff',
                },
                border: 'rgba(255, 255, 255, 0.1)',
                input: '#2a3139',
                ring: '#20c997',
                // Stage colors
                stage1: '#3b82f6', // Blue for individual responses
                stage2: '#f59e0b', // Amber for rankings
                stage3: '#10b981', // Emerald for final answer
                // Chat colors
                user: '#2563eb',
                assistant: '#f3f4f6',
            },
        },
    },
    plugins: [],
};

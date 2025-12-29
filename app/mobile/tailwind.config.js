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
                // Council theme colors
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
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

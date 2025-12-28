import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import Toast from 'react-native-toast-message';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Log error to monitoring service here
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView className="flex-1 bg-white justify-center items-center p-4">
                    <View className="items-center">
                        <Text className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</Text>
                        <Text className="text-gray-600 text-center mb-6">
                            {this.state.error?.message || "An unexpected error occurred."}
                        </Text>
                        <TouchableOpacity
                            onPress={this.handleRetry}
                            className="bg-indigo-600 px-6 py-3 rounded-lg"
                        >
                            <Text className="text-white font-semibold">Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            );
        }

        return (
            <>
                {this.props.children}
                <Toast />
            </>
        );
    }
}

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Updates from 'expo-updates';
import { AlertCircle } from 'lucide-react-native';
import { logError } from '../lib/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A generic ErrorBoundary to catch unhandled JS exceptions and prevent white screens.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      component: "ErrorBoundary",
      errorInfo,
      stack: error.stack
    });
  }

  handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-8 bg-gray-50">
          <View className="bg-red-50 p-6 rounded-3xl items-center border border-red-100 shadow-sm">
            <AlertCircle size={64} color="#ef4444" />
            <Text className="text-2xl font-bold text-gray-900 mt-6 text-center">
              Snapshot Error
            </Text>
            <Text className="text-gray-600 text-center mt-3 text-base">
              The LLM Council encountered an unexpected issue while processing your request.
            </Text>
            
            {this.state.error && (
              <View className="mt-6 bg-white p-4 rounded-xl border border-red-200 w-full">
                <Text className="text-red-500 text-xs font-mono" numberOfLines={5}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              className="mt-8 bg-primary-600 px-8 py-4 rounded-2xl w-full shadow-lg" 
              onPress={this.handleReload}
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-bold text-lg">Restart Council</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="mt-4" 
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text className="text-primary-600 font-semibold">Try to continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}


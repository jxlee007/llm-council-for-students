import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPlans, purchaseSubscription, Plan } from '../lib/payments';

export default function PaywallScreen() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await fetchPlans();
            setPlans(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (plan: Plan) => {
        setProcessing(true);
        try {
            await purchaseSubscription(plan.id);
            Alert.alert('Success', 'Subscription activated successfully!');
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Purchase failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="p-4">
                <Text className="text-2xl font-bold text-center mb-2 text-gray-900">Upgrade to Pro</Text>
                <Text className="text-center text-gray-600 mb-8">
                    Unlock the full potential of the LLM Council with our premium plans.
                </Text>

                <View className="space-y-4">
                    {plans.map((plan) => (
                        <View key={plan.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <Text className="text-xl font-bold text-gray-900">{plan.name}</Text>
                            <Text className="text-3xl font-bold text-indigo-600 mt-2">
                                ₹{plan.amount / 100}
                                <Text className="text-sm font-normal text-gray-500">/{plan.interval}</Text>
                            </Text>
                            <Text className="text-gray-600 mt-2 mb-4">{plan.description}</Text>

                            <TouchableOpacity
                                onPress={() => handlePurchase(plan)}
                                disabled={processing}
                                className={`w-full py-3 rounded-lg flex-row justify-center items-center ${
                                    processing ? 'bg-indigo-300' : 'bg-indigo-600'
                                }`}
                            >
                                {processing ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="text-white font-semibold text-lg">Subscribe Now</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

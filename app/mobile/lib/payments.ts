import RazorpayCheckout from 'react-native-razorpay';
import { API_BASE_URL } from './api';

export interface Plan {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    interval: string;
}

export async function fetchPlans(): Promise<Plan[]> {
    const response = await fetch(`${API_BASE_URL}/api/plans`);
    if (!response.ok) {
        throw new Error('Failed to fetch plans');
    }
    return response.json();
}

export async function purchaseSubscription(planId: string): Promise<boolean> {
    try {
        // 1. Create order on backend
        const orderResponse = await fetch(`${API_BASE_URL}/api/subscriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plan_id: planId }),
        });

        if (!orderResponse.ok) {
            const error = await orderResponse.json();
            throw new Error(error.detail || 'Failed to create subscription order');
        }

        const orderData = await orderResponse.json();

        // 2. Open Razorpay Checkout
        const options = {
            description: `Subscription for ${planId}`,
            image: 'https://i.imgur.com/3g7nmJC.png', // Replace with your logo
            currency: orderData.currency,
            key: orderData.key,
            amount: orderData.amount,
            name: 'LLM Council',
            order_id: orderData.id,
            prefill: {
                email: 'user@example.com',
                contact: '9999999999',
                name: 'User'
            },
            theme: { color: '#4f46e5' }
        };

        const checkoutData = await RazorpayCheckout.open(options);

        // 3. Verify payment on backend
        const verifyResponse = await fetch(`${API_BASE_URL}/api/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                razorpay_order_id: checkoutData.razorpay_order_id,
                razorpay_payment_id: checkoutData.razorpay_payment_id,
                razorpay_signature: checkoutData.razorpay_signature,
            }),
        });

        if (!verifyResponse.ok) {
            throw new Error('Payment verification failed');
        }

        return true;

    } catch (error) {
        console.error('Purchase failed:', error);
        throw error;
    }
}

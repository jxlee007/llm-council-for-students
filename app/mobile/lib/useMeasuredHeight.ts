import { useCallback, useRef, useState } from "react";
import { LayoutChangeEvent } from "react-native";

/**
 * A production-grade hook for safe, efficient layout measurement.
 * Prevents synthetic event pooling issues and redundant re-renders.
 */
export function useMeasuredHeight() {
    const [height, setHeight] = useState<number>(0);
    const lastHeightRef = useRef<number>(0);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        // Synchronously extract the primitive value from the event
        const nextHeight = e.nativeEvent.layout.height;

        // Prevent redundant updates (critical for animations)
        if (nextHeight === lastHeightRef.current) return;

        lastHeightRef.current = nextHeight;
        setHeight(nextHeight);
    }, []);

    return {
        height,
        onLayout,
    };
}

/**
 * Measurement hook that locks after the first valid measurement.
 * Useful for content that shouldn't reflow once visible (like Stage 3 Final Answer).
 */
export function useMeasuredHeightOnce() {
    const [height, setHeight] = useState<number>(0);
    const lockedRef = useRef(false);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        if (lockedRef.current) return;

        const nextHeight = e.nativeEvent.layout.height;
        if (nextHeight > 0) {
            setHeight(nextHeight);
            lockedRef.current = true;
        }
    }, []);

    return { height, onLayout };
}

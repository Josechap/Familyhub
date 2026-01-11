import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook to detect user idle state with multiple thresholds
 * Uses a single set of event listeners for efficiency
 *
 * @param {Object} options
 * @param {Array<{timeout: number, onIdle: function, id: string}>} options.thresholds - Array of idle thresholds
 * @param {function} options.onActive - Callback when user becomes active after being idle
 * @param {boolean} options.disabled - Disable the idle timer
 * @returns {Object} { idleStates, reset }
 */
export const useMultiIdleTimer = ({
    thresholds = [],
    onActive,
    disabled = false,
}) => {
    // Track which thresholds have been triggered
    const [idleStates, setIdleStates] = useState(() =>
        thresholds.reduce((acc, t) => ({ ...acc, [t.id]: false }), {})
    );

    const timeoutsRef = useRef({});
    const wasIdleRef = useRef(false);

    const handleActivity = useCallback(() => {
        if (disabled) return;

        // Clear all existing timeouts
        Object.values(timeoutsRef.current).forEach(clearTimeout);
        timeoutsRef.current = {};

        // If any threshold was triggered, call onActive
        if (wasIdleRef.current) {
            wasIdleRef.current = false;
            setIdleStates(thresholds.reduce((acc, t) => ({ ...acc, [t.id]: false }), {}));
            onActive?.();
        }

        // Set new timeouts for each threshold
        thresholds.forEach(threshold => {
            if (threshold.disabled) return;

            timeoutsRef.current[threshold.id] = setTimeout(() => {
                wasIdleRef.current = true;
                setIdleStates(prev => ({ ...prev, [threshold.id]: true }));
                threshold.onIdle?.();
            }, threshold.timeout);
        });
    }, [thresholds, onActive, disabled]);

    const reset = useCallback(() => {
        handleActivity();
    }, [handleActivity]);

    useEffect(() => {
        if (disabled) {
            Object.values(timeoutsRef.current).forEach(clearTimeout);
            timeoutsRef.current = {};
            return;
        }

        // Events to track
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'touchstart',
            'touchmove',
            'scroll',
            'wheel',
        ];

        // Add event listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Start initial timeouts asynchronously to avoid lint warning
        const initialTimeout = setTimeout(() => {
            thresholds.forEach(threshold => {
                if (threshold.disabled) return;
                timeoutsRef.current[threshold.id] = setTimeout(() => {
                    wasIdleRef.current = true;
                    threshold.onIdle?.();
                }, threshold.timeout);
            });
        }, 0);

        // Cleanup
        return () => {
            clearTimeout(initialTimeout);
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            Object.values(timeoutsRef.current).forEach(clearTimeout);
        };
    }, [handleActivity, disabled, thresholds]);

    return { idleStates, reset };
};

export default useMultiIdleTimer;

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook to detect user idle state
 * @param {Object} options
 * @param {number} options.timeout - Idle timeout in milliseconds
 * @param {function} options.onIdle - Callback when user becomes idle
 * @param {function} options.onActive - Callback when user becomes active after being idle
 * @param {boolean} options.disabled - Disable the idle timer
 * @returns {Object} { isIdle, reset }
 */
export const useIdleTimer = ({
    timeout = 5 * 60 * 1000, // Default 5 minutes
    onIdle,
    onActive,
    disabled = false,
}) => {
    const [isIdle, setIsIdle] = useState(false);
    const timeoutRef = useRef(null);
    const isIdleRef = useRef(false);

    const handleActivity = useCallback(() => {
        if (disabled) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // If was idle, trigger onActive
        if (isIdleRef.current) {
            isIdleRef.current = false;
            setIsIdle(false);
            onActive?.();
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            isIdleRef.current = true;
            setIsIdle(true);
            onIdle?.();
        }, timeout);
    }, [timeout, onIdle, onActive, disabled]);

    const reset = useCallback(() => {
        handleActivity();
    }, [handleActivity]);

    useEffect(() => {
        if (disabled) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
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

        // Start initial timeout
        handleActivity();

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [handleActivity, disabled]);

    return { isIdle, reset };
};

export default useIdleTimer;

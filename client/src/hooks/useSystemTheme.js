import { useState, useEffect } from 'react';

/**
 * Hook to detect system theme preference
 * Returns 'dark' or 'light' based on system preference
 */
export const useSystemTheme = () => {
    const [systemTheme, setSystemTheme] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        // Modern browsers support addEventListener
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Fallback for older browsers
        else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);

    return systemTheme;
};

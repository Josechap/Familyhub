import React, { useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Screensaver from './Screensaver';
import { useSystemTheme } from '../hooks/useSystemTheme';
import { useMultiIdleTimer } from '../hooks/useMultiIdleTimer';
import { setScreensaverActive } from '../features/appSlice';

const Layout = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { themeMode, idleReturnTimeout, screensaverTimeout } = useSelector((state) => state.settings);
    const { screensaverActive } = useSelector((state) => state.app);
    const systemTheme = useSystemTheme();

    // Auto-return to dashboard on idle (shorter timeout)
    const handleIdleReturn = useCallback(() => {
        // Don't navigate if already on dashboard or settings page
        if (location.pathname !== '/' && location.pathname !== '/settings') {
            navigate('/');
        }
    }, [navigate, location.pathname]);

    // Activate screensaver on longer idle (only if not on settings)
    const handleScreensaverIdle = useCallback(() => {
        if (location.pathname !== '/settings') {
            dispatch(setScreensaverActive(true));
        }
    }, [dispatch, location.pathname]);

    // Dismiss screensaver on activity
    const handleActive = useCallback(() => {
        if (screensaverActive) {
            dispatch(setScreensaverActive(false));
        }
    }, [dispatch, screensaverActive]);

    // Combine both idle behaviors into a single timer with multiple thresholds
    const idleThresholds = useMemo(() => [
        {
            id: 'dashboard-return',
            timeout: idleReturnTimeout * 60 * 1000,
            onIdle: handleIdleReturn,
            disabled: location.pathname === '/settings' || screensaverActive,
        },
        {
            id: 'screensaver',
            timeout: screensaverTimeout * 60 * 1000,
            onIdle: handleScreensaverIdle,
            disabled: location.pathname === '/settings',
        },
    ], [idleReturnTimeout, screensaverTimeout, handleIdleReturn, handleScreensaverIdle, location.pathname, screensaverActive]);

    // Single idle timer with multiple thresholds (7 event listeners instead of 14)
    useMultiIdleTimer({
        thresholds: idleThresholds,
        onActive: handleActive,
        disabled: location.pathname === '/settings',
    });

    // Calculate actual theme based on themeMode setting
    const actualTheme = themeMode === 'auto' ? systemTheme : themeMode;

    // Apply theme to body element
    useEffect(() => {
        const body = document.body;

        if (actualTheme === 'light') {
            body.classList.add('light');
        } else {
            body.classList.remove('light');
        }

        // Cleanup
        return () => {
            body.classList.remove('light');
        };
    }, [actualTheme]);

    // Handle screensaver dismiss
    const handleDismissScreensaver = useCallback(() => {
        dispatch(setScreensaverActive(false));
    }, [dispatch]);

    return (
        <div className="min-h-screen transition-colors duration-200">
            <main className="h-screen overflow-y-auto touch-scroll pb-safe px-4 pt-4">
                {children}
            </main>
            <BottomNav />

            {/* Screensaver overlay */}
            {screensaverActive && (
                <Screensaver onDismiss={handleDismissScreensaver} />
            )}
        </div>
    );
};

export default Layout;

import { useState, useEffect } from 'react';

export const useClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return {
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
        hours: time.getHours(),
    };
};

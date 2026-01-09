import React from 'react';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-dark-bg text-white">
            <main className="h-screen overflow-y-auto touch-scroll pb-safe px-4 pt-4">
                {children}
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;

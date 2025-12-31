import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-editorial-bg flex">
            <Sidebar />
            <main className="flex-1 ml-[80px] p-8 h-screen overflow-hidden">
                {children}
            </main>
        </div>
    );
};

export default Layout;

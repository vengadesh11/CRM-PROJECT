import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    children: React.ReactNode;
    title: string;
}

export default function Layout({ children, title }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex">
            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div
                className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ml-0 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}
            >
                <Header
                    title={title}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                />

                <main className="flex-1 p-6 overflow-y-auto bg-[#0a0e1a] text-white">
                    {children}
                </main>
            </div>
        </div>
    );
}

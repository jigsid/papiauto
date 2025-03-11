'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useDemoMode } from '@/context/demo-context'

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug?: string };
}) {
  const pathName = usePathname();
  const route = pathName?.split("/").pop() as string;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDemoMode, exitDemoMode } = useDemoMode();

  return (
    <section className="w-full h-full max-h-screen">
      <div className="flex flex-col h-screen">
        {isDemoMode && (
          <div className="bg-yellow-500 text-black py-2 px-4 flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-x-2">
              <span>
                You are in <strong>Demo Mode</strong> with full access to all features.
              </span>
              <button 
                onClick={exitDemoMode}
                className="ml-2 px-2 py-1 bg-black text-white rounded-md text-xs hover:bg-gray-800 transition-colors"
              >
                Exit Demo
              </button>
            </div>
          </div>
        )}
        <nav className="flex w-full items-center justify-between px-4 border-b h-16">
          {!isSidebarOpen ? (
            <Menu
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="block lg:hidden cursor-pointer"
            />
          ) : (
            <X
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="block lg:hidden cursor-pointer"
            />
          )}
          <div className="flex gap-x-3 items-center">
            {/* Theme toggle and account dropdown would go here */}
          </div>
        </nav>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar would go here */}
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </section>
  );
} 
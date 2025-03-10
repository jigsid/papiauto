'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import DemoBanner from '@/components/demo-banner'

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

  return (
    <section className="w-full h-full max-h-screen">
      <div className="flex flex-col h-screen">
        <DemoBanner />
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
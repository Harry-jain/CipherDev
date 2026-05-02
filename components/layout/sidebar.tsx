'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Cpu, Shield, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/models', label: 'Models', icon: Cpu },
  { href: '/audit', label: 'Privacy Audit', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64',
          'bg-gray-900/50 border-r border-gray-800/50 backdrop-blur-sm',
          'transition-transform duration-300',
          'md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800/50">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-100">CipherDev</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg',
                    'transition-colors duration-200',
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800/50">
            <p className="text-xs text-gray-500 text-center">
              Privacy-first AI • No data leaves your device
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

// Made with Bob

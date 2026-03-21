"use client";

import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Menu, Search, User, Moon, Sun } from 'lucide-react';

export default function Header() {
  const { theme, setTheme } = useStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 -ml-2 text-muted hover:text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display font-bold text-2xl tracking-wider text-foreground">
              LIVE<span className="text-brand">SCORE</span>FREE
            </span>
          </Link>
        </div>

        {/* Center: Desktop Nav (Hidden on Mobile) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="font-sans text-sm font-semibold tracking-wide text-foreground uppercase">
            Live Matches
          </Link>
          <Link href="/trending" className="font-sans text-sm font-semibold tracking-wide text-muted hover:text-foreground uppercase transition-colors">
            Trending
          </Link>
          <Link href="/news" className="font-sans text-sm font-semibold tracking-wide text-muted hover:text-foreground uppercase transition-colors">
            News
          </Link>
        </nav>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
          <a 
            href="https://ko-fi.com/livescorefree" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-[#FF5E5B] hover:bg-[#ff4744] text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors shadow-sm"
          >
            <span>Ko-fi</span>
          </a>
          <button className="p-2 text-muted hover:text-brand transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button 
            className="p-2 text-muted hover:text-accent transition-colors hidden sm:block"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="p-2 text-muted hover:text-foreground transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
        
      </div>
    </header>
  );
}
